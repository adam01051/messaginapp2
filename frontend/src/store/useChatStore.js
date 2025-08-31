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
	isNewMessage: null,


	getUsers: async () => {
		set({ isUsersLoading: true });
		try {
			const res = await axiosInstance.get("/messages/user");

			set({ users: Array.isArray(res.data) ? res.data : [] });

		} catch (error) {
			toast.error(error.response.data.message);
			console.log("there was  problem getting users from database");
		} finally {
			set({ isUsersLoading: false });
		}
	},
	//check
	getMessages: async (userId) => {
		set({ isMessagesLoading: true });
		try {
			const res = await axiosInstance.get(`/messages/${userId}`);
			set({ messages: res.data });
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to load users");

			console.log("there was  problem getting messages from database");
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
		const { selectedUser } = get();
		if (!selectedUser) return;

		const socket = useAuthStore.getState().socket;

		socket.on("newMessage", (newMessage) => {
			set((state) => {
				const isCurrentChat = newMessage.sender_id === state.selectedUser?.id;
				return {
					messages: isCurrentChat
						? [...state.messages, newMessage]
						: state.messages,
					users: [
						// Move sender to top if exists
						state.users.find((u) => u.id === newMessage.sender_id) ||
							state.selectedUser,
						...state.users.filter((u) => u.id !== newMessage.sender_id),
					],
					isNewMessage: newMessage.receiver_id,
				};
			});
		});
	},
	
	unsubscribeFromMessages: () => {
		const socket = useAuthStore.getState().socket;
		socket.off("newMessage");
		
	},
	
	closeChat: () => {
		set({ selectedUser: null });
	},
	//todo: optimize this one later
	setSelectedUser: (user) => {
		
		const { selectedUser } = get();
		// If same user, do nothing
		if (selectedUser?.id === user.id) return;
		set({ selectedUser: user });
	},
}));
