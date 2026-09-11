import apiClient from "./client";
import type { LicenseStatus, LicenseRecord } from "@/lib/types";

export const licenseApi = {
  getStatus: () => apiClient.get<LicenseStatus>("/api/license/status"),

  activate: (licenseKey: string) =>
    apiClient.post<{
      success: boolean;
      message: string;
      license: LicenseStatus;
      credits_granted: number;
      new_balance: number | null;
    }>("/api/license/activate", { license_key: licenseKey }),

  myLicenses: () =>
    apiClient.get<LicenseRecord[]>("/api/license/my-licenses"),

  quickRenew: (data: { email: string; password: string; license_key: string }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      token: string;
      user: any;
    }>("/api/license/quick-renew", data),
};

