import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";

let app: Express;

beforeAll(async () => {
  const module = await import("./app.js");
  app = module.createApp();
});

describe("application boundaries", () => {
  it("reports liveness without touching the database", async () => {
    const response = await request(app).get("/health/live");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("rejects protected routes without a JWT cookie", async () => {
    const response = await request(app).get("/api/contacts");
    expect(response.status).toBe(401);
    expect(response.body.code).toBe("UNAUTHORIZED");
  });

  it("returns a structured response for unknown routes", async () => {
    const response = await request(app).get("/missing");
    expect(response.status).toBe(404);
    expect(response.body.code).toBe("ROUTE_NOT_FOUND");
  });
});
