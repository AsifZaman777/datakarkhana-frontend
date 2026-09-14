"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCloudApiBase, getLocalApiBase } from "@/lib/constants";
import { isDesktopApp } from "@/lib/desktop";

export interface ConnectionStatus {
  backendOnline: boolean;
  dbOnline: boolean;
  isChecking: boolean;
  latencyMs: number | null;
  cloudLatencyMs: number | null;
  lastChecked: Date | null;
  errorMessage: string | null;
  apiEndpoint: string;
  cloudEndpoint: string;
  isDesktop: boolean;
  checkNow: () => Promise<void>;
}

export function useConnectionStatus(pollIntervalMs: number = 8000): ConnectionStatus {
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [dbOnline, setDbOnline] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [cloudLatencyMs, setCloudLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const localEndpoint = getLocalApiBase();
  const cloudEndpoint = getCloudApiBase();
  const isDesktop = isDesktopApp();

  const performCheck = useCallback(async () => {
    setIsChecking(true);
    const startTime = Date.now();

    let localUp = false;
    let localElapsed: number | null = null;
    let localErr: string | null = null;

    // 1. Check Local Python Automation Engine (127.0.0.1:8000)
    try {
      if (typeof window !== "undefined" && (window as any).electronAPI?.getBackendStatus) {
        try {
          const status = await (window as any).electronAPI.getBackendStatus();
          localUp = Boolean(status?.backend || status?.healthy);
        } catch {
          // Fall through to HTTP fetch
        }
      }

      if (!localUp) {
        const localController = new AbortController();
        const timeoutId = setTimeout(() => localController.abort(), 3500);
        const res = await fetch(`${localEndpoint}/api/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: localController.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          localUp = data?.status === "healthy" || res.status === 200;
          localElapsed = Date.now() - startTime;
        }
      } else {
        localElapsed = Date.now() - startTime;
      }
    } catch (err: any) {
      localUp = false;
      localErr = err.name === "AbortError" ? "Local automation engine offline (port 8000)" : err.message;
    }

    // 2. Check Central Cloud Control Plane (Render & Supabase)
    let cloudUp = false;
    let cloudElapsed: number | null = null;
    const cloudStart = Date.now();
    try {
      const cloudController = new AbortController();
      const cloudTimeout = setTimeout(() => cloudController.abort(), 4000);
      const cloudRes = await fetch(`${cloudEndpoint}/api/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: cloudController.signal,
      });
      clearTimeout(cloudTimeout);
      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        cloudUp = cloudData?.status === "healthy" || cloudRes.status === 200;
        cloudElapsed = Date.now() - cloudStart;
      }
    } catch {
      cloudUp = false;
    }

    if (isMountedRef.current) {
      // In web browser (non-desktop), if local engine is not present, mark backendOnline based on cloud status
      const effectiveLocalUp = localUp || (!isDesktop && cloudUp);
      setBackendOnline(effectiveLocalUp);
      setDbOnline(cloudUp);
      setLatencyMs(localElapsed);
      setCloudLatencyMs(cloudElapsed);
      setLastChecked(new Date());
      setErrorMessage(
        effectiveLocalUp && cloudUp
          ? null
          : !effectiveLocalUp
          ? localErr || "Local engine offline on port 8000"
          : "Cloud control plane unreachable"
      );
      setIsChecking(false);
    }
  }, [localEndpoint, cloudEndpoint, isDesktop]);

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
    cloudLatencyMs,
    lastChecked,
    errorMessage,
    apiEndpoint: localEndpoint,
    cloudEndpoint,
    isDesktop,
    checkNow: performCheck,
  };
}
