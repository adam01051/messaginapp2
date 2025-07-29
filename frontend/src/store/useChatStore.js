import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  onlineUsers: {},
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  newMessages: {}, // ✅ Track new messages per user

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/user");
      set({ users: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      toast.error(error.response.data.message);
      console.log("Problem getting users from database");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // ✅ Mark messages from this user as read
      set((state) => ({
        newMessages: { ...state.newMessages, [userId]: false },
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
      console.log("Problem getting messages from database");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser.id}`,
        messageData
      );
      set({
        messages: [...messages, res.data],
        users: [selectedUser, ...users.filter((u) => u.id !== selectedUser.id)],
      });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      set((state) => {
        const isCurrentChat = newMessage.sender_id === state.selectedUser?.id;

        return {
          messages: isCurrentChat
            ? [...state.messages, newMessage]
            : state.messages,
          users: [
            state.users.find((u) => u.id === newMessage.sender_id) ||
              state.selectedUser,
            ...state.users.filter((u) => u.id !== newMessage.sender_id),
          ],
          // ✅ Mark as unread if not in current chat
          newMessages: {
            ...state.newMessages,
            [newMessage.sender_id]: !isCurrentChat,
          },
        };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) =>
    set((state) => ({
      selectedUser,
      // ✅ Mark selected user messages as read when clicked
      newMessages: { ...state.newMessages, [selectedUser.id]: false },
    })),
}));
