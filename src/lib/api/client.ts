import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getApiBase, TOKEN_KEY } from "@/lib/constants";

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBase(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor — auto-attach Bearer token & ensure current baseURL
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBase();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      // Redirect handled by auth context, not here
    }
    return Promise.reject(error);
  }
);

export default apiClient;
