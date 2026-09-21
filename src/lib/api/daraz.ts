import apiClient from "./client";
import { getLocalApiBase, TOKEN_KEY } from "@/lib/constants";
import type { ScraperJob, DarazProductItem } from "@/lib/types";

export interface DarazJobDataResponse {
  job_id: number;
  query: string;
  scraper_type: string;
  count: number;
  data: DarazProductItem[];
}

export const darazApi = {
  startScrape: (payload: {
    query: string;
    pages?: number;
    max_items?: number;
    headless?: boolean;
  }) =>
    apiClient.post<{ success: boolean; job_id: number }>(
      "/api/scraper/daraz/scrape",
      payload
    ),

  listJobs: () => apiClient.get<ScraperJob[]>("/api/scraper/daraz/jobs"),

  jobData: (jobId: number) =>
    apiClient.get<DarazJobDataResponse>(`/api/scraper/jobs/${jobId}/data`),

  downloadJobUrl: (jobId: number) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : "";
    return `${getLocalApiBase()}/api/scraper/jobs/${jobId}/download?token=${encodeURIComponent(token || "")}`;
  },
};
