import { useState, useEffect } from "react";
import { APP_VERSION } from "@/lib/constants";

/**
 * Returns true if running inside Electron / Desktop App
 */
export function isDesktopApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).electronAPI?.isElectron ||
    (typeof navigator !== "undefined" && navigator.userAgent.includes("Electron"))
  );
}

/**
 * React hook to reactively check if running inside the desktop app
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(isDesktopApp());
  }, []);

  return isDesktop;
}

/**
 * React hook to dynamically query the live desktop application version from Electron.
 * Defaults to APP_VERSION from constants.ts if running on the web.
 */
export function useDesktopVersion(): string {
  const [version, setVersion] = useState<string>(APP_VERSION);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.getAppVersion) {
      (window as any).electronAPI
        .getAppVersion()
        .then((ver: string) => {
          if (ver && typeof ver === "string") {
            setVersion(ver);
          }
        })
        .catch(() => {});
    }
  }, []);

  return version;
}
