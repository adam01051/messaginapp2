import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth.schemas.js";

describe("authentication validation", () => {
  it("normalizes email addresses during signup", () => {
    const input = signupSchema.parse({ fullName: "Ada Lovelace", email: "ADA@Example.COM", username: "ada", password: "secret12" });
    expect(input.email).toBe("ada@example.com");
  });

  it("rejects short passwords", () => {
    expect(() => signupSchema.parse({ fullName: "Ada", email: "ada@example.com", username: "ada", password: "123" })).toThrow();
  });

  it("does not accept an empty login password", () => {
    expect(() => loginSchema.parse({ email: "ada@example.com", password: "" })).toThrow();
  });
});
