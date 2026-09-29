import apiClient from "./client";
import { getLocalApiBase, TOKEN_KEY } from "@/lib/constants";
import type { ScraperJob, EcommerceProductItem, EcommercePlatform } from "@/lib/types";

export interface EcommerceJobDataResponse {
  job_id: number;
  query: string;
  scraper_type: string;
  count: number;
  data: EcommerceProductItem[];
}

export const ecommerceApi = {
  startScrape: (payload: {
    url?: string;
    query?: string;
    platform?: string;
    pages?: number;
    max_items?: number;
    headless?: boolean;
  }) =>
    apiClient.post<{ success: boolean; job_id: number }>(
      "/api/scraper/ecommerce/scrape",
      payload
    ),

  listJobs: () => apiClient.get<ScraperJob[]>("/api/scraper/ecommerce/jobs"),

  listPlatforms: () => apiClient.get<EcommercePlatform[]>("/api/scraper/ecommerce/platforms"),

  jobData: (jobId: number) =>
    apiClient.get<EcommerceJobDataResponse>(`/api/scraper/jobs/${jobId}/data`),

  downloadJobUrl: (jobId: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : "";
    return `${getLocalApiBase()}/api/scraper/jobs/${jobId}/download?token=${encodeURIComponent(token || "")}`;
  },
};
