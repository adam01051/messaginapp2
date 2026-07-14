import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";


 

const BASE_URL =
	import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
	

export const useAuthStore = create((set, get) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isUpdatingProfile: false,
	isCheckingAuth: true,
	onlineUsers: [],
	socket: null,
	searchResults: null,
	profilePics: [],



	searchUser: async (username) => {
		try {
			const res = await axiosInstance.get("/auth/usersearch", {
				params: { username },
			});
		
			set({ searchResults: res.data }); 
		} catch (error) {
			console.error("Error searching user", error);
			set({ searchResults: [] }); 
			toast.error("User search failed");
		}
	},

	checkAuth: async () => {
		try {
			const res = await axiosInstance.get("/auth/check");

			set({ authUser: res.data, profilePics: res.data.profilePics || [] });

			get().connectSocket();
		} catch (error) {
			console.log("Error in checkAuth:", error);
			set({ authUser: null });
		} finally {
			set({ isCheckingAuth: false });
		}
	},

	signup: async (data) => {
		set({ isSigningUp: true });
		try {
			const res = await axiosInstance.post("/auth/signup", data);
			set({ authUser: res.data, profilePics: res.data.profilePics || [] });

			toast.success("Account created successfully");
			get().connectSocket();
		} catch (error) {
			toast.error(error.response?.data?.message || "Account creation failed");
		} finally {
			set({ isSigningUp: false });
		}
	},

	login: async (data) => {
		set({ isLoggingIn: true });
		try {
			const res = await axiosInstance.post("/auth/login", data);
			set({ authUser: res.data, profilePics: res.data.profilePics || [] });

			toast.success("Logged in successfully");

			get().connectSocket();
		} catch (error) {
			toast.error(error.response?.data?.message || "Login failed");
		} finally {
			set({ isLoggingIn: false });
		}
	},

	logout: async () => {
		try {
			await axiosInstance.post("/auth/logout");
			set({ authUser: null });
			set({ profilePics: [] });

			toast.success("Logged out successfully");
			get().disconnectSocket();
			useChatStore.getState().resetChatState();
		} catch (error) {
			toast.error(error.response?.data?.message || "Logout failed");
		}
	},

	updateProfile: async (data) => {
		set({ isUpdatingProfile: true });
		try {
			const res = await axiosInstance.put("/auth/update-profile", data);
			set((state) => ({
				profilePics: [res.data, ...state.profilePics],
				authUser: {
					...state.authUser,
					profilePics: [res.data, ...(state.authUser?.profilePics || [])],
				},
			}));

			toast.success("Profile updated successfully");
		} catch (error) {
			console.log("error in update profile:", error);
			toast.error(error.response?.data?.message || "Profile update failed");
		} finally {
			set({ isUpdatingProfile: false });
		}
	},

	editProfileData: async (data) => {
		try {
			const res = await axiosInstance.put("/auth/edit-profile", data);
			set({ authUser: res.data, profilePics: res.data.profilePics || [] });
			toast.success("Profile updated successfully");
		} catch (error) {
			console.error("Error in editing profile", error);
			toast.error("Profile update failed");
		}
	},

	connectSocket: () => {
		const { authUser } = get();
		if (!authUser || get().socket?.connected) return;

		const socket = io(BASE_URL, { withCredentials: true, autoConnect: false });

		set({ socket: socket });

		socket.on("getOnlineUsers", (userIds) => {
			set({ onlineUsers: userIds });
		});
		useChatStore.getState().subscribeToContactEvents(socket);
		socket.connect();
	},
	disconnectSocket: () => {
		const socket = get().socket;
		useChatStore.getState().unsubscribeFromContactEvents(socket);
		if (socket?.connected) socket.disconnect();
		set({ socket: null, onlineUsers: [] });
	},
}));
