import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ destroy: vi.fn(), warn: vi.fn() }));
vi.mock("../../lib/cloudinary.js", () => ({ default: { uploader: { destroy: mocks.destroy } } }));
vi.mock("../../lib/logger.js", () => ({ logger: { warn: mocks.warn } }));

import { cleanupMessageAssets, publicIdFromCloudinaryUrl } from "./message-assets.js";

describe("message attachment cleanup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("extracts a public ID from an existing Cloudinary secure URL", () => {
    expect(
      publicIdFromCloudinaryUrl(
        "https://res.cloudinary.com/demo/image/upload/v1234567890/messaging-app/messages/sample.png",
      ),
    ).toBe("messaging-app/messages/sample");
  });

  it("prefers stored public IDs, deduplicates assets, and tolerates cleanup failure", async () => {
    mocks.destroy.mockRejectedValueOnce(new Error("unavailable"));
    await expect(
      cleanupMessageAssets([
        { image: null, imagePublicId: "messaging-app/messages/one" },
        { image: null, imagePublicId: "messaging-app/messages/one" },
      ]),
    ).resolves.toBeUndefined();
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    expect(mocks.warn).toHaveBeenCalledTimes(1);
  });
});
