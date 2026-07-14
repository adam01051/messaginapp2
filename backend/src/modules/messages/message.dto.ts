type MessageLike = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string | null;
  image: string | null;
  createdAt: Date;
};

export const toMessageDto = (message: MessageLike) => ({
  id: message.id,
  sender_id: message.senderId,
  receiver_id: message.receiverId,
  content: message.content,
  image: message.image,
  created_at: message.createdAt,
});
