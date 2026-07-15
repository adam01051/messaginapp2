import cloudinary from "../../lib/cloudinary.js";
import { logger } from "../../lib/logger.js";

type MessageAsset = { image: string | null; imagePublicId: string | null };

export const publicIdFromCloudinaryUrl = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== "res.cloudinary.com") return null;
    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex < 0) return null;
    const afterUpload = segments.slice(uploadIndex + 1);
    const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
    const publicIdSegments = versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;
    if (publicIdSegments.length === 0) return null;
    const last = publicIdSegments.at(-1)!;
    publicIdSegments[publicIdSegments.length - 1] = last.replace(/\.[^.]+$/, "");
    return decodeURIComponent(publicIdSegments.join("/"));
  } catch {
    return null;
  }
};

export const cleanupMessageAssets = async (assets: MessageAsset[]) => {
  const publicIds = new Set(
    assets.map((asset) => asset.imagePublicId ?? publicIdFromCloudinaryUrl(asset.image)).filter((id): id is string => Boolean(id)),
  );
  const results = await Promise.allSettled([...publicIds].map((publicId) => cloudinary.uploader.destroy(publicId)));
  results.forEach((result, index) => {
    if (result.status === "rejected") logger.warn({ err: result.reason, publicId: [...publicIds][index] }, "message asset cleanup failed");
  });
};
