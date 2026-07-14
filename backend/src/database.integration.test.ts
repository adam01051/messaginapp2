import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { getAuthUser } from "./modules/auth/auth.service.js";
import { deleteContact } from "./modules/contacts/contact.service.js";
import { listContacts } from "./modules/contacts/contact.service.js";
import { getMessages } from "./modules/messages/message.service.js";

const databaseSuite = describe.runIf(process.env.RUN_DATABASE_TESTS === "true");

databaseSuite("PostgreSQL integration", () => {
  beforeEach(async () => {
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

  it("returns scoped profile-picture history and the latest contact avatar", async () => {
    const [owner, contact] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({
        data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" },
      }),
    ]);
    const [older, newer] = await Promise.all([
      prisma.profilePic.create({ data: { userId: contact.id, url: "https://example.com/older.png" } }),
      prisma.profilePic.create({ data: { userId: contact.id, url: "https://example.com/newer.png" } }),
    ]);
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

  it("preserves messages when a contact is removed", async () => {
    const [sender, receiver] = await Promise.all([
      prisma.user.create({ data: { name: "Ada", username: "ada", email: "ada@example.com", passwordHash: "hash" } }),
      prisma.user.create({ data: { name: "Grace", username: "grace", email: "grace@example.com", passwordHash: "hash" } }),
    ]);
    await prisma.contact.create({ data: { userId: sender.id, contactId: receiver.id } });
    await prisma.message.create({ data: { senderId: sender.id, receiverId: receiver.id, content: "hello" } });

    await deleteContact(sender.id, receiver.id);

    expect(await prisma.contact.count()).toBe(0);
    expect(await prisma.message.count()).toBe(1);
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
    expect(await prisma.message.count()).toBe(1);

    const logout = await ada.post("/api/auth/logout");
    expect(logout.status).toBe(200);
    expect((await ada.get("/api/auth/check")).status).toBe(401);

    const login = await ada.post("/api/auth/login").send({ email: "ada@example.com", password: "password-123" });
    expect(login.status).toBe(200);
    expect((await ada.get("/api/auth/check")).status).toBe(200);
  });
});
