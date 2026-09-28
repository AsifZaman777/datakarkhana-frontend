"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  modelsApi,
  type ModelSpec,
  type InstalledModel,
  type SystemHardwareInfo,
  type DownloadProgress,
} from "@/lib/api/models";
import { toast } from "sonner";
import { useLanguage } from "./language-provider";

import { DEFAULT_RECOMMENDED_MODELS } from "@/lib/default-models";

interface LocalModelsContextType {
  installedModels: InstalledModel[];
  recommendedModels: ModelSpec[];
  activeModel: InstalledModel | null;
  systemInfo: SystemHardwareInfo | null;
  isLoading: boolean;
  isModelHubOpen: boolean;
  activeDownload: DownloadProgress | null;
  openModelHub: () => void;
  closeModelHub: () => void;
  refreshModels: () => Promise<void>;
  startDownload: (modelId?: string, customUrl?: string, customName?: string) => Promise<void>;
  cancelDownload: () => Promise<void>;
  deleteModel: (filename: string) => Promise<void>;
  setActiveModel: (filename: string) => Promise<void>;
}

const LocalModelsContext = createContext<LocalModelsContextType | undefined>(undefined);

export function LocalModelsProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<ModelSpec[]>(DEFAULT_RECOMMENDED_MODELS);
  const [systemInfo, setSystemInfo] = useState<SystemHardwareInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelHubOpen, setIsModelHubOpen] = useState(false);
  const [activeDownload, setActiveDownload] = useState<DownloadProgress | null>(null);

  const refreshModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const [installed, recommended, sys] = await Promise.allSettled([
        modelsApi.getInstalled(),
        modelsApi.getRecommended(),
        modelsApi.getSystemInfo(),
      ]);

      const currentInstalled = installed.status === "fulfilled" ? installed.value : [];
      if (installed.status === "fulfilled") {
        setInstalledModels(installed.value);
      }

      if (recommended.status === "fulfilled" && Array.isArray(recommended.value) && recommended.value.length > 0) {
        setRecommendedModels(recommended.value);
      } else {
        // Fallback to offline default curated models with live installed flags
        const installedFilenames = new Set(currentInstalled.map((m) => m.filename));
        setRecommendedModels((prev) => {
          const base = prev.length > 0 ? prev : DEFAULT_RECOMMENDED_MODELS;
          return base.map((m) => {
            const isInstalled = installedFilenames.has(m.filename);
            const activeMatch = currentInstalled.find((x) => x.filename === m.filename);
            return {
              ...m,
              is_installed: isInstalled,
              is_active: activeMatch ? activeMatch.is_active : false,
            };
          });
        });
      }

      if (sys.status === "fulfilled") {
        setSystemInfo(sys.value);
      }
    } catch (err) {
      console.error("[LOCAL MODELS] Failed to refresh models:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  // Active download polling loop
  useEffect(() => {
    if (
      !activeDownload ||
      activeDownload.status === "completed" ||
      activeDownload.status === "failed" ||
      activeDownload.status === "cancelled"
    ) {
      return;
    }

    const taskId = activeDownload.task_id;

    const interval = setInterval(async () => {
      try {
        const progress = await modelsApi.getProgress(taskId);
        setActiveDownload(progress);

        if (progress.status === "completed") {
          toast.success(
            lang === "bn"
              ? `✅ মডেল '${progress.name}' সফলভাবে ডাউনলোড সম্পন্ন হয়েছে!`
              : `✅ Model '${progress.name}' downloaded and ready to use!`
          );
          refreshModels();
        } else if (progress.status === "failed") {
          toast.error(
            lang === "bn"
              ? `❌ ডাউনলোড ব্যর্থ হয়েছে: ${progress.error || "অজানা ত্রুটি"}`
              : `❌ Download failed: ${progress.error || "Unknown error"}`
          );
        }
      } catch (err) {
        console.error("[LOCAL MODELS] Progress polling error:", err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeDownload?.task_id, activeDownload?.status, lang, refreshModels]);

  const startDownload = async (modelId?: string, customUrl?: string, customName?: string) => {
    try {
      const res = await modelsApi.downloadModel({
        model_id: modelId,
        custom_url: customUrl,
        custom_name: customName,
      });

      if (res.status === "completed") {
        toast.info(
          lang === "bn"
            ? "মডেলটি ইতিমধ্যে ডাউনলোড করা আছে।"
            : "Model is already downloaded on your device."
        );
        refreshModels();
        return;
      }

      setActiveDownload(res);
      toast.info(
        lang === "bn"
          ? `📥 '${res.name}' ডাউনলোড শুরু হয়েছে...`
          : `📥 Downloading '${res.name}' in background...`
      );
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to start download";
      toast.error(msg);
      throw err;
    }
  };

  const cancelDownload = async () => {
    if (!activeDownload) return;
    try {
      await modelsApi.cancelDownload(activeDownload.task_id);
      setActiveDownload((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      toast.info(lang === "bn" ? "ডাউনলোড বাতিল করা হয়েছে।" : "Download cancelled.");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  const deleteModel = async (filename: string) => {
    try {
      await modelsApi.deleteModel(filename);
      toast.success(
        lang === "bn" ? "মডেল ফাইলটি মুছে ফেলা হয়েছে।" : "Model deleted successfully."
      );
      refreshModels();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete model");
    }
  };

  const setActiveModel = async (filename: string) => {
    try {
      await modelsApi.setActive(filename);
      toast.success(
        lang === "bn"
          ? "ডিফল্ট অ্যাক্টিভ মডেল হিসেবে সেট করা হয়েছে।"
          : "Set as active default AI model."
      );
      refreshModels();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to activate model");
    }
  };

  const activeModel = installedModels.find((m) => m.is_active) || installedModels[0] || null;

  return (
    <LocalModelsContext.Provider
      value={{
        installedModels,
        recommendedModels,
        activeModel,
        systemInfo,
        isLoading,
        isModelHubOpen,
        activeDownload,
        openModelHub: () => setIsModelHubOpen(true),
        closeModelHub: () => setIsModelHubOpen(false),
        refreshModels,
        startDownload,
        cancelDownload,
        deleteModel,
        setActiveModel,
      }}
    >
      {children}
    </LocalModelsContext.Provider>
  );
}

export function useLocalModels() {
  const context = useContext(LocalModelsContext);
  if (!context) {
    throw new Error("useLocalModels must be used within a LocalModelsProvider");
  }
  return context;
}
