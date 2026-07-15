import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { clearAuthCookie, setAuthCookie } from "./jwt.js";

describe("authentication cookie configuration", () => {
  it("honors the explicit HTTP deployment override when setting and clearing cookies", () => {
    const cookie = vi.fn();
    const clearCookie = vi.fn();
    const response = { cookie, clearCookie } as unknown as Response;

    setAuthCookie(response, "token");
    clearAuthCookie(response);

    expect(cookie).toHaveBeenCalledWith("jwt", "token", expect.objectContaining({ httpOnly: true, secure: false }));
    expect(clearCookie).toHaveBeenCalledWith("jwt", expect.objectContaining({ httpOnly: true, secure: false }));
  });
});
