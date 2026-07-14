import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { toProfilePicDto } from "../auth/auth.dto.js";

type ContactUser = {
  id: number;
  name: string;
  email: string;
  username: string;
  number: string | null;
  profilePics: Array<{ id: number; url: string; userId: number }>;
};

const toContactDto = (user: ContactUser, lastMessageTime: Date | null = null) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  number: user.number,
  last_message_time: lastMessageTime?.toISOString() ?? null,
  is_contact: true,
  profilePic: user.profilePics[0] ? toProfilePicDto(user.profilePics[0]) : null,
});

export const listContacts = async (userId: number) => {
  const [contacts, inbound, outbound] = await Promise.all([
    prisma.contact.findMany({ where: { userId }, select: { contactId: true } }),
    prisma.message.groupBy({ by: ["senderId"], where: { receiverId: userId }, _max: { createdAt: true } }),
    prisma.message.groupBy({ by: ["receiverId"], where: { senderId: userId }, _max: { createdAt: true } }),
  ]);

  const contactIds = new Set(contacts.map((item) => item.contactId));
  const inboundIds = new Set(inbound.map((item) => item.senderId));
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
    .map((user) => ({ ...toContactDto(user, lastMessage.get(user.id) ?? null), is_contact: contactIds.has(user.id) }))
    .sort((a, b) => {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return b.last_message_time.localeCompare(a.last_message_time);
    });
};

export const addContact = async (userId: number, ownUsername: string, username: string) => {
  if (username === ownUsername) throw new AppError(400, "You cannot add yourself as a contact", "SELF_CONTACT");
  const [owner, contact] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
    }),
    prisma.user.findUnique({
      where: { username },
      include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
    }),
  ]);
  if (!owner) throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  if (!contact) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  const created = await prisma.$transaction((tx) =>
    tx.contact.createMany({
      data: [
        { userId, contactId: contact.id },
        { userId: contact.id, contactId: userId },
      ],
      skipDuplicates: true,
    }),
  );

  return {
    success: true,
    contactId: contact.id,
    contact: toContactDto(contact),
    recipientId: contact.id,
    recipientContact: toContactDto(owner),
    created: created.count > 0,
  };
};

export const deleteContact = async (userId: number, contactId: number) => {
  const deleted = await prisma.$transaction((tx) =>
    tx.contact.deleteMany({
      where: {
        OR: [
          { userId, contactId },
          { userId: contactId, contactId: userId },
        ],
      },
    }),
  );
  if (deleted.count === 0) throw new AppError(404, "Contact not found", "CONTACT_NOT_FOUND");
  return { success: true, contactId };
};
