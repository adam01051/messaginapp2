import cloudinary from "../../lib/cloudinary.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { toMessageDto } from "./message.dto.js";

export const getMessages = async (userId: number, peerId: number, cursor: number | undefined, limit: number) => {
  if (peerId === userId) throw new AppError(400, "Cannot open a conversation with yourself", "INVALID_PEER");
  const peer = await prisma.user.findUnique({ where: { id: peerId }, select: { id: true } });
  if (!peer) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return {
    items: page.reverse().map(toMessageDto),
    nextCursor: hasMore ? page[0]?.id ?? null : null,
  };
};

export const sendMessage = async (senderId: number, receiverId: number, text: string, image?: string | null) => {
  if (receiverId === senderId) throw new AppError(400, "Cannot message yourself", "INVALID_RECEIVER");
  const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
  if (!receiver) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  let upload: Awaited<ReturnType<typeof cloudinary.uploader.upload>> | undefined;
  if (image) {
    upload = await cloudinary.uploader.upload(image, {
      resource_type: "image",
      folder: "messaging-app/messages",
    });
  }

  try {
    const message = await prisma.message.create({
      data: { senderId, receiverId, content: text || null, image: upload?.secure_url },
    });
    return toMessageDto(message);
  } catch (error) {
    if (upload) await cloudinary.uploader.destroy(upload.public_id).catch(() => undefined);
    throw error;
  }
};
