import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  createMany: vi.fn(),
  deleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    $transaction: mocks.transaction,
  },
}));

import { addContact, deleteContact } from "./contact.service.js";

const ada = {
  id: 1,
  name: "Ada",
  email: "ada@example.com",
  username: "ada",
  number: null,
  profilePics: [],
};
const grace = {
  id: 2,
  name: "Grace",
  email: "grace@example.com",
  username: "grace",
  number: null,
  profilePics: [],
};

describe("contact relationships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback) =>
      callback({ contact: { createMany: mocks.createMany, deleteMany: mocks.deleteMany } }),
    );
  });

  it("creates both contact directions and returns sidebar DTOs", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(ada).mockResolvedValueOnce(grace);
    mocks.createMany.mockResolvedValue({ count: 2 });

    await expect(addContact(ada.id, ada.username, grace.username)).resolves.toMatchObject({
      success: true,
      contactId: grace.id,
      contact: { id: grace.id, is_contact: true },
      recipientContact: { id: ada.id, is_contact: true },
      created: true,
    });
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [
        { userId: ada.id, contactId: grace.id },
        { userId: grace.id, contactId: ada.id },
      ],
      skipDuplicates: true,
    });
  });

  it("is idempotent when both directions already exist", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(ada).mockResolvedValueOnce(grace);
    mocks.createMany.mockResolvedValue({ count: 0 });

    await expect(addContact(ada.id, ada.username, grace.username)).resolves.toMatchObject({ created: false });
  });

  it("deletes both directions without touching messages", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 2 });
    await expect(deleteContact(ada.id, grace.id)).resolves.toEqual({ success: true, contactId: grace.id });
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { userId: ada.id, contactId: grace.id },
          { userId: grace.id, contactId: ada.id },
        ],
      },
    });
  });

  it("returns not found when neither relationship exists", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteContact(ada.id, grace.id)).rejects.toMatchObject({ status: 404, code: "CONTACT_NOT_FOUND" });
  });
});
