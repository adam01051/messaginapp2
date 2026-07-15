import { AppError } from "../../lib/errors.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma, serializableTransaction } from "../../lib/prisma.js";
import { toProfilePicDto } from "../auth/auth.dto.js";
import { cleanupMessageAssets } from "../messages/message-assets.js";

const blockedPairWhere = (firstUserId: number, secondUserId: number) => ({
  OR: [
    { blockerId: firstUserId, blockedId: secondUserId },
    { blockerId: secondUserId, blockedId: firstUserId },
  ],
});

const blockedUserInclude = { blocked: { include: { profilePics: { take: 1, orderBy: { id: "desc" as const } } } } };

export const listBlockedUsers = async (blockerId: number) => {
  const rows = await prisma.blockedUser.findMany({ where: { blockerId }, include: blockedUserInclude, orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({
    id: row.blocked.id,
    name: row.blocked.name,
    username: row.blocked.username,
    profilePic: row.blocked.profilePics[0] ? toProfilePicDto(row.blocked.profilePics[0]) : null,
    blocked_at: row.createdAt.toISOString(),
  }));
};

export const blockUser = async (blockerId: number, blockedId: number) => {
  if (blockerId === blockedId) throw new AppError(400, "You cannot block yourself", "SELF_BLOCK");
  const result = await serializableTransaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: blockedId },
      include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
    });
    if (!target) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    const assets = await tx.message.findMany({
      where: { OR: [{ senderId: blockerId, receiverId: blockedId }, { senderId: blockedId, receiverId: blockerId }] },
      select: { image: true, imagePublicId: true },
    });
    const block = await tx.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    await tx.contact.deleteMany({
      where: { OR: [{ userId: blockerId, contactId: blockedId }, { userId: blockedId, contactId: blockerId }] },
    });
    await tx.message.deleteMany({
      where: { OR: [{ senderId: blockerId, receiverId: blockedId }, { senderId: blockedId, receiverId: blockerId }] },
    });
    return { target, block, assets };
  });
  await cleanupMessageAssets(result.assets);
  return {
    success: true,
    blockedUser: {
      id: result.target.id,
      name: result.target.name,
      username: result.target.username,
      profilePic: result.target.profilePics[0] ? toProfilePicDto(result.target.profilePics[0]) : null,
      blocked_at: result.block.createdAt.toISOString(),
    },
  };
};

export const unblockUser = async (blockerId: number, blockedId: number) => {
  const deleted = await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
  if (deleted.count === 0) throw new AppError(404, "Blocked user not found", "BLOCK_NOT_FOUND");
  return { success: true, userId: blockedId };
};

export const isEitherUserBlocked = async (firstUserId: number, secondUserId: number) =>
  Boolean(await prisma.blockedUser.findFirst({ where: blockedPairWhere(firstUserId, secondUserId), select: { blockerId: true } }));

export const assertUsersCanInteract = async (
  client: Prisma.TransactionClient,
  firstUserId: number,
  secondUserId: number,
) => {
  const blocked = await client.blockedUser.findFirst({
    where: blockedPairWhere(firstUserId, secondUserId),
    select: { blockerId: true },
  });
  if (blocked) throw new AppError(403, "This action is unavailable", "USER_BLOCKED");
};
