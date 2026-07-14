import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ deleteMany: vi.fn() }));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    contact: { deleteMany: mocks.deleteMany },
  },
}));

import { deleteContact } from "./contact.service.js";

describe("contact deletion", () => {
  beforeEach(() => mocks.deleteMany.mockReset());

  it("deletes only the contact relationship", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    await expect(deleteContact(1, 2)).resolves.toEqual({ success: true, contactId: 2 });
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { userId: 1, contactId: 2 } });
  });

  it("returns not found when the contact does not exist", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteContact(1, 2)).rejects.toMatchObject({ status: 404, code: "CONTACT_NOT_FOUND" });
  });
});
