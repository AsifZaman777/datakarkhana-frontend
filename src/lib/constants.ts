// ─── App-wide Constants ───

export const APP_NAME = "MARKETING OSTAD";
export const APP_VERSION = "2.0";

export function getApiBase(): string {
  // 1. Direct explicit override if defined
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.replace(/\/$/, "");
  }

  const localUrl = (
    process.env.NEXT_PUBLIC_API_LOCAL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  const renderUrl = (
    process.env.NEXT_PUBLIC_API_RENDER ||
    "https://datakarkhana-backend.onrender.com"
  ).replace(/\/$/, "");

  const mode = (process.env.NEXT_PUBLIC_API_MODE || "").toLowerCase().trim();

  // 2. Explicit mode selection via NEXT_PUBLIC_API_MODE ("local" or "render")
  if (mode === "render" || mode === "production" || mode === "prod") {
    return renderUrl;
  }
  if (mode === "local" || mode === "dev" || mode === "development") {
    return localUrl;
  }

  // 3. Automatic detection when mode is not set
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname || "127.0.0.1";
    if (currentHost === "localhost" || currentHost === "127.0.0.1") {
      return localUrl;
    }
    return renderUrl;
  }

  return localUrl;
}

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "asifdev777@gmail.com";
export const HOTLINE_PHONE =
  process.env.NEXT_PUBLIC_HOTLINE_PHONE || "+880 1863443343";
export const SUPPORT_HOURS =
  process.env.NEXT_PUBLIC_SUPPORT_HOURS ||
  "24/7 Automated System & Live WhatsApp Assistance";

export const TOKEN_KEY = "token";

export function getWsBase(): string {
  const httpBase = getApiBase();
  return httpBase
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");
}

export const TAB_KEY = "currentTab";
export const LANG_KEY = "lang";
export const SCRAPE_RATE_LIMIT_KEY = "scrapeRateLimitUntil";
