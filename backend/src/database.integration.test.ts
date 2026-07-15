import http from "node:http";
import request from "supertest";
import { io as createSocketClient, type Socket } from "socket.io-client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { signToken } from "./lib/jwt.js";
import { prisma } from "./lib/prisma.js";
import { getAuthUser } from "./modules/auth/auth.service.js";
import { blockUser, listBlockedUsers, unblockUser } from "./modules/blocks/block.service.js";
import { addContact, deleteContact, listContacts } from "./modules/contacts/contact.service.js";
import { getMessages } from "./modules/messages/message.service.js";
import { closeSocket, initializeSocket } from "./realtime/socket.js";

const databaseSuite = describe.runIf(process.env.RUN_DATABASE_TESTS === "true");

const waitForSocket = <T>(subscribe: (resolve: (value: T) => void) => void, message: string) =>
  new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), 5_000);
    subscribe((value) => {
      clearTimeout(timeout);
      resolve(value);
    });
  });

databaseSuite("PostgreSQL integration", () => {
  beforeAll(() => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required when RUN_DATABASE_TESTS=true");

    const databaseName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
    if (!/(_test|_testing|_ci|_verify)$/i.test(databaseName)) {
      throw new Error(
        `Refusing destructive database tests against ${databaseName}. Use a disposable database ending in _test, _testing, _ci, or _verify.`,
      );
    }
  });

  beforeEach(async () => {
    await prisma.blockedUser.deleteMany();
    await prisma.message.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.profilePic.deleteMany();
    await prisma.user.deleteMany();
  });

  it("enforces unique user identities", async () => {
    const data = { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" };
    await prisma.user.create({ data });
    await expect(prisma.user.create({ data: { ...data, username: "ada-2" } })).rejects.toMatchObject({ code: "P2002" });
    await expect(prisma.user.create({ data: { ...data, email: "ada-2@example.com" } })).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("enforces contact identity and foreign-key constraints", async () => {
    const [owner, contact] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({
        data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" },
      }),
    ]);
    await prisma.contact.create({ data: { userId: owner.id, contactId: contact.id } });

    await expect(prisma.contact.create({ data: { userId: owner.id, contactId: contact.id } })).rejects.toMatchObject({
      code: "P2002",
    });
    await expect(prisma.contact.create({ data: { userId: owner.id, contactId: 2_147_483_647 } })).rejects.toMatchObject({
      code: "P2003",
    });
  });

  it("creates one-way contacts idempotently without changing the other user's sidebar", async () => {
    const [owner, contact] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({
        data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" },
      }),
    ]);

    await expect(addContact(owner.id, owner.username, contact.username)).resolves.toMatchObject({ created: true });
    await expect(addContact(owner.id, owner.username, contact.username)).resolves.toMatchObject({ created: false });
    expect(await prisma.contact.count()).toBe(1);
    expect(await listContacts(owner.id)).toEqual([expect.objectContaining({ id: contact.id, is_contact: true })]);
    expect(await listContacts(contact.id)).toEqual([]);
  });

  it("combines contacts and requests, preserves request activity on accept, and sorts empty contacts by name", async () => {
    const [owner, requestSender, alpha, zed] = await Promise.all([
      prisma.user.create({ data: { name: "Owner", username: "owner", email: "owner@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Requester", username: "requester", email: "requester@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Alpha", username: "alpha", email: "alpha@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Zed", username: "zed", email: "zed@example.com", passwordHash: "hash" } }),
    ]);
    await prisma.contact.createMany({
      data: [{ userId: owner.id, contactId: zed.id }, { userId: owner.id, contactId: alpha.id }],
    });
    const message = await prisma.message.create({
      data: { senderId: requestSender.id, receiverId: owner.id, content: "request" },
    });

    const beforeAccept = await listContacts(owner.id);
    expect(beforeAccept.map((user) => user.id)).toEqual([requestSender.id, alpha.id, zed.id]);
    expect(beforeAccept[0]).toMatchObject({ is_contact: false, last_message_time: message.createdAt.toISOString() });

    await addContact(owner.id, owner.username, requestSender.username);
    const afterAccept = await listContacts(owner.id);
    expect(afterAccept).toHaveLength(3);
    expect(afterAccept[0]).toMatchObject({
      id: requestSender.id,
      is_contact: true,
      last_message_time: message.createdAt.toISOString(),
    });
  });

  it("returns scoped profile-picture history and the latest contact avatar", async () => {
    const [owner, contact] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({
        data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" },
      }),
    ]);
    const older = await prisma.profilePic.create({
      data: { userId: contact.id, url: "https://example.com/older.png" },
    });
    const newer = await prisma.profilePic.create({
      data: { userId: contact.id, url: "https://example.com/newer.png" },
    });
    await prisma.profilePic.create({ data: { userId: owner.id, url: "https://example.com/owner.png" } });
    await prisma.contact.create({ data: { userId: owner.id, contactId: contact.id } });

    const authUser = await getAuthUser(contact.id);
    expect(authUser.profilePics.map((picture) => picture.profile_id)).toEqual([newer.id, older.id]);

    const contacts = await listContacts(owner.id);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      id: contact.id,
      is_contact: true,
      profilePic: { profile_id: newer.id, user_ref: contact.id },
    });
  });

  it("deletes shared messages while preserving the peer's independent contact", async () => {
    const [sender, receiver] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" } }),
    ]);
    await prisma.contact.createMany({
      data: [{ userId: sender.id, contactId: receiver.id }, { userId: receiver.id, contactId: sender.id }],
    });
    await prisma.message.create({ data: { senderId: sender.id, receiverId: receiver.id, content: "hello" } });

    await deleteContact(sender.id, receiver.id);

    expect(await prisma.contact.count()).toBe(1);
    expect(await prisma.message.count()).toBe(0);
    expect(await listContacts(receiver.id)).toEqual([expect.objectContaining({ id: sender.id, is_contact: true })]);
  });

  it("dismisses an unaccepted inbound message request", async () => {
    const [sender, receiver] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" } }),
    ]);
    await prisma.message.create({ data: { senderId: sender.id, receiverId: receiver.id, content: "hello" } });

    await deleteContact(receiver.id, sender.id);

    expect(await prisma.message.count()).toBe(0);
    expect(await listContacts(receiver.id)).toEqual([]);
  });

  it("returns the newest page in chronological display order", async () => {
    const [sender, receiver] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" } }),
    ]);
    for (const content of ["one", "two", "three"]) {
      await prisma.message.create({ data: { senderId: sender.id, receiverId: receiver.id, content } });
    }

    const page = await getMessages(sender.id, receiver.id, undefined, 2);
    expect(page.items.map((message) => message.content)).toEqual(["two", "three"]);
    expect(page.nextCursor).toBeTruthy();

    const olderPage = await getMessages(sender.id, receiver.id, page.nextCursor ?? undefined, 2);
    expect(olderPage.items.map((message) => message.content)).toEqual(["one"]);
    expect(olderPage.nextCursor).toBeNull();
  });

  it("supports the authenticated REST messaging flow", async () => {
    const app = createApp();
    const ada = request.agent(app);
    const grace = request.agent(app);

    const adaSignup = await ada.post("/api/auth/signup").send({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      username: "ada",
      password: "password-123",
    });
    const graceSignup = await grace.post("/api/auth/signup").send({
      fullName: "Grace Hopper",
      email: "grace@example.com",
      username: "grace",
      password: "password-123",
    });

    expect(adaSignup.status).toBe(201);
    expect(graceSignup.status).toBe(201);
    expect(adaSignup.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(adaSignup.headers["set-cookie"]?.[0]).toContain("SameSite=Strict");

    const edited = await ada.put("/api/auth/edit-profile").send({ name: "Ada Byron", username: "ada", number: "123" });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ name: "Ada Byron", number: "123" });

    const search = await ada.get("/api/auth/usersearch").query({ username: "grace" });
    expect(search.status).toBe(200);
    expect(search.body).toHaveLength(1);

    const added = await ada.post("/api/contacts").send({ username: "grace" });
    expect(added.status).toBe(201);
    expect(added.body.contactId).toBe(graceSignup.body.id);
    expect(added.body.contact).toMatchObject({ id: graceSignup.body.id, is_contact: true });
    expect(await prisma.contact.count()).toBe(1);

    const sent = await ada.post(`/api/messages/send/${graceSignup.body.id}`).send({ text: "hello" });
    expect(sent.status).toBe(201);
    expect(sent.body).toMatchObject({
      sender_id: adaSignup.body.id,
      receiver_id: graceSignup.body.id,
      content: "hello",
    });

    const conversation = await grace.get(`/api/messages/${adaSignup.body.id}`);
    expect(conversation.status).toBe(200);
    expect(conversation.body.items).toHaveLength(1);

    const removed = await ada.delete(`/api/contacts/${graceSignup.body.id}`);
    expect(removed.status).toBe(200);
    expect(await prisma.message.count()).toBe(0);

    const logout = await ada.post("/api/auth/logout");
    expect(logout.status).toBe(200);
    expect((await ada.get("/api/auth/check")).status).toBe(401);

    const login = await ada.post("/api/auth/login").send({ email: "ada@example.com", password: "password-123" });
    expect(login.status).toBe(200);
    expect((await ada.get("/api/auth/check")).status).toBe(200);
  });

  it("persists owner-managed blocks and prevents interaction in both directions until unblock", async () => {
    const app = createApp();
    const [ada, grace] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" } }),
    ]);
    await prisma.contact.createMany({
      data: [{ userId: ada.id, contactId: grace.id }, { userId: grace.id, contactId: ada.id }],
    });
    await prisma.message.create({ data: { senderId: ada.id, receiverId: grace.id, content: "hello" } });

    const blocked = await request(app)
      .post(`/api/blocks/${grace.id}`)
      .set("Cookie", `jwt=${signToken(ada.id)}`);
    expect(blocked.status).toBe(201);
    expect(blocked.body.blockedUser).toMatchObject({ id: grace.id, username: grace.username });
    expect((await listBlockedUsers(ada.id))).toEqual([expect.objectContaining({ id: grace.id })]);
    expect(await prisma.contact.count()).toBe(0);
    expect(await prisma.message.count()).toBe(0);

    for (const [senderId, receiverId] of [[ada.id, grace.id], [grace.id, ada.id]]) {
      const sent = await request(app)
        .post(`/api/messages/send/${receiverId}`)
        .set("Cookie", `jwt=${signToken(senderId)}`)
        .send({ text: "blocked" });
      expect(sent.status).toBe(403);
      expect(sent.body.code).toBe("USER_BLOCKED");
    }
    expect(
      (await request(app).get(`/api/messages/${ada.id}`).set("Cookie", `jwt=${signToken(grace.id)}`)).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/contacts")
          .set("Cookie", `jwt=${signToken(grace.id)}`)
          .send({ username: ada.username })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get("/api/auth/usersearch")
          .set("Cookie", `jwt=${signToken(grace.id)}`)
          .query({ username: ada.username })
      ).body,
    ).toEqual([]);
    expect((await request(app).delete(`/api/blocks/${grace.id}`).set("Cookie", `jwt=${signToken(grace.id)}`)).status).toBe(404);

    await expect(blockUser(ada.id, grace.id)).resolves.toMatchObject({ success: true });
    expect(await prisma.blockedUser.count()).toBe(1);
    await expect(unblockUser(ada.id, grace.id)).resolves.toEqual({ success: true, userId: grace.id });
    expect(
      (
        await request(app)
          .post(`/api/messages/send/${grace.id}`)
          .set("Cookie", `jwt=${signToken(ada.id)}`)
          .send({ text: "allowed again" })
      ).status,
    ).toBe(201);
    await expect(blockUser(ada.id, ada.id)).rejects.toMatchObject({ code: "SELF_BLOCK" });
  });

  it("keeps explicit contacts one-way and publishes incoming conversations to every recipient socket", async () => {
    const app = createApp();
    const server = http.createServer(app);
    initializeSocket(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const [ada, grace] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({
        data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" },
      }),
    ]);

    const connect = async (userId: number) => {
      const socket = createSocketClient(baseUrl, {
        forceNew: true,
        transports: ["websocket"],
        extraHeaders: { Cookie: `jwt=${signToken(userId)}` },
      });
      await waitForSocket<void>((resolve) => socket.once("connect", () => resolve()), "Socket connection timed out");
      return socket;
    };

    const sockets: Socket[] = [];
    try {
      const gracePrimary = await connect(grace.id);
      const graceSecondary = await connect(grace.id);
      const adaPrimary = await connect(ada.id);
      sockets.push(gracePrimary, graceSecondary, adaPrimary);

      const added = await request(baseUrl)
        .post("/api/contacts")
        .set("Cookie", `jwt=${signToken(ada.id)}`)
        .send({ username: grace.username });
      expect(added.status).toBe(201);
      expect(added.body.contact).toMatchObject({ id: grace.id, is_contact: true });
      expect(await prisma.contact.count()).toBe(1);
      expect(await listContacts(grace.id)).toEqual([]);

      expect(
        (
          await request(baseUrl)
            .post("/api/contacts")
            .set("Cookie", `jwt=${signToken(ada.id)}`)
            .send({ username: grace.username })
        ).status,
      ).toBe(201);

      const primaryConversation = waitForSocket<{ contact: { id: number; is_contact: boolean } }>(
        (resolve) => gracePrimary.once("conversationUpdated", resolve),
        "Primary recipient socket missed conversationUpdated",
      );
      const secondaryConversation = waitForSocket<{ contact: { id: number; is_contact: boolean } }>(
        (resolve) => graceSecondary.once("conversationUpdated", resolve),
        "Secondary recipient socket missed conversationUpdated",
      );
      const primaryMessage = waitForSocket<{ sender_id: number }>(
        (resolve) => gracePrimary.once("newMessage", resolve),
        "Primary recipient socket missed newMessage",
      );
      const secondaryMessage = waitForSocket<{ sender_id: number }>(
        (resolve) => graceSecondary.once("newMessage", resolve),
        "Secondary recipient socket missed newMessage",
      );

      expect(
        (
          await request(baseUrl)
            .post(`/api/messages/send/${grace.id}`)
            .set("Cookie", `jwt=${signToken(ada.id)}`)
            .send({ text: "hello" })
        ).status,
      ).toBe(201);
      expect(await Promise.all([primaryConversation, secondaryConversation])).toEqual([
        { contact: expect.objectContaining({ id: ada.id, is_contact: false }) },
        { contact: expect.objectContaining({ id: ada.id, is_contact: false }) },
      ]);
      expect(await Promise.all([primaryMessage, secondaryMessage])).toEqual([
        expect.objectContaining({ sender_id: ada.id }),
        expect.objectContaining({ sender_id: ada.id }),
      ]);
      expect(await listContacts(grace.id)).toEqual([expect.objectContaining({ id: ada.id, is_contact: false })]);

      expect(
        (
          await request(baseUrl)
            .post("/api/contacts")
            .set("Cookie", `jwt=${signToken(grace.id)}`)
            .send({ username: ada.username })
        ).status,
      ).toBe(201);
      const graceDeleteReset = waitForSocket<{ userId: number; contact: { id: number; is_contact: boolean } }>(
        (resolve) => gracePrimary.once("conversationReset", resolve),
        "Peer socket missed contact-preserving conversationReset",
      );
      const adaDeleteReset = waitForSocket<{ userId: number; contact: null }>(
        (resolve) => adaPrimary.once("conversationReset", resolve),
        "Deleting user socket missed conversationReset",
      );
      expect(
        (
          await request(baseUrl)
            .delete(`/api/contacts/${grace.id}`)
            .set("Cookie", `jwt=${signToken(ada.id)}`)
        ).status,
      ).toBe(200);
      expect(await Promise.all([graceDeleteReset, adaDeleteReset])).toEqual([
        { userId: ada.id, contact: expect.objectContaining({ id: ada.id, is_contact: true }) },
        { userId: grace.id, contact: null },
      ]);
      expect(await prisma.contact.count()).toBe(1);
      expect(await prisma.message.count()).toBe(0);

      expect(
        (
          await request(baseUrl)
            .post(`/api/messages/send/${grace.id}`)
            .set("Cookie", `jwt=${signToken(ada.id)}`)
            .send({ text: "new conversation" })
        ).status,
      ).toBe(201);

      const gracePrimaryReset = waitForSocket<{ userId: number; contact: null }>(
        (resolve) => gracePrimary.once("conversationReset", resolve),
        "Primary recipient socket missed conversationReset",
      );
      const graceSecondaryReset = waitForSocket<{ userId: number; contact: null }>(
        (resolve) => graceSecondary.once("conversationReset", resolve),
        "Secondary recipient socket missed conversationReset",
      );
      const adaReset = waitForSocket<{ userId: number; contact: null }>(
        (resolve) => adaPrimary.once("conversationReset", resolve),
        "Blocked user socket missed conversationReset",
      );
      expect(
        (
          await request(baseUrl)
            .post(`/api/blocks/${ada.id}`)
            .set("Cookie", `jwt=${signToken(grace.id)}`)
        ).status,
      ).toBe(201);
      expect(await Promise.all([gracePrimaryReset, graceSecondaryReset, adaReset])).toEqual([
        { userId: ada.id, contact: null },
        { userId: ada.id, contact: null },
        { userId: grace.id, contact: null },
      ]);
      expect(await prisma.contact.count()).toBe(0);
      expect(await prisma.message.count()).toBe(0);
      expect(await listContacts(grace.id)).toEqual([]);
    } finally {
      for (const socket of sockets) socket.disconnect();
      await closeSocket();
      if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
