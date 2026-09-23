import axios from "axios";
import apiClient from "./client";
import { getLocalApiBase, TOKEN_KEY } from "@/lib/constants";
import type {
  User,
  SecurityViolation,
  PromotionRequest,
  PaymentRequest,
  DatasetRequest,
  DashboardOverview,
  UserPrivateDatasetsResponse,
  LicenseRecord,
  CloudStorageOverview,
  UserUploadedDataset,
  TierPermission,
} from "@/lib/types";

export const adminApi = {
  // ── Users ──
  listUsers: () => apiClient.get<User[]>("/api/admin/users"),

  addCredits: (userId: number, amount: number) =>
    apiClient.post("/api/admin/users/add-credits", {
      user_id: userId,
      amount,
    }),

  updateUserRole: (userId: number, role: string) =>
    apiClient.patch(`/api/admin/users/${userId}`, { role }),

  banUser: (
    userId: number,
    data: {
      is_banned: number;
      warning_message: string;
      ban_ip: boolean;
      ip_address: string;
    }
  ) => apiClient.post(`/api/admin/users/${userId}/ban`, data),

  deleteUser: (userId: number) =>
    apiClient.delete<{ success: boolean; detail?: string }>(
      `/api/admin/users/${userId}`
    ),

  setWarning: (userId: number, warningMessage: string) =>
    apiClient.post(`/api/admin/users/${userId}/warning`, {
      warning_message: warningMessage,
    }),

  setUserAllowSync: (userId: number, allowSync: boolean) =>
    apiClient.post<{ success: boolean; allow_sync: number; message: string }>(
      `/api/admin/users/${userId}/allow-sync`,
      { allow_sync: allowSync ? 1 : 0 }
    ),

  setUserUploadLimit: (userId: number, maxSyncFiles: number) =>
    apiClient.post<{ success: boolean; max_sync_files: number; message: string }>(
      `/api/admin/users/${userId}/upload-limit`,
      { max_sync_files: maxSyncFiles }
    ),

  getUserDatasets: (userId: number) =>
    apiClient.get<{ user: { id: number; email: string; full_name: string }; total: number; datasets: UserUploadedDataset[] }>(
      `/api/admin/users/${userId}/datasets`
    ),

  getStorageOverview: () =>
    apiClient.get<CloudStorageOverview>("/api/admin/storage/overview"),

  // ── Security Violations ──
  listViolations: () =>
    apiClient.get<SecurityViolation[]>("/api/admin/violations"),

  seedTestViolations: () =>
    apiClient.post("/api/admin/violations/seed-test"),

  // ── Promotion Requests ──
  listPromotionRequests: () =>
    apiClient.get<PromotionRequest[]>("/api/admin/promotion-requests"),

  approvePromotion: (jobId: number) =>
    apiClient.post<{ message: string }>(
      `/api/admin/promotion-requests/${jobId}/approve`
    ),

  rejectPromotion: (jobId: number) =>
    apiClient.post<{ message: string }>(
      `/api/admin/promotion-requests/${jobId}/reject`
    ),

  // ── Payment Requests ──
  listPaymentRequests: () =>
    apiClient.get<PaymentRequest[]>("/api/admin/payment-requests"),

  approvePayment: (
    requestId: number,
    payload?: { expiry_days?: number; expires_at?: string; custom_key?: string }
  ) =>
    apiClient.post<{
      success: boolean;
      message: string;
      credits_pending?: number;
      email_sent?: boolean;
      license?: {
        production_key: string;
        license_token: string;
        customer_name: string;
        expires_at: string;
        days_remaining: number;
      };
    }>(`/api/admin/payment-requests/${requestId}/approve`, payload || {}),

  rejectPayment: (requestId: number, reason: string) => {
    const formData = new FormData();
    formData.append("rejection_reason", reason);
    return apiClient.post(
      `/api/admin/payment-requests/${requestId}/reject`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  // ── Desktop Production Licenses ──
  listLicenses: () => apiClient.get<LicenseRecord[]>("/api/admin/licenses"),

  generateLicense: (data: {
    customer_name: string;
    customer_email?: string;
    expiry_days?: number;
    expires_at?: string;
    custom_key?: string;
    plan_tier?: string;
    credits_amount?: number;
  }) =>
    apiClient.post<{
      success: boolean;
      license: LicenseRecord;
    }>("/api/admin/licenses/generate", data),

  extendLicense: (licenseId: number, additional_days: number) =>
    apiClient.post<{
      success: boolean;
      message: string;
      license: LicenseRecord;
    }>(`/api/admin/licenses/${licenseId}/extend`, { additional_days }),

  revokeLicense: (licenseId: number) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/api/admin/licenses/${licenseId}/revoke`
    ),

  // ── Payment Gateway Settings ──
  savePaymentSettings: (formData: FormData) =>
    apiClient.post<{ message: string }>("/api/admin/payment-settings", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ── Dataset Uploads ──
  uploadDataset: (formData: FormData) =>
    apiClient.post("/api/admin/datasets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteDataset: (id: number) =>
    apiClient.delete(`/api/admin/datasets/${id}`),

  // ── Dataset Requests (Admin) ──
  listDatasetRequests: () =>
    apiClient.get<DatasetRequest[]>("/api/requests/admin/list"),

  updateRequestStatus: (
    requestId: number,
    data: {
      status: string;
      admin_notes?: string;
      notify_channel?: string;
      custom_message?: string;
    }
  ) =>
    apiClient.post<{ message: string }>(
      `/api/requests/admin/${requestId}/status`,
      data
    ),

  // ── Admin Dashboard Overview ──
  getDashboardOverview: (refresh = false) =>
    apiClient.get<DashboardOverview>(
      `/api/admin/dashboard-overview${refresh ? "?refresh=true" : ""}`
    ),

  getUserPrivateDatasets: (userId: number) =>
    apiClient.get<UserPrivateDatasetsResponse>(
      `/api/admin/users/${userId}/private-datasets`
    ),

  deleteUserPrivateDataset: (userId: number, jobId: number) =>
    apiClient.delete<{ success: boolean; message: string }>(
      `/api/admin/users/${userId}/private-datasets/${jobId}`
    ),

  downloadUserPrivateDataset: (userId: number, jobId: number) =>
    apiClient.get(`/api/admin/users/${userId}/private-datasets/${jobId}/download`, {
      responseType: "blob",
    }),

  savePackageSettings: async (data: { packages: any[]; custom_package?: any }) => {
    try {
      return await apiClient.post<{ success: boolean; message: string }>(
        "/api/admin/package-settings",
        data
      );
    } catch (err: any) {
      if (err?.response?.status === 404 || !err.response) {
        // Fallback to local engine directly if cloud is unreachable or running older deployment
        const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        return await axios.post<{ success: boolean; message: string }>(
          `${getLocalApiBase()}/api/admin/package-settings`,
          data,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
      }
      throw err;
    }
  },

  // ── Tier Access Control & Permissions ──
  getTierPermissions: async () => {
    try {
      return await apiClient.get<TierPermission[]>("/api/admin/tier-permissions");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Fallback to local engine directly if central cloud is running an older deployment
        const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        return await axios.get<TierPermission[]>(`${getLocalApiBase()}/api/admin/tier-permissions`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      }
      throw err;
    }
  },

  saveTierPermissions: async (tiers: TierPermission[], applyToExisting = false) => {
    try {
      return await apiClient.post<{ success: boolean; message: string }>(
        "/api/admin/tier-permissions",
        { tiers, apply_to_existing_users: applyToExisting }
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        return await axios.post<{ success: boolean; message: string }>(
          `${getLocalApiBase()}/api/admin/tier-permissions`,
          { tiers, apply_to_existing_users: applyToExisting },
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
      }
      throw err;
    }
  },

  setUserPermissionsOverride: async (
    userId: number,
    data: { allow_sync?: number; max_sync_files?: number; allow_download?: number }
  ) => {
    try {
      return await apiClient.post<{
        success: boolean;
        message: string;
        effective_permissions: any;
      }>(`/api/admin/users/${userId}/permissions`, data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        return await axios.post<{
          success: boolean;
          message: string;
          effective_permissions: any;
        }>(`${getLocalApiBase()}/api/admin/users/${userId}/permissions`, data, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      }
      throw err;
    }
  },
};
