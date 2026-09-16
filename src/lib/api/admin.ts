import apiClient from "./client";
import type {
  User,
  SecurityViolation,
  PromotionRequest,
  PaymentRequest,
  DatasetRequest,
  DashboardOverview,
  UserPrivateDatasetsResponse,
  LicenseRecord,
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

  savePackageSettings: (data: { packages: any[]; custom_package?: any }) =>
    apiClient.post<{ success: boolean; message: string }>(
      "/api/admin/package-settings",
      data
    ),
};
