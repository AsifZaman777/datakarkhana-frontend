import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getCloudApiBase, getLocalApiBase, TOKEN_KEY } from "@/lib/constants";

/**
 * Resolves whether a route should target the local Python automation engine (127.0.0.1:8000)
 * or the central cloud control plane (Render / Supabase).
 */
export function resolveTargetBaseUrl(url?: string): string {
  if (!url) return getCloudApiBase();
  const cleanUrl = url.toLowerCase();
  // Local machine automation routes (Selenium scraping, WhatsApp Web, local scrape datasets)
  if (
    cleanUrl.startsWith("/api/scraper") ||
    cleanUrl.startsWith("/api/marketing") ||
    cleanUrl.startsWith("/api/local") ||
    cleanUrl.startsWith("/api/datasets/job_")
  ) {
    return getLocalApiBase();
  }
  // All other routes (auth, me, datasets, payments, admin, licenses, requests)
  return getCloudApiBase();
}

const apiClient: AxiosInstance = axios.create({
  baseURL: getCloudApiBase(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor — auto-attach Bearer token & dynamically route base URL
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = resolveTargetBaseUrl(config.url);
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
