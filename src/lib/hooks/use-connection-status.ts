"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCloudApiBase, getLocalApiBase, isLocalMode } from "@/lib/constants";
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

// Cloud endpoint is checked at most once every 60 seconds (or immediately if offline / on focus)
const CLOUD_CHECK_INTERVAL_MS = 60000;

export function useConnectionStatus(pollIntervalMs: number = 25000): ConnectionStatus {
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [dbOnline, setDbOnline] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [cloudLatencyMs, setCloudLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const lastCloudCheckTimeRef = useRef<number>(0);
  const lastCloudStatusRef = useRef<boolean>(false);

  const localEndpoint = getLocalApiBase();
  const cloudEndpoint = getCloudApiBase();
  const isDesktop = isDesktopApp();
  const shouldCheckLocal = isDesktop || isLocalMode();

  const performCheck = useCallback(async (forceCloudCheck = false) => {
    // 1. Skip check if browser tab is in background (saves massive CPU & server bandwidth)
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    setIsChecking(true);
    const now = Date.now();

    let localUp = false;
    let localElapsed: number | null = null;
    let localErr: string | null = null;

    // 2. Check Local Python Automation Engine (127.0.0.1:8000)
    // Only check local engine if in Desktop app or local dev mode
    if (shouldCheckLocal) {
      const startTime = Date.now();
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
          const timeoutId = setTimeout(() => localController.abort(), 3000);
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
    }

    // 3. Check Central Cloud Control Plane (Render & Supabase)
    // Throttle cloud health checks to at most once every CLOUD_CHECK_INTERVAL_MS (60s),
    // unless forced (e.g. checkNow() or first run or cloud was down)
    const timeSinceLastCloudCheck = now - lastCloudCheckTimeRef.current;
    const needCloudCheck =
      forceCloudCheck ||
      timeSinceLastCloudCheck >= CLOUD_CHECK_INTERVAL_MS ||
      !lastCloudStatusRef.current ||
      lastCloudCheckTimeRef.current === 0;

    let cloudUp = lastCloudStatusRef.current;
    let cloudElapsed: number | null = cloudLatencyMs;

    if (needCloudCheck) {
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
        } else {
          cloudUp = false;
        }
      } catch {
        cloudUp = false;
      }
      lastCloudCheckTimeRef.current = Date.now();
      lastCloudStatusRef.current = cloudUp;
    }

    if (isMountedRef.current) {
      // In web browser (non-desktop), if local engine is not used, mark backendOnline based on cloud status
      const effectiveLocalUp = localUp || (!isDesktop && cloudUp);
      setBackendOnline(effectiveLocalUp);
      setDbOnline(cloudUp);
      if (localElapsed !== null) setLatencyMs(localElapsed);
      if (cloudElapsed !== null) setCloudLatencyMs(cloudElapsed);
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
  }, [localEndpoint, cloudEndpoint, isDesktop, shouldCheckLocal, cloudLatencyMs]);

  useEffect(() => {
    isMountedRef.current = true;
    performCheck(true);

    const interval = setInterval(() => {
      performCheck(false);
    }, pollIntervalMs);

    // Pause in background, immediately re-check on tab focus / visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        performCheck(true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
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
    checkNow: () => performCheck(true),
  };
}
