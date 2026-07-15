const configuredBackendOrigin = import.meta.env.VITE_BACKEND_ORIGIN?.trim();

export const BACKEND_ORIGIN = (configuredBackendOrigin || "http://localhost:6001").replace(/\/$/, "");
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;
