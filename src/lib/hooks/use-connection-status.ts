"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getApiBase } from "@/lib/constants";
import { isDesktopApp } from "@/lib/desktop";

export interface ConnectionStatus {
  backendOnline: boolean;
  dbOnline: boolean;
  isChecking: boolean;
  latencyMs: number | null;
  lastChecked: Date | null;
  errorMessage: string | null;
  apiEndpoint: string;
  isDesktop: boolean;
  checkNow: () => Promise<void>;
}

export function useConnectionStatus(pollIntervalMs: number = 8000): ConnectionStatus {
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [dbOnline, setDbOnline] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const apiEndpoint = getApiBase();
  const isDesktop = isDesktopApp();

  const performCheck = useCallback(async () => {
    setIsChecking(true);
    const startTime = Date.now();

    try {
      // 1. If running inside Desktop Electron, try IPC first for zero-CORS status
      if (typeof window !== "undefined" && (window as any).electronAPI?.getBackendStatus) {
        try {
          const status = await (window as any).electronAPI.getBackendStatus();
          if (isMountedRef.current) {
            const backendUp = Boolean(status?.backend || status?.healthy);
            const dbUp = Boolean(status?.database);
            setBackendOnline(backendUp);
            setDbOnline(dbUp);
            setLatencyMs(Date.now() - startTime);
            setLastChecked(new Date());
            setErrorMessage(backendUp ? null : status?.error || "Backend offline on port 8000");
            setIsChecking(false);
            if (backendUp) return;
          }
        } catch {
          // Fall through to HTTP fetch
        }
      }

      // 2. Direct HTTP Health Check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const healthUrl = `${apiEndpoint}/api/health`;
      const res = await fetch(healthUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Backend responded with error`);
      }

      const data = await res.json();
      if (isMountedRef.current) {
        const isBackendUp = data?.status === "healthy" || res.status === 200;
        const isDbUp = data?.database === "ok" || (!data?.database && isBackendUp);

        setBackendOnline(isBackendUp);
        setDbOnline(isDbUp);
        setLatencyMs(elapsed);
        setLastChecked(new Date());
        setErrorMessage(
          isDbUp
            ? null
            : typeof data?.database === "string"
            ? data.database
            : "Database connection issue"
        );
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setBackendOnline(false);
        setDbOnline(false);
        setLatencyMs(null);
        setLastChecked(new Date());
        setErrorMessage(
          err.name === "AbortError"
            ? "Connection timed out (port 8000 not responding)"
            : err.message || "Failed to reach backend server"
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [apiEndpoint]);

  useEffect(() => {
    isMountedRef.current = true;
    performCheck();

    const interval = setInterval(() => {
      performCheck();
    }, pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [performCheck, pollIntervalMs]);

  return {
    backendOnline,
    dbOnline,
    isChecking,
    latencyMs,
    lastChecked,
    errorMessage,
    apiEndpoint,
    isDesktop,
    checkNow: performCheck,
  };
}
