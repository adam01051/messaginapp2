import { AppError } from "../../lib/errors.js";
import { prisma, serializableTransaction } from "../../lib/prisma.js";
import { toProfilePicDto } from "../auth/auth.dto.js";
import { assertUsersCanInteract } from "../blocks/block.service.js";
import { cleanupMessageAssets } from "../messages/message-assets.js";

export type ContactUser = {
  id: number;
  name: string;
  email: string;
  username: string;
  number: string | null;
  profilePics: Array<{ id: number; url: string; userId: number }>;
};

export const toContactDto = (
  user: ContactUser,
  lastMessageTime: Date | null = null,
  isContact = true,
) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  number: user.number,
  last_message_time: lastMessageTime?.toISOString() ?? null,
  is_contact: isContact,
  profilePic: user.profilePics[0] ? toProfilePicDto(user.profilePics[0]) : null,
});

export const listContacts = async (userId: number) => {
  const [contacts, inbound, outbound, blocks] = await Promise.all([
    prisma.contact.findMany({ where: { userId }, select: { contactId: true } }),
    prisma.message.groupBy({ by: ["senderId"], where: { receiverId: userId }, _max: { createdAt: true } }),
    prisma.message.groupBy({ by: ["receiverId"], where: { senderId: userId }, _max: { createdAt: true } }),
    prisma.blockedUser.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
  ]);

  const blockedIds = new Set(blocks.map((item) => (item.blockerId === userId ? item.blockedId : item.blockerId)));
  const contactIds = new Set(contacts.map((item) => item.contactId).filter((id) => !blockedIds.has(id)));
  const inboundIds = new Set(inbound.map((item) => item.senderId).filter((id) => !blockedIds.has(id)));
  const userIds = new Set([...contactIds, ...inboundIds]);
  if (userIds.size === 0) return [];

  const lastMessage = new Map<number, Date>();
  for (const item of inbound) if (item._max.createdAt) lastMessage.set(item.senderId, item._max.createdAt);
  for (const item of outbound) {
    if (!item._max.createdAt) continue;
    const current = lastMessage.get(item.receiverId);
    if (!current || current < item._max.createdAt) lastMessage.set(item.receiverId, item._max.createdAt);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
  });

  return users
    .map((user) => toContactDto(user, lastMessage.get(user.id) ?? null, contactIds.has(user.id)))
    .sort((a, b) => {
      if (a.last_message_time && b.last_message_time) {
        const newestFirst = b.last_message_time.localeCompare(a.last_message_time);
        if (newestFirst !== 0) return newestFirst;
      } else if (a.last_message_time) {
        return -1;
      } else if (b.last_message_time) {
        return 1;
      }
      return a.name.localeCompare(b.name) || a.username.localeCompare(b.username) || a.id - b.id;
    });
};

export const addContact = async (userId: number, ownUsername: string, username: string) => {
  if (username === ownUsername) throw new AppError(400, "You cannot add yourself as a contact", "SELF_CONTACT");
  const result = await serializableTransaction(async (tx) => {
    const contact = await tx.user.findUnique({
      where: { username },
      include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
    });
    if (!contact) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    await assertUsersCanInteract(tx, userId, contact.id);
    const created = await tx.contact.createMany({
      data: [{ userId, contactId: contact.id }],
      skipDuplicates: true,
    });
    return { contact, created };
  });

  return {
    success: true,
    contactId: result.contact.id,
    contact: toContactDto(result.contact),
    created: result.created.count > 0,
  };
};

export const deleteContact = async (userId: number, contactId: number) => {
  const result = await serializableTransaction(async (tx) => {
    const [requester, reverseContact, assets] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
      }),
      tx.contact.findUnique({
        where: { userId_contactId: { userId: contactId, contactId: userId } },
        select: { userId: true },
      }),
      tx.message.findMany({
        where: { OR: [{ senderId: userId, receiverId: contactId }, { senderId: contactId, receiverId: userId }] },
        select: { image: true, imagePublicId: true },
      }),
    ]);
    const contact = await tx.contact.deleteMany({ where: { userId, contactId } });
    const conversation = await tx.message.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: contactId },
          { senderId: contactId, receiverId: userId },
        ],
      },
    });
    if (contact.count === 0 && conversation.count === 0) {
      throw new AppError(404, "Contact or conversation not found", "CONTACT_NOT_FOUND");
    }
    return { requester, reverseContact: Boolean(reverseContact), assets };
  });
  await cleanupMessageAssets(result.assets);
  return {
    success: true,
    contactId,
    peerContact: result.reverseContact && result.requester ? toContactDto(result.requester, null, true) : null,
  };
};
