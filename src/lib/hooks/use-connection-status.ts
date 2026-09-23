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

interface HealthCheckResult {
  localUp: boolean;
  cloudUp: boolean;
  localElapsed: number | null;
  cloudElapsed: number | null;
  localErr: string | null;
  timestamp: Date;
}

// Module-level deduplication: guarantees only ONE actual health check runs at any given time across all mounted components
let globalInFlightPromise: Promise<HealthCheckResult> | null = null;
let lastGlobalResult: HealthCheckResult | null = null;
let lastCloudCheckTime = 0;

const CLOUD_CHECK_INTERVAL_MS = 60000;

async function executeHealthCheck(
  localEndpoint: string,
  cloudEndpoint: string,
  shouldCheckLocal: boolean,
  isDesktop: boolean,
  forceCloudCheck: boolean
): Promise<HealthCheckResult> {
  const now = Date.now();

  let localUp = false;
  let localElapsed: number | null = null;
  let localErr: string | null = null;

  // 1. Check Local Python Automation Engine (127.0.0.1:8000)
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

  // 2. Check Central Cloud Control Plane (Render & Supabase)
  const timeSinceCloudCheck = now - lastCloudCheckTime;
  const needCloudCheck =
    forceCloudCheck ||
    !lastGlobalResult ||
    timeSinceCloudCheck >= CLOUD_CHECK_INTERVAL_MS ||
    !lastGlobalResult.cloudUp;

  let cloudUp = lastGlobalResult?.cloudUp ?? false;
  let cloudElapsed = lastGlobalResult?.cloudElapsed ?? null;

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
    lastCloudCheckTime = Date.now();
  }

  const result: HealthCheckResult = {
    localUp,
    cloudUp,
    localElapsed,
    cloudElapsed,
    localErr,
    timestamp: new Date(),
  };

  lastGlobalResult = result;
  return result;
}

export function useConnectionStatus(pollIntervalMs: number = 30000): ConnectionStatus {
  const [backendOnline, setBackendOnline] = useState<boolean>(() => lastGlobalResult?.localUp ?? false);
  const [dbOnline, setDbOnline] = useState<boolean>(() => lastGlobalResult?.cloudUp ?? false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(() => lastGlobalResult?.localElapsed ?? null);
  const [cloudLatencyMs, setCloudLatencyMs] = useState<number | null>(() => lastGlobalResult?.cloudElapsed ?? null);
  const [lastChecked, setLastChecked] = useState<Date | null>(() => lastGlobalResult?.timestamp ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const localEndpoint = getLocalApiBase();
  const cloudEndpoint = getCloudApiBase();
  const isDesktop = isDesktopApp();
  const shouldCheckLocal = isDesktop || isLocalMode();

  const performCheck = useCallback(async (forceCloudCheck = false) => {
    // 1. Skip check if browser tab is in background (saves massive CPU & server bandwidth)
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    if (isMountedRef.current) {
      setIsChecking(true);
    }

    try {
      // Deduplicate: If a check is already in-flight, await it instead of firing a second request
      if (!globalInFlightPromise) {
        globalInFlightPromise = executeHealthCheck(
          localEndpoint,
          cloudEndpoint,
          shouldCheckLocal,
          isDesktop,
          forceCloudCheck
        ).finally(() => {
          globalInFlightPromise = null;
        });
      }

      const res = await globalInFlightPromise;

      if (isMountedRef.current) {
        const effectiveLocalUp = res.localUp || (!isDesktop && res.cloudUp);
        setBackendOnline(effectiveLocalUp);
        setDbOnline(res.cloudUp);
        if (res.localElapsed !== null) setLatencyMs(res.localElapsed);
        if (res.cloudElapsed !== null) setCloudLatencyMs(res.cloudElapsed);
        setLastChecked(res.timestamp);
        setErrorMessage(
          effectiveLocalUp && res.cloudUp
            ? null
            : !effectiveLocalUp
            ? res.localErr || "Local engine offline on port 8000"
            : "Cloud control plane unreachable"
        );
      }
    } catch {
      // Handled inside executeHealthCheck
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  }, [localEndpoint, cloudEndpoint, isDesktop, shouldCheckLocal]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial check on mount
    performCheck(false);

    // Periodic check
    const interval = setInterval(() => {
      performCheck(false);
    }, pollIntervalMs);

    // Resume when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        performCheck(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [performCheck, pollIntervalMs]);

  const checkNow = useCallback(async () => {
    await performCheck(true);
  }, [performCheck]);

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
    checkNow,
  };
}
