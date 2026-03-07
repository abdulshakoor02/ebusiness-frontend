import axios from "axios";
import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to attach the Bearer token
apiClient.interceptors.request.use(
    async (config) => {
        // Only fetch session on the client browser dynamically when making requests
        if (typeof window !== "undefined") {
            const session = await getSession();
            if (session?.user?.token) {
                config.headers.Authorization = `Bearer ${session.user.token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling global API errors (like 401s)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                // Optional: Force logout or redirect
            }
        }
        return Promise.reject(error);
    }
);
