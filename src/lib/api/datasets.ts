import axios from "axios";
import apiClient, { resolveTargetBaseUrl } from "./client";
import { getCloudApiBase, getLocalApiBase, TOKEN_KEY } from "@/lib/constants";
import type { Dataset, DatasetDetail } from "@/lib/types";

export interface DatasetFilters {
  category?: string;
  division?: string;
  district?: string;
  area?: string;
  search?: string;
}

export const datasetsApi = {
  list: (filters: DatasetFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.division) params.append("division", filters.division);
    if (filters.district) params.append("district", filters.district);
    if (filters.area) params.append("area", filters.area);
    if (filters.search) params.append("search", filters.search);
    return apiClient.get<Dataset[]>(`/api/datasets?${params.toString()}`);
  },

  detail: async (id: string | number, page = 1, limit = 25, search = "") => {
    const url = `/api/datasets/${id}?page=${Math.max(1, Math.floor(Number(page) || 1))}&limit=${limit}&search=${encodeURIComponent(search)}`;
    try {
      return await apiClient.get<DatasetDetail>(url);
    } catch (err: any) {
      // For private jobs (job_...), if primary base URL (local or cloud) failed, attempt fallback to the other base
      if (String(id).startsWith("job_")) {
        const currentTarget = resolveTargetBaseUrl(url);
        const fallbackBase = currentTarget === getLocalApiBase() ? getCloudApiBase() : getLocalApiBase();
        try {
          const res = await axios.get<DatasetDetail>(`${fallbackBase}${url}`, {
            headers: {
              Authorization:
                typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY)
                  ? `Bearer ${localStorage.getItem(TOKEN_KEY)}`
                  : undefined,
            },
            timeout: 10000,
          });
          return res;
        } catch {
          // If fallback also fails, rethrow original error
        }
      }
      throw err;
    }
  },

  unlock: (id: number | string) =>
    apiClient.post<{ message: string; credits?: number }>(`/api/datasets/${id}/unlock`),

  inspectFile: (formData: FormData) =>
    apiClient.post<{
      success: boolean;
      filename: string;
      sheet_names: string[];
      selected_sheet?: string;
      total_rows: number;
      total_raw_rows: number;
      columns: string[];
      raw_columns: string[];
      raw_preview: Record<string, any>[];
      cleaned_preview: Record<string, any>[];
    }>("/api/datasets/inspect-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadPrivate: (formData: FormData) =>
    apiClient.post<{
      success: boolean;
      dataset_id: number;
      name: string;
      row_count: number;
      is_synced: number;
      message: string;
    }>("/api/datasets/upload-private", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  demote: (id: number | string) =>
    apiClient.post<{ message: string }>(`/api/datasets/${id}/demote`),

  publish: (
    id: number | string,
    data?: FormData | { price_credits?: number; proposed_name?: string; proposed_category?: string }
  ) => {
    let payload: FormData | undefined;
    if (data instanceof FormData) {
      payload = data;
    } else if (data) {
      payload = new FormData();
      if (data.price_credits !== undefined) payload.append("price_credits", String(data.price_credits));
      if (data.proposed_name) payload.append("proposed_name", data.proposed_name);
      if (data.proposed_category) payload.append("proposed_category", data.proposed_category);
    }
    return apiClient.post<{ success: boolean; message: string }>(
      `/api/datasets/${id}/publish`,
      payload,
      payload ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
  },

  myPrivate: () =>
    apiClient.get<Dataset[]>("/api/datasets/my-private"),

  syncExistingDataset: (id: number) => {
    const formData = new FormData();
    formData.append("dataset_id", String(id));
    return apiClient.post<{ success: boolean; dataset_id: number; message: string }>(
      "/api/datasets/sync",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  syncToCloud: (formData: FormData) =>
    apiClient.post<{ success: boolean; dataset_id: number; message: string }>(
      "/api/datasets/sync",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ),

  desync: (id: number | string) =>
    apiClient.post<{ success: boolean; dataset_id: number; message: string }>(
      `/api/datasets/${id}/desync`
    ),

  promoteRequest: (formData: FormData) =>
    apiClient.post<{ success: boolean; dataset_id: number; message: string }>(
      "/api/datasets/promote-request",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ),

  delete: (id: number | string) =>
    apiClient.delete<{ success?: boolean; message?: string }>(`/api/datasets/${id}`),

  exportUrl: (id: number | string, format: string, token: string) => {
    const base = String(id).startsWith("job_") ? getLocalApiBase() : getCloudApiBase();
    return `${base}/api/datasets/${id}/export?format=${format}&token=${token}`;
  },
};
