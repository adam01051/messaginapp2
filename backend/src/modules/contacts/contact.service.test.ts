import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  blockedFindFirst: vi.fn(),
  createMany: vi.fn(),
  contactFindUnique: vi.fn(),
  contactDeleteMany: vi.fn(),
  messageFindMany: vi.fn(),
  messageDeleteMany: vi.fn(),
  cleanup: vi.fn(),
}));

const transactionClient = {
  user: { findUnique: mocks.userFindUnique },
  blockedUser: { findFirst: mocks.blockedFindFirst },
  contact: {
    createMany: mocks.createMany,
    findUnique: mocks.contactFindUnique,
    deleteMany: mocks.contactDeleteMany,
  },
  message: { findMany: mocks.messageFindMany, deleteMany: mocks.messageDeleteMany },
};

vi.mock("../../lib/prisma.js", () => ({
  prisma: {},
  serializableTransaction: (callback: (tx: typeof transactionClient) => unknown) => callback(transactionClient),
}));
vi.mock("../messages/message-assets.js", () => ({ cleanupMessageAssets: mocks.cleanup }));

import { addContact, deleteContact } from "./contact.service.js";

const ada = { id: 1, name: "Ada", email: "ada@example.com", username: "ada", number: null, profilePics: [] };
const grace = { id: 2, name: "Grace", email: "grace@example.com", username: "grace", number: null, profilePics: [] };

describe("contact relationships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.blockedFindFirst.mockResolvedValue(null);
    mocks.messageFindMany.mockResolvedValue([]);
    mocks.cleanup.mockResolvedValue(undefined);
  });

  it("creates only the requester's contact direction", async () => {
    mocks.userFindUnique.mockResolvedValue(grace);
    mocks.createMany.mockResolvedValue({ count: 1 });

    await expect(addContact(ada.id, ada.username, grace.username)).resolves.toMatchObject({
      contactId: grace.id,
      contact: { id: grace.id, is_contact: true },
      created: true,
    });
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [{ userId: ada.id, contactId: grace.id }],
      skipDuplicates: true,
    });
  });

  it("rejects contact creation when either user blocked the other", async () => {
    mocks.userFindUnique.mockResolvedValue(grace);
    mocks.blockedFindFirst.mockResolvedValue({ blockerId: grace.id });
    await expect(addContact(ada.id, ada.username, grace.username)).rejects.toMatchObject({
      status: 403,
      code: "USER_BLOCKED",
    });
  });

  it("deletes the requester's contact and all shared messages while preserving the reverse contact", async () => {
    mocks.userFindUnique.mockResolvedValue(ada);
    mocks.contactFindUnique.mockResolvedValue({ userId: grace.id });
    mocks.contactDeleteMany.mockResolvedValue({ count: 1 });
    mocks.messageDeleteMany.mockResolvedValue({ count: 3 });

    await expect(deleteContact(ada.id, grace.id)).resolves.toMatchObject({
      success: true,
      contactId: grace.id,
      peerContact: { id: ada.id, is_contact: true },
    });
    expect(mocks.messageDeleteMany).toHaveBeenCalledWith({
      where: { OR: [{ senderId: ada.id, receiverId: grace.id }, { senderId: grace.id, receiverId: ada.id }] },
    });
    expect(mocks.cleanup).toHaveBeenCalledWith([]);
  });

  it("returns not found when there is no contact or conversation", async () => {
    mocks.userFindUnique.mockResolvedValue(ada);
    mocks.contactFindUnique.mockResolvedValue(null);
    mocks.contactDeleteMany.mockResolvedValue({ count: 0 });
    mocks.messageDeleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteContact(ada.id, grace.id)).rejects.toMatchObject({ status: 404, code: "CONTACT_NOT_FOUND" });
  });
});
