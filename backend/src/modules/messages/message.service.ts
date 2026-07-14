import cloudinary from "../../lib/cloudinary.js";
import { AppError } from "../../lib/errors.js";
import { prisma, serializableTransaction } from "../../lib/prisma.js";
import { assertUsersCanInteract, isEitherUserBlocked } from "../blocks/block.service.js";
import { toContactDto } from "../contacts/contact.service.js";
import { toMessageDto } from "./message.dto.js";

export const getMessages = async (userId: number, peerId: number, cursor: number | undefined, limit: number) => {
  if (peerId === userId) throw new AppError(400, "Cannot open a conversation with yourself", "INVALID_PEER");
  if (await isEitherUserBlocked(userId, peerId)) throw new AppError(403, "This action is unavailable", "USER_BLOCKED");
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
  const [receiver, sender, initiallyBlocked] = await Promise.all([
    prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: senderId },
      include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
    }),
    isEitherUserBlocked(senderId, receiverId),
  ]);
  if (!receiver) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  if (!sender) throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  if (initiallyBlocked) throw new AppError(403, "This action is unavailable", "USER_BLOCKED");

  let upload: Awaited<ReturnType<typeof cloudinary.uploader.upload>> | undefined;
  if (image) {
    upload = await cloudinary.uploader.upload(image, {
      resource_type: "image",
      folder: "messaging-app/messages",
    });
  }

  try {
    const result = await serializableTransaction(async (tx) => {
      await assertUsersCanInteract(tx, senderId, receiverId);
      const receiverContact = await tx.contact.findUnique({
        where: { userId_contactId: { userId: receiverId, contactId: senderId } },
        select: { userId: true },
      });
      const message = await tx.message.create({
        data: {
          senderId,
          receiverId,
          content: text || null,
          image: upload?.secure_url,
          imagePublicId: upload?.public_id,
        },
      });
      return { message, receiverContact };
    });
    return {
      message: toMessageDto(result.message),
      senderContact: toContactDto(sender, result.message.createdAt, Boolean(result.receiverContact)),
    };
  } catch (error) {
    if (upload) await cloudinary.uploader.destroy(upload.public_id).catch(() => undefined);
    throw error;
  }
};
