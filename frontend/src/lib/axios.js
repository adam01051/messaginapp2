import axios from "axios";

export const axiosInstance = axios.create({
	baseURL:
		import.meta.env.MODE === "development"
			? "http://localhost:6001/api"
			: "/api",
	withCredentials: true,
});
