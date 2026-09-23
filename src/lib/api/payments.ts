import axios from "axios";
import apiClient from "./client";
import { getCloudApiBase, getLocalApiBase } from "@/lib/constants";
import type { PaymentConfig, PaymentRequest } from "@/lib/types";

export const paymentsApi = {
  /**
   * Fetches package configurations for the public landing page.
   * Priority: Render Cloud Server (authoritative live settings from Supabase) -> Local Engine (fallback) -> default.
   */
  publicPackagesConfig: async (): Promise<{ data: PaymentConfig }> => {
    // 1. Try Cloud backend (Render) first
    const cloudUrl = `${getCloudApiBase()}/api/payments/packages-config`;
    try {
      const res = await axios.get<PaymentConfig>(cloudUrl, { timeout: 8000 });
      if (res.data?.packages && res.data.packages.length > 0) {
        return res;
      }
    } catch {
      // Cloud may be spinning up or offline; proceed to fallback
    }

    // 2. If in local development or cloud failed, try local backend
    try {
      const localUrl = `${getLocalApiBase()}/api/payments/packages-config`;
      const res = await axios.get<PaymentConfig>(localUrl, { timeout: 3000 });
      if (res.data?.packages && res.data.packages.length > 0) {
        return res;
      }
    } catch {
      // Local not running
    }

    // 3. Fallback to standard apiClient
    return apiClient.get<PaymentConfig>("/api/payments/packages-config");
  },

  packagesConfig: () =>
    apiClient.get<PaymentConfig>("/api/payments/packages-config"),

  myRequests: () =>
    apiClient.get<PaymentRequest[]>("/api/payments/my-requests"),

  submitRequest: (data: {
    package_name: string;
    credits_requested: number;
    amount_bdt: number;
    payment_method: string;
    user_name: string;
    bkash_number: string;
    transaction_id: string;
  }) => apiClient.post<{ message: string }>("/api/payments/submit-request", data),
};
