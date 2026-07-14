import { describe, expect, it } from "vitest";
import { messageQuerySchema, sendMessageSchema } from "./message.schemas.js";

describe("message validation", () => {
  it("requires text or an image", () => {
    expect(() => sendMessageSchema.parse({ text: "" })).toThrow();
  });

  it("accepts a supported data image", () => {
    const input = sendMessageSchema.parse({ image: "data:image/png;base64,AAAA" });
    expect(input.image).toContain("image/png");
  });

  it("limits page size", () => {
    expect(() => messageQuerySchema.parse({ limit: 101 })).toThrow();
    expect(messageQuerySchema.parse({}).limit).toBe(50);
  });
});
