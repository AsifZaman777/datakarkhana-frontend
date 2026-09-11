import { useState, useEffect } from "react";

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
