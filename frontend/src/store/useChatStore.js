import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
	messages: [],
	users: [],
	onlineUsers: {},
	selectedUser: null,

	isUsersLoading: false,
	usersError: null,
	isMessagesLoading: false,
	isOlderMessagesLoading: false,
	nextCursor: null,
	isNewMessage: null,
	addResults: null,
	blockedUsers: [],
	isBlockedUsersLoading: false,
	blockedUsersError: null,

	addUser: async (username) => {
		try {
			const res = await axiosInstance.post("/contacts", { username });
			set({ addResults: res.data });
			if (res.data.contact) get().upsertContact(res.data.contact);
			set((state) => ({
				selectedUser:
					state.selectedUser?.id === res.data.contactId
						? { ...state.selectedUser, is_contact: true }
						: state.selectedUser,
			}));
	

			toast.success("Contact successfully added");
		} catch (error) {
			console.error("Error in adding user", error);
			set({ addResults: [] });
			const message = error.response?.data?.message || "Adding user failed";
			toast.error(message);
		}
	},
	deleteUser: async (user) => {
		try {
			await axiosInstance.delete(`/contacts/${user.id}`);
			await get().getUsers();
			set((state) => ({
				selectedUser:
					String(state.selectedUser?.id) === String(user.id)
						? state.users.find((item) => String(item.id) === String(user.id)) || null
						: state.selectedUser,
			}));
			
			toast.success("Contact successfully deleted");
		} catch (error) {
			console.error("Error in deleting user", error);
			set({ addResults: [] });
			toast.error("User deleting is failed");
		}
	},
	blockUser: async (user) => {
		try {
			const res = await axiosInstance.post(`/blocks/${user.id}`);
			get().resetConversation({ userId: user.id, contact: null });
			set((state) => ({
				blockedUsers: [
					res.data.blockedUser,
					...state.blockedUsers.filter((item) => String(item.id) !== String(user.id)),
				],
			}));
			toast.success("User blocked");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Blocking user failed");
			return false;
		}
	},
	getBlockedUsers: async () => {
		set({ isBlockedUsersLoading: true, blockedUsersError: null });
		try {
			const res = await axiosInstance.get("/blocks");
			set({ blockedUsers: Array.isArray(res.data) ? res.data : [] });
		} catch (error) {
			const message = error.response?.data?.message || "Failed to load blocked users";
			set({ blockedUsersError: message });
			toast.error(message);
		} finally {
			set({ isBlockedUsersLoading: false });
		}
	},
	unblockUser: async (userId) => {
		try {
			await axiosInstance.delete(`/blocks/${userId}`);
			set((state) => ({
				blockedUsers: state.blockedUsers.filter((user) => String(user.id) !== String(userId)),
			}));
			toast.success("User unblocked");
		} catch (error) {
			toast.error(error.response?.data?.message || "Unblocking user failed");
		}
	},
	upsertContact: (contact) => {
		if (!contact?.id) return;
		set((state) => {
			const existing = state.users.find((user) => String(user.id) === String(contact.id));
			const merged = {
				...existing,
				...contact,
				last_message_time: existing?.last_message_time || contact.last_message_time || null,
				is_contact: true,
			};
			return {
				users: [merged, ...state.users.filter((user) => String(user.id) !== String(contact.id))],
				selectedUser:
					String(state.selectedUser?.id) === String(contact.id)
						? { ...state.selectedUser, ...merged }
						: state.selectedUser,
			};
		});
	},
	upsertConversation: (contact) => {
		if (!contact?.id) return;
		set((state) => ({
			users: [
				contact,
				...state.users.filter((user) => String(user.id) !== String(contact.id)),
			],
			selectedUser:
				String(state.selectedUser?.id) === String(contact.id)
					? { ...state.selectedUser, ...contact }
					: state.selectedUser,
		}));
	},
	removeContact: (contactId) => {
		set((state) => ({
			users: state.users.filter((user) => String(user.id) !== String(contactId)),
			selectedUser:
				String(state.selectedUser?.id) === String(contactId) ? null : state.selectedUser,
		}));
	},
	resetConversation: ({ userId, contact }) => {
		set((state) => {
			const isSelected = String(state.selectedUser?.id) === String(userId);
			const remainingUsers = state.users.filter((user) => String(user.id) !== String(userId));
			return {
				users: contact ? [contact, ...remainingUsers] : remainingUsers,
				selectedUser: isSelected ? contact : state.selectedUser,
				messages: isSelected ? [] : state.messages,
				nextCursor: isSelected ? null : state.nextCursor,
			};
		});
	},
	resetChatState: () =>
		set({
			messages: [],
			users: [],
			usersError: null,
			selectedUser: null,
			nextCursor: null,
			isNewMessage: null,
			addResults: null,
			blockedUsers: [],
			blockedUsersError: null,
		}),
	subscribeToSidebarEvents: (socket) => {
		if (!socket) return;
		socket.off("conversationUpdated");
		socket.off("conversationReset");
		socket.on("conversationUpdated", ({ contact }) => {
			const isNewConversation = !get().users.some(
				(user) => String(user.id) === String(contact?.id)
			);
			get().upsertConversation(contact);
			if (isNewConversation) {
				toast.success(`New message from ${contact.name || contact.username}`);
			}
		});
		socket.on("conversationReset", (payload) => get().resetConversation(payload));
	},
	unsubscribeFromSidebarEvents: (socket) => {
		socket?.off("conversationUpdated");
		socket?.off("conversationReset");
	},

	getUsers: async () => {
		set({ isUsersLoading: true, usersError: null });
		try {
			const res = await axiosInstance.get("/contacts");

			const users = Array.isArray(res.data)
				? res.data.filter((user) => user && Number.isInteger(Number(user.id)))
				: [];
			set({ users });
		} catch (error) {
			const message = error.response?.data?.message || "Failed to load contacts";
			set({ users: [], usersError: message, selectedUser: null, messages: [], nextCursor: null });
			toast.error(message);
			console.log("there was  problem getting users from database");
		} finally {
			set({ isUsersLoading: false });
		}
	},
	//check
	getMessages: async (userId, loadOlder = false) => {
		const cursor = loadOlder ? get().nextCursor : null;
		if (loadOlder && !cursor) return;
		set(loadOlder ? { isOlderMessagesLoading: true } : { isMessagesLoading: true });
		try {
			const res = await axiosInstance.get(`/messages/${userId}`, {
				params: { ...(cursor ? { cursor } : {}), limit: 50 },
			});
			set((state) => ({
				messages: loadOlder ? [...res.data.items, ...state.messages] : res.data.items,
				nextCursor: res.data.nextCursor,
			}));
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to load users");

			console.log("there was  problem getting messages from database");
		} finally {
			set(loadOlder ? { isOlderMessagesLoading: false } : { isMessagesLoading: false });
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
			toast.error(error.response?.data?.message || "Failed to send message");
		}
	},
	subscribeToMessages: (socket) => {
		const { selectedUser } = get();
		if (!selectedUser || !socket) return;

		socket.off("newMessage");
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

	unsubscribeFromMessages: (socket) => {
		socket?.off("newMessage");
	},

	closeChat: () => {
		set({ selectedUser: null });
	},
	//todo: optimize this one later
	setSelectedUser: (user) => {
		const { selectedUser } = get();
		// If same user, do nothing
		if (selectedUser?.id === user.id) return;
		set({ selectedUser: user, messages: [], nextCursor: null });
	},
}));
