import apiClient from "./client";

export interface ModelSpec {
  id: string;
  name: string;
  author: string;
  filename: string;
  file_size_bytes: number;
  file_size_formatted: string;
  ram_required_mb: number;
  context_window: number;
  inference_speed_tok_s: string;
  tags: string[];
  download_url: string;
  description_en: string;
  description_bn: string;
  recommended: boolean;
  is_installed: boolean;
  is_active: boolean;
}

export interface SystemHardwareInfo {
  total_ram_gb: number;
  available_ram_gb: number;
  cpu_cores: number;
  models_dir: string;
  disk_free_gb: number;
  installed_models_count: number;
}

export interface InspectHuggingFaceResult {
  valid: boolean;
  filename: string;
  download_url: string;
  file_size_bytes: number;
  file_size_formatted: string;
  estimated_ram_mb: number;
  model_name: string;
  author: string;
  error?: string | null;
}

export interface DownloadProgress {
  task_id: string;
  model_id: string;
  filename: string;
  name: string;
  total_bytes: number;
  downloaded_bytes: number;
  progress_percent: number;
  speed_mbps: number;
  eta_seconds: number;
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  error?: string | null;
}

export interface InstalledModel {
  id: string;
  name: string;
  filename: string;
  file_size_bytes: number;
  file_size_formatted: string;
  ram_required_mb: number;
  path: string;
  installed_at: string;
  is_active: boolean;
  tags: string[];
}

export interface GenerateVariantsResponse {
  variants: string[];
  model_used: string;
  latency_ms: number;
  tokens_generated?: number;
}

export interface AuditSpamResponse {
  risk_level: "low" | "medium" | "high";
  spam_score: number;
  flagged_reasons: string[];
  suggested_rewrite: string;
  model_used: string;
  latency_ms: number;
}

export const modelsApi = {
  getSystemInfo: async (): Promise<SystemHardwareInfo> => {
    const res = await apiClient.get<SystemHardwareInfo>("/api/models/system-info");
    return res.data;
  },

  getRecommended: async (): Promise<ModelSpec[]> => {
    const res = await apiClient.get<ModelSpec[]>("/api/models/recommended");
    return res.data;
  },

  getInstalled: async (): Promise<InstalledModel[]> => {
    const res = await apiClient.get<InstalledModel[]>("/api/models/installed");
    return res.data;
  },

  setActive: async (filename: string): Promise<{ status: string; active_model: string }> => {
    const res = await apiClient.post("/api/models/set-active", { filename });
    return res.data;
  },

  deleteModel: async (filename: string): Promise<{ status: string; deleted: string }> => {
    const res = await apiClient.delete(`/api/models/${encodeURIComponent(filename)}`);
    return res.data;
  },

  inspectHuggingFace: async (urlOrRepo: string): Promise<InspectHuggingFaceResult> => {
    const res = await apiClient.post<InspectHuggingFaceResult>("/api/models/inspect", {
      url_or_repo: urlOrRepo,
    });
    return res.data;
  },

  downloadModel: async (payload: {
    model_id?: string;
    custom_url?: string;
    custom_name?: string;
    filename?: string;
  }): Promise<DownloadProgress> => {
    const res = await apiClient.post<DownloadProgress>("/api/models/download", payload);
    return res.data;
  },

  getProgress: async (taskId: string): Promise<DownloadProgress> => {
    const res = await apiClient.get<DownloadProgress>(`/api/models/download/progress/${taskId}`);
    return res.data;
  },

  cancelDownload: async (taskId: string): Promise<{ status: string }> => {
    const res = await apiClient.post(`/api/models/download/cancel/${taskId}`);
    return res.data;
  },

  generateVariants: async (
    baseTemplate: string,
    count: number = 3,
    language: string = "bn",
    modelFilename?: string
  ): Promise<GenerateVariantsResponse> => {
    const res = await apiClient.post<GenerateVariantsResponse>("/api/models/generate-variants", {
      base_template: baseTemplate,
      count,
      language,
      model_filename: modelFilename,
    });
    return res.data;
  },

  auditSpam: async (
    text: string,
    language: string = "bn",
    modelFilename?: string
  ): Promise<AuditSpamResponse> => {
    const res = await apiClient.post<AuditSpamResponse>("/api/models/audit-spam", {
      text,
      language,
      model_filename: modelFilename,
    });
    return res.data;
  },

  generate: async (
    prompt: string,
    modelFilename?: string,
    maxTokens: number = 512,
    temperature: number = 0.7
  ): Promise<{ text: string; model_used: string; latency_ms: number }> => {
    const res = await apiClient.post("/api/models/generate", {
      prompt,
      model_filename: modelFilename,
      max_tokens: maxTokens,
      temperature,
    });
    return res.data;
  },
};
