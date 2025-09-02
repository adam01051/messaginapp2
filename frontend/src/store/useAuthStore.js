import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";


 

const BASE_URL =
	import.meta.env.MODE === "development"
		? "http://localhost:5001"
		: "https://app1-zaix.onrender.com";
	
export const useAuthStore = create((set, get) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isUpdatingProfile: false,
	isCheckingAuth: true,
	onlineUsers: [],
	socket: null,
	searchResults: null,

	profilePics: null,



	searchUser: async (username) => {
		try {
			const res = await axiosInstance.get("/auth/usersearch", {
				params: { username }, // ✅ use params for GET
			});
			console.log(res.data, "search dasdassda form");
			set({ searchResults: res.data }); // ✅ update search results in store
		} catch (error) {
			console.error("Error searching user", error);
			set({ searchResults: [] }); // reset results on error
			toast.error("User search failed");
		}
	},

	checkAuth: async () => {
		try {
			const res = await axiosInstance.get("/auth/check");

			set({ authUser: res.data, profilePics: res.data.profilePics });

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
			set({ authUser: res.data });

			toast.success("Account created successfully");
			get().connectSocket();
		} catch (error) {
			toast.error(error.response.data.message);
		} finally {
			set({ isSigningUp: false });
		}
	},

	login: async (data) => {
		set({ isLoggingIn: true });
		try {
			const res = await axiosInstance.post("/auth/login", data);
			set({ authUser: res.data });

			//getimmages(res.data.id)
			const picsRes = await axiosInstance.get("/auth/images");
			set({ profilePics: picsRes.data });

			toast.success("Logged in successfully");

			get().connectSocket();
		} catch (error) {
			toast.error(error.response.data.message);
		} finally {
			set({ isLoggingIn: false });
		}
	},

	logout: async () => {
		try {
			await axiosInstance.post("/auth/logout");
			set({ authUser: null });
			set({ profilePics: null });

			toast.success("Logged out successfully");
			get().disconnectSocket();
		} catch (error) {
			toast.error(error.response.data.message);
		}
	},

	updateProfile: async (data) => {
		set({ isUpdatingProfile: true });
		try {
			const res = await axiosInstance.put("/auth/update-profile", data);
			set({ profilePics: res.data });

			toast.success("Profile updated successfully");
		} catch (error) {
			console.log("error in update profile:", error);
			toast.error(error.response.data.message);
		} finally {
			set({ isUpdatingProfile: false });
		}
	},

	editProfileData: async (data) => {
		try {
			const res = await axiosInstance.put("/auth/edit-profile", data);
			set({ authUser: res.data });
			toast.success("Profile updated successfully");
		} catch (error) {
			console.error("Error in editing profile", error);
			toast.error("Profile update failed");
		}
	},

	connectSocket: () => {
		const { authUser } = get();
		if (!authUser || get().socket?.connected) return;

		const socket = io(BASE_URL, {
			query: {
				userId: authUser.id,
			},
		});
		socket.connect();

		set({ socket: socket });

		socket.on("getOnlineUsers", (userIds) => {
			set({ onlineUsers: userIds });
		});
	},
	disconnectSocket: () => {
		if (get().socket?.connected) get().socket.disconnect();
	},
}));
