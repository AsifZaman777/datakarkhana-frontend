"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Smartphone,
  ShieldCheck,
  KeyRound,
  Bot,
  MessageSquare,
  Sparkles,
  Lock,
  Clock,
  ShieldAlert,
  Settings,
  Globe,
  ExternalLink,
  Check,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
  Info,
  LogOut,
} from "lucide-react";
import { stocksApi, UserStockAlert, StockTicker } from "@/lib/api/stocks";

interface StockAlertModalProps {
  initialTicker?: string;
  allStocks: StockTicker[];
  onClose: () => void;
}

export function StockAlertModal({ initialTicker, allStocks, onClose }: StockAlertModalProps) {
  // Wizard Step: 1 = Activate Green-API, 2 = Paste Config, 3 = Test & Verify, 4 = Arm Alerts
  const [activeStep, setActiveStep] = useState<number>(() => {
    try {
      if (typeof window !== "undefined") {
        const verifiedUntil = localStorage.getItem("dk_stock_alert_verified_until");
        if (verifiedUntil && parseInt(verifiedUntil, 10) > Date.now()) {
          return 4; // Already verified session, open on alerts
        }
        const hasInstance = localStorage.getItem("dk_green_instance_id");
        if (hasInstance) {
          return 3; // Configured, open on test/OTP
        }
      }
    } catch {}
    return 1;
  });

  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Step 2: Green-API Configuration state
  const [greenInstanceId, setGreenInstanceId] = useState<string>("");
  const [greenApiToken, setGreenApiToken] = useState<string>("");
  const [greenApiUrl, setGreenApiUrl] = useState<string>("");
  const [savingGreenConfig, setSavingGreenConfig] = useState<boolean>(false);
  const [userGreenConfig, setUserGreenConfig] = useState<any>(null);

  // Step 3: OTP Verification & 1-Week Session state
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [checkingVerification, setCheckingVerification] = useState<boolean>(false);
  const [sessionExpiry, setSessionExpiry] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [testSending, setTestSending] = useState<boolean>(false);
  const [disposingSession, setDisposingSession] = useState<boolean>(false);

  // Step 4: Stock Trigger state
  const [ticker, setTicker] = useState<string>(initialTicker || (allStocks[0]?.ticker || "SQURPHARMA"));
  const [alertType, setAlertType] = useState<string>("PRICE_BELOW");
  const [threshold, setThreshold] = useState<string>("");
  const [isOneShot, setIsOneShot] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<UserStockAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);

  // Feedback notifications
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Initialize from localStorage and check user credentials
  useEffect(() => {
    const savedPhone = localStorage.getItem("dk_stock_alert_phone");
    const savedInstance = localStorage.getItem("dk_green_instance_id") || "";
    const savedToken = localStorage.getItem("dk_green_api_token") || "";
    const savedUrl = localStorage.getItem("dk_green_api_url") || "";

    if (savedInstance) setGreenInstanceId(savedInstance);
    if (savedToken) setGreenApiToken(savedToken);
    if (savedUrl) setGreenApiUrl(savedUrl);

    if (savedPhone) {
      setPhoneNumber(savedPhone);
      checkUserStatus(savedPhone);
      loadUserAlerts(savedPhone);
    }
  }, []);

  // Keep allStocks reference current without triggering threshold resets on every price tick
  const allStocksRef = React.useRef(allStocks);
  useEffect(() => {
    allStocksRef.current = allStocks;
  }, [allStocks]);

  // Update threshold suggestion ONLY when ticker or alertType explicitly changes
  useEffect(() => {
    const currentStock = allStocksRef.current.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
    if (currentStock) {
      if (alertType === "PRICE_BELOW") {
        setThreshold((currentStock.ltp * 0.97).toFixed(1)); // 3% below current price
      } else if (alertType === "PRICE_ABOVE") {
        setThreshold((currentStock.ltp * 1.05).toFixed(1)); // 5% above current price
      } else if (alertType === "PERCENT_SPIKE") {
        setThreshold("4.0");
      } else if (alertType === "PERCENT_DROP") {
        setThreshold("-4.0");
      }
    }
  }, [ticker, alertType]);

  const checkUserStatus = async (phone: string) => {
    if (!phone || phone.trim().length < 10) return;
    try {
      setCheckingVerification(true);
      // 1. Check user Green-API config
      const cfgRes = await stocksApi.getUserGreenApiConfig(phone);
      if (cfgRes.data?.has_config) {
        setUserGreenConfig(cfgRes.data);
        if (!greenInstanceId && cfgRes.data.instance_id) {
          setGreenInstanceId(cfgRes.data.instance_id.replace(/\*/g, ""));
        }
        if (!greenApiUrl && cfgRes.data.api_url) {
          setGreenApiUrl(cfgRes.data.api_url);
        }
      }

      // 2. Check 1-Week Phone Verification status
      const verRes = await stocksApi.checkVerification(phone);
      setIsVerified(verRes.data.is_verified);
      setSessionExpiry(verRes.data.expires_at || null);
      setIsRateLimited(Boolean(verRes.data.is_rate_limited));
      setFailedAttempts(verRes.data.failed_attempts || 0);

      if (verRes.data.is_verified && verRes.data.remaining_seconds) {
        localStorage.setItem(
          "dk_stock_alert_verified_until",
          String(Date.now() + verRes.data.remaining_seconds * 1000)
        );
      }
    } catch (e) {
      console.warn("Could not check user status:", e);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handlePhoneBlur = () => {
    if (phoneNumber && phoneNumber.trim().length >= 10) {
      localStorage.setItem("dk_stock_alert_phone", phoneNumber);
      checkUserStatus(phoneNumber);
      loadUserAlerts(phoneNumber);
    }
  };

  const loadUserAlerts = async (phone: string) => {
    if (!phone) return;
    try {
      setLoadingAlerts(true);
      const res = await stocksApi.getAlerts(phone);
      setAlerts(res.data.alerts || []);
    } catch (e) {
      console.error("Error loading alerts:", e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // STEP 2: Save user Green-API config
  const handleSaveGreenConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setStatusMessage({ text: "Please enter your valid WhatsApp phone number first.", type: "error" });
      return;
    }
    if (!greenInstanceId || !greenApiToken) {
      setStatusMessage({ text: "Please provide both Green-API Instance ID and API Token.", type: "error" });
      return;
    }

    try {
      setSavingGreenConfig(true);
      setStatusMessage(null);

      const res = await stocksApi.saveUserGreenApiConfig({
        phone_number: phoneNumber.trim(),
        instance_id: greenInstanceId.trim(),
        api_token: greenApiToken.trim(),
        api_url: greenApiUrl.trim() || undefined,
      });

      setUserGreenConfig(res.data);
      localStorage.setItem("dk_stock_alert_phone", phoneNumber.trim());
      localStorage.setItem("dk_green_instance_id", greenInstanceId.trim());
      localStorage.setItem("dk_green_api_token", greenApiToken.trim());
      if (greenApiUrl.trim()) localStorage.setItem("dk_green_api_url", greenApiUrl.trim());

      setStatusMessage({
        text: `✅ Green-API credentials saved! Instance is ${res.data.state || "connected"}. Proceeding to Step 3 to test message.`,
        type: "success",
      });

      // Automatically advance to Step 3
      setActiveStep(3);
    } catch (e: any) {
      const msg = e.response?.data?.detail || "Failed to validate Green-API credentials. Please verify your Instance ID and Token.";
      setStatusMessage({ text: msg, type: "error" });
    } finally {
      setSavingGreenConfig(false);
    }
  };

  // STEP 3: Send Test WhatsApp Message
  const handleSendTestMessage = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setStatusMessage({ text: "Please enter a valid WhatsApp number.", type: "error" });
      return;
    }
    try {
      setTestSending(true);
      setStatusMessage(null);
      const res = await stocksApi.sendGreenApiTestMessage(phoneNumber.trim());
      setStatusMessage({
        text: res.data.message || "✅ Test message dispatched to your WhatsApp! Check your inbox.",
        type: "success",
      });
    } catch (e: any) {
      setStatusMessage({
        text: e.response?.data?.detail || "Failed to dispatch test message. Please verify your Green-API credentials in Step 2.",
        type: "error",
      });
    } finally {
      setTestSending(false);
    }
  };

  // STEP 3: Send OTP for 1-Week Session
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setStatusMessage({ text: "Please enter a valid WhatsApp number (e.g. 017xxxxxxxx)", type: "error" });
      return;
    }
    if (isRateLimited) {
      setStatusMessage({
        text: "Too many failed attempts. This phone number is rate-limited for 24 hours to prevent spam.",
        type: "error",
      });
      return;
    }
    try {
      setSendingOtp(true);
      setStatusMessage(null);
      const res = await stocksApi.sendOtp(phoneNumber.trim());
      setOtpSent(true);
      setOtpCode(""); // User must enter OTP manually from WhatsApp
      setFailedAttempts(res.data?.failed_attempts || 0);
      setStatusMessage({
        text: `Security OTP sent to ${phoneNumber} via WhatsApp. Please check your WhatsApp chat and enter the 6-digit code below.`,
        type: "success",
      });
    } catch (e: any) {
      const errDetail = e.response?.data?.detail || "Failed to send OTP code. Please ensure phone number is valid.";
      if (e.response?.status === 429 || errDetail.toLowerCase().includes("rate-limited") || errDetail.includes("24 hours")) {
        setIsRateLimited(true);
        setStatusMessage({
          text: `🛑 Spam Protection: ${errDetail}`,
          type: "error",
        });
      } else {
        setStatusMessage({
          text: errDetail,
          type: "error",
        });
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // STEP 3: Verify OTP code
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setStatusMessage({ text: "Please enter the 6-digit code received on WhatsApp.", type: "error" });
      return;
    }
    try {
      setVerifyingOtp(true);
      setStatusMessage(null);
      const res = await stocksApi.verifyOtp(phoneNumber.trim(), otpCode.trim());
      setIsVerified(true);
      setOtpSent(false);
      setOtpCode("");
      setIsRateLimited(false);
      setFailedAttempts(0);
      const expiry = res.data?.session_valid_until || "1 week";
      setSessionExpiry(expiry);
      localStorage.setItem("dk_stock_alert_phone", phoneNumber.trim());
      localStorage.setItem("dk_stock_alert_verified_until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setStatusMessage({
        text: `✅ Verified successfully! WhatsApp session is active for 1 week (until ${expiry}). All alerts will arrive in your inbox.`,
        type: "success",
      });
      loadUserAlerts(phoneNumber.trim());
      setActiveStep(4);
    } catch (e: any) {
      const errDetail = e.response?.data?.detail || "Invalid or expired OTP code. Please try again.";
      if (e.response?.status === 429 || errDetail.toLowerCase().includes("rate-limited") || errDetail.includes("24 hours")) {
        setIsRateLimited(true);
        setOtpSent(false);
        setStatusMessage({
          text: `🛑 Spam Protection: ${errDetail}`,
          type: "error",
        });
      } else {
        setStatusMessage({
          text: errDetail,
          type: "error",
        });
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Dispose active WhatsApp session & disconnect
  const handleDisposeSession = async () => {
    const targetPhone = phoneNumber.trim() || userGreenConfig?.phone_number || "";
    if (!targetPhone) {
      // Clear local state if no phone number
      setIsVerified(false);
      setSessionExpiry(null);
      setOtpSent(false);
      setOtpCode("");
      setUserGreenConfig(null);
      localStorage.removeItem("dk_stock_alert_verified_until");
      localStorage.removeItem("dk_stock_alert_phone");
      localStorage.removeItem("dk_green_instance_id");
      localStorage.removeItem("dk_green_api_token");
      localStorage.removeItem("dk_green_api_url");
      setActiveStep(1);
      setStatusMessage({ text: "Session disposed successfully.", type: "success" });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to dispose the WhatsApp session for ${targetPhone}? This will clear your 1-week verification and disconnect the active session.`
    );
    if (!confirmed) return;

    try {
      setDisposingSession(true);
      setStatusMessage(null);
      await stocksApi.disposeSession(targetPhone, false);

      // Reset local verification & session state
      setIsVerified(false);
      setSessionExpiry(null);
      setOtpSent(false);
      setOtpCode("");
      setUserGreenConfig(null);
      setPhoneNumber("");

      // Clear all stored keys
      localStorage.removeItem("dk_stock_alert_verified_until");
      localStorage.removeItem("dk_stock_alert_phone");
      localStorage.removeItem("dk_green_instance_id");
      localStorage.removeItem("dk_green_api_token");
      localStorage.removeItem("dk_green_api_url");

      // Switch to Step 1
      setActiveStep(1);

      setStatusMessage({
        text: "✅ WhatsApp session disposed successfully. You can now connect a fresh number or instance.",
        type: "success",
      });
    } catch (e: any) {
      setStatusMessage({
        text: e.response?.data?.detail || "Failed to dispose session. Please try again.",
        type: "error",
      });
    } finally {
      setDisposingSession(false);
    }
  };

  // STEP 4: Arm Stock Alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setStatusMessage({ text: "Please verify your WhatsApp inbox in Step 3 first.", type: "error" });
      setActiveStep(3);
      return;
    }

    try {
      setSubmitting(true);
      const val = alertType === "NEWS_DISCLOSURE" || alertType === "CIRCUIT_LIMIT" ? 0 : parseFloat(threshold) || 0;

      await stocksApi.createAlert({
        whatsapp_number: phoneNumber.trim(),
        ticker,
        alert_type: alertType,
        threshold_value: val,
        is_one_shot: isOneShot,
      });

      setStatusMessage({ text: `🚀 Alert armed for ${ticker}! Messages will arrive directly in your WhatsApp inbox.`, type: "success" });
      loadUserAlerts(phoneNumber.trim());
    } catch (e: any) {
      setStatusMessage({ text: e.response?.data?.detail || "Error creating alert.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await stocksApi.deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Error deleting alert:", e);
    }
  };

  const handleRearmAlert = async (id: string) => {
    try {
      await stocksApi.rearmAlert(id);
      loadUserAlerts(phoneNumber.trim());
      setStatusMessage({ text: "Alert re-armed to ACTIVE!", type: "success" });
    } catch (e) {
      console.error("Error re-arming alert:", e);
    }
  };

  const selectedStock = allStocks.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#181a20] border border-[#2b313a] rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar text-xs text-[#848e9c]">
        {/* Top Right Header Actions */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          {(isVerified || userGreenConfig?.has_config || phoneNumber) && (
            <button
              type="button"
              onClick={handleDisposeSession}
              disabled={disposingSession}
              title="Dispose active WhatsApp session and disconnect"
              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <LogOut className="w-3 h-3" />
              <span>{disposingSession ? "Disposing..." : "Dispose Session"}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#eaecef]">WhatsApp Stock Bot & Alerts</h2>
              {isVerified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>1-Week Active Session</span>
                </span>
              ) : userGreenConfig?.has_config ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30">
                  Green-API Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0b90b]/15 text-[#f0b90b] border border-[#f0b90b]/30">
                  Per-User Setup
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#848e9c] mt-0.5">
              Connect your Green-API instance to receive real-time price alerts & corporate disclosures on WhatsApp.
            </p>
          </div>
        </div>

        {/* 3-Step Wizard Navigation Stepper */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[#12161c] border border-[#2b313a]">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 1
                ? "bg-[#f0b90b] text-black shadow"
                : "text-[#848e9c] hover:text-[#eaecef] hover:bg-[#181a20]"
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] shrink-0">1</span>
            <span className="truncate">Activate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 2
                ? "bg-[#f0b90b] text-black shadow"
                : userGreenConfig?.has_config
                ? "text-[#0ecb81] hover:bg-[#181a20]"
                : "text-[#848e9c] hover:text-[#eaecef] hover:bg-[#181a20]"
            }`}
          >
            {userGreenConfig?.has_config ? (
              <Check className="w-3.5 h-3.5 text-[#0ecb81] shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] shrink-0">2</span>
            )}
            <span className="truncate">Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 3
                ? "bg-[#f0b90b] text-black shadow"
                : isVerified
                ? "text-[#0ecb81] hover:bg-[#181a20]"
                : "text-[#848e9c] hover:text-[#eaecef] hover:bg-[#181a20]"
            }`}
          >
            {isVerified ? (
              <Check className="w-3.5 h-3.5 text-[#0ecb81] shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] shrink-0">3</span>
            )}
            <span className="truncate">Test & OTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(4)}
            className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeStep === 4
                ? "bg-[#f0b90b] text-black shadow"
                : "text-[#848e9c] hover:text-[#eaecef] hover:bg-[#181a20]"
            }`}
          >
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Alerts</span>
          </button>
        </div>

        {/* Global Feedback Message Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.type === "success"
                ? "bg-[#0ecb81]/15 text-[#0ecb81] border-[#0ecb81]/30"
                : statusMessage.type === "error"
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                : "bg-[#f0b90b]/15 text-[#f0b90b] border-[#f0b90b]/30"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span className="leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* ── STEP 1: ACTIVATE GREEN-API ACCOUNT ── */}
        {activeStep === 1 && (
          <div className="p-5 rounded-2xl border border-[#2b313a] bg-[#12161c] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#f0b90b]" />
                <h3 className="text-sm font-bold text-[#eaecef]">Step 1: Activate Free Green-API Account</h3>
              </div>
              <span className="text-[10px] font-bold text-[#0ecb81] bg-[#0ecb81]/15 px-2 py-0.5 rounded-full border border-[#0ecb81]/30">
                100% Free Developer Tier
              </span>
            </div>

            <p className="text-xs text-[#848e9c] leading-relaxed">
              To send alerts to your personal WhatsApp without fixed server costs or IP bans, each user connects their own free Green-API developer instance (100 free messages/day).
            </p>

            {/* Step-by-step checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#181a20] border border-[#2b313a] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#f0b90b]/20 text-[#f0b90b] font-bold flex items-center justify-center text-[10px]">1</span>
                  <span className="font-bold text-[#eaecef]">Sign Up at Green-API</span>
                </div>
                <p className="text-[11px] text-[#848e9c]">
                  Open Green-API and create a free account with your email. No credit card required.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#181a20] border border-[#2b313a] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#f0b90b]/20 text-[#f0b90b] font-bold flex items-center justify-center text-[10px]">2</span>
                  <span className="font-bold text-[#eaecef]">Create Free Instance</span>
                </div>
                <p className="text-[11px] text-[#848e9c]">
                  In the console, click <b>"Create Instance"</b> and choose the free Developer plan.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#181a20] border border-[#2b313a] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#f0b90b]/20 text-[#f0b90b] font-bold flex items-center justify-center text-[10px]">3</span>
                  <span className="font-bold text-[#eaecef]">Scan QR with WhatsApp</span>
                </div>
                <p className="text-[11px] text-[#848e9c]">
                  On your phone: WhatsApp &gt; <b>Linked Devices</b> &gt; Link a Device, and scan the QR code in Green-API console.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#181a20] border border-[#2b313a] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#f0b90b]/20 text-[#f0b90b] font-bold flex items-center justify-center text-[10px]">4</span>
                  <span className="font-bold text-[#eaecef]">Copy Credentials</span>
                </div>
                <p className="text-[11px] text-[#848e9c]">
                  Once status is <b>Authorized</b>, copy your <b>idInstance</b>, <b>apiTokenInstance</b>, and <b>apiUrl</b>.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <a
                href="https://green-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2b313a] hover:bg-[#363d47] text-[#eaecef] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Open Green-API Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#f0b90b] hover:bg-[#f0b90b]/90 text-black font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <span>I Have My Account → Proceed to Step 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PASTE CONFIG DETAILS ── */}
        {activeStep === 2 && (
          <form onSubmit={handleSaveGreenConfig} className="p-5 rounded-2xl border border-[#2b313a] bg-[#12161c] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#f0b90b]" />
                <h3 className="text-sm font-bold text-[#eaecef]">Step 2: Paste Your Green-API Credentials</h3>
              </div>
              {userGreenConfig?.has_config && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/30">
                  Config Saved
                </span>
              )}
            </div>

            <p className="text-xs text-[#848e9c]">
              These credentials belong to your private WhatsApp instance. They are stored securely for your user session and never hardcoded in server env.
            </p>

            <div className="space-y-3">
              {/* WhatsApp Phone Number */}
              <div>
                <label className="text-xs font-bold text-[#eaecef] block mb-1">
                  Your WhatsApp Phone Number:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 01863443343 or 8801863443343"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onBlur={handlePhoneBlur}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs font-mono font-bold text-[#eaecef] focus:outline-none focus:border-[#f0b90b]"
                  />
                  <Smartphone className="w-4 h-4 text-[#848e9c] absolute right-3.5 top-3" />
                </div>
                <span className="text-[10px] text-[#848e9c] mt-0.5 block">
                  Alerts and OTP will be delivered directly to this WhatsApp number.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Instance ID */}
                <div>
                  <label className="text-xs font-bold text-[#eaecef] block mb-1">
                    Instance ID (<span className="text-[#f0b90b] font-mono">idInstance</span>):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 710722757194"
                    value={greenInstanceId}
                    onChange={(e) => setGreenInstanceId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs font-mono font-bold text-[#eaecef] focus:outline-none focus:border-[#f0b90b]"
                  />
                </div>

                {/* API Token */}
                <div>
                  <label className="text-xs font-bold text-[#eaecef] block mb-1">
                    API Token (<span className="text-[#f0b90b] font-mono">apiTokenInstance</span>):
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. be39a12dda204532..."
                    value={greenApiToken}
                    onChange={(e) => setGreenApiToken(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs font-mono text-[#eaecef] focus:outline-none focus:border-[#f0b90b]"
                  />
                </div>
              </div>

              {/* API URL (Host) */}
              <div>
                <label className="text-xs font-bold text-[#eaecef] block mb-1">
                  API URL / Host (<span className="text-[#848e9c] font-normal">optional, auto-detected from Instance ID</span>):
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://7107.api.greenapi.com"
                  value={greenApiUrl}
                  onChange={(e) => setGreenApiUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs font-mono text-[#eaecef] focus:outline-none focus:border-[#f0b90b]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#181a20] transition-colors"
              >
                ← Back to Instructions
              </button>

              <button
                type="submit"
                disabled={savingGreenConfig || !greenInstanceId || !greenApiToken || !phoneNumber}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#f0b90b] hover:bg-[#f0b90b]/90 text-black font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-40"
              >
                {savingGreenConfig ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Green-API...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Proceed to Step 3</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: SEND TEST MESSAGE & VERIFY OTP ── */}
        {activeStep === 3 && (
          <div className="p-5 rounded-2xl border border-[#2b313a] bg-[#12161c] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#0ecb81]" />
                <h3 className="text-sm font-bold text-[#eaecef]">Step 3: Send Test Message & Verify Inbox</h3>
              </div>
              {isVerified ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Session Active (1-Week)</span>
                </span>
              ) : isRateLimited ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>24h Rate Limited</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  <span>OTP Required</span>
                </span>
              )}
            </div>

            <p className="text-xs text-[#848e9c]">
              We will dispatch messages directly to <b className="text-[#eaecef]">{phoneNumber || "your phone"}</b> using your Green-API instance.
            </p>

            {/* Quick Test Message Dispatch */}
            <div className="p-4 rounded-xl bg-[#181a20] border border-[#2b313a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-[#eaecef] block text-xs">Direct Test WhatsApp Alert</span>
                <span className="text-[11px] text-[#848e9c]">
                  Sends an immediate test ping to confirm your Green-API instance is delivering to your phone.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendTestMessage}
                disabled={testSending || !phoneNumber}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2b313a] hover:bg-[#363d47] text-[#eaecef] border border-[#2b313a] flex items-center justify-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#0ecb81]" />
                <span>{testSending ? "Sending to WhatsApp..." : "Send Test Message"}</span>
              </button>
            </div>

            {/* 1-Week Active Session Box */}
            {isVerified && sessionExpiry && (
              <div className="p-3.5 rounded-xl bg-[#0ecb81]/10 border border-[#0ecb81]/30 text-[#0ecb81] space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-xs">WhatsApp Inbox Verified & Active for 1 Week!</span>
                </div>
                <p className="text-[11px] text-[#0ecb81]/90">
                  Your session is active until <b>{sessionExpiry}</b>. Stock price triggers, circuit breakers, and corporate news will arrive right in your inbox!
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="px-4 py-2 rounded-xl bg-[#0ecb81] text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-[#0ecb81]/90 transition-all shadow-sm"
                  >
                    <span>Configure Stock Alerts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDisposeSession}
                    disabled={disposingSession}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Dispose Session</span>
                  </button>
                </div>
              </div>
            )}

            {/* OTP Dispatch & Verification Flow */}
            {!isVerified && (
              <div className="p-4 rounded-xl bg-[#181a20] border border-[#2b313a] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#eaecef] block text-xs">Verify WhatsApp Session (7 Days)</span>
                    <span className="text-[11px] text-[#848e9c]">
                      Dispatches a 6-digit security code via Green-API to activate your 1-week alert session.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || isRateLimited || !phoneNumber}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f0b90b] hover:bg-[#f0b90b]/90 text-black flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{sendingOtp ? "Sending..." : "Send OTP Code"}</span>
                  </button>
                </div>

                {/* Rate limit warning box */}
                {isRateLimited && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <b className="text-rose-200">Rate Limit Activated (24h Block)</b>
                      <p className="mt-0.5 text-[10px] text-rose-300/90">
                        This number reached 7 failed attempts. To protect against spam, OTP sending is paused for 24 hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* OTP Input and Verify Button */}
                {otpSent && !isRateLimited && (
                  <div className="pt-2 border-t border-[#2b313a] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#eaecef]">
                        Enter 6-Digit OTP received on WhatsApp:
                      </span>
                      {failedAttempts > 0 && (
                        <span className="text-[10px] text-amber-400">
                          Failed attempts: {failedAttempts}/7
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 582910"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-36 px-3 py-2 rounded-xl border border-[#2b313a] bg-[#12161c] text-xs font-mono font-bold text-center tracking-widest text-[#f0b90b] focus:outline-none focus:border-[#f0b90b]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpCode.length < 4}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-black transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{verifyingOtp ? "Verifying..." : "Verify & Activate Session"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="px-3 py-2 rounded-xl text-xs text-[#848e9c] hover:text-[#eaecef] transition-colors"
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-3 py-2 rounded-xl text-xs text-[#848e9c] hover:text-[#eaecef] transition-colors"
              >
                ← Back to Config
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2b313a] hover:bg-[#363d47] text-[#eaecef] flex items-center gap-1 transition-all"
              >
                <span>Go to Stock Alerts</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: CONFIGURE STOCK ALERT RULES ── */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <form onSubmit={handleCreateAlert} className="p-5 rounded-2xl border border-[#2b313a] bg-[#12161c] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#f0b90b]" />
                  <h3 className="text-sm font-bold text-[#eaecef]">Configure Stock Trigger Rule</h3>
                </div>
                {!isVerified && (
                  <span className="text-[10px] text-[#f0b90b] flex items-center gap-1 bg-[#f0b90b]/10 px-2 py-0.5 rounded-full border border-[#f0b90b]/30">
                    <Lock className="w-3 h-3" />
                    <span>Verify in Step 3 to Activate</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stock Selector */}
                <div>
                  <label className="text-[11px] text-[#848e9c] font-medium mb-1 block">
                    Select Stock Ticker
                  </label>
                  <select
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs font-bold text-[#eaecef] focus:outline-none focus:border-[#f0b90b]"
                  >
                    {allStocks.map((s) => (
                      <option key={s.ticker} value={s.ticker}>
                        {s.ticker} (LTP: {s.ltp.toFixed(2)} BDT)
                      </option>
                    ))}
                  </select>
                  {selectedStock && (
                    <p className="text-[10px] text-[#848e9c] mt-1">
                      Current LTP: <span className="font-bold text-[#eaecef]">{selectedStock.ltp.toFixed(2)} BDT</span> ({selectedStock.percent >= 0 ? "+" : ""}{selectedStock.percent.toFixed(2)}%)
                    </p>
                  )}
                </div>

                {/* Alert Condition Type */}
                <div>
                  <label className="text-[11px] text-[#848e9c] font-medium mb-1 block">
                    Alert Condition Type
                  </label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs font-bold text-[#eaecef] focus:outline-none focus:border-[#f0b90b]"
                  >
                    <option value="PRICE_BELOW">🎯 Buy Target (Price Drops Below)</option>
                    <option value="PRICE_ABOVE">💰 Take-Profit (Price Rises Above)</option>
                    <option value="PERCENT_SPIKE">🚀 Intraday Momentum (+% Spike)</option>
                    <option value="PERCENT_DROP">⚠️ Sharp Crash (-% Drop)</option>
                    <option value="CIRCUIT_LIMIT">🔥 Circuit Breaker (Ceiling/Floor)</option>
                    <option value="NEWS_DISCLOSURE">📢 Corporate Announcements (PSI & News)</option>
                  </select>
                </div>
              </div>

              {/* Threshold Input */}
              {alertType !== "NEWS_DISCLOSURE" && alertType !== "CIRCUIT_LIMIT" && (
                <div>
                  <label className="text-[11px] text-[#848e9c] font-medium mb-1 block">
                    {alertType.includes("PERCENT") ? "Target % Change" : "Target Price (BDT)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="e.g. 42.50"
                    className="w-full px-3 py-2 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs font-mono font-bold text-[#eaecef] focus:outline-none focus:border-[#f0b90b]"
                  />
                </div>
              )}

              {/* Anti-spam options */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="oneShotToggle"
                  checked={isOneShot}
                  onChange={(e) => setIsOneShot(e.target.checked)}
                  className="rounded border-[#2b313a] text-[#f0b90b] focus:ring-[#f0b90b] h-4 w-4 bg-[#181a20]"
                />
                <label htmlFor="oneShotToggle" className="text-xs text-[#848e9c] cursor-pointer">
                  <span className="font-semibold text-[#eaecef]">Auto-Pause after firing (Recommended)</span> — avoids spamming your WhatsApp if price fluctuates around threshold.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !isVerified}
                className="w-full py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-[#f0b90b] text-black hover:bg-[#f0b90b]/90 transition-all shadow-md disabled:opacity-40"
              >
                {submitting ? "Arming Alert..." : isVerified ? "Arm Stock Alert in WhatsApp" : "Verify WhatsApp in Step 3 to Arm Alert"}
              </button>
            </form>

            {/* Active User Alerts List */}
            <div className="p-5 rounded-2xl border border-[#2b313a] bg-[#12161c] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#eaecef]">
                  Your Active WhatsApp Alerts ({alerts.length})
                </h3>
                {loadingAlerts && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#848e9c]" />}
              </div>

              {alerts.length === 0 ? (
                <p className="text-xs text-[#848e9c]/60 text-center py-4">
                  No active alerts yet. Set your target price above to arm your first alert!
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                  {alerts.map((a) => {
                    const isTriggered = a.status === "TRIGGERED";
                    return (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                          isTriggered
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-[#181a20] border-[#2b313a]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#eaecef]">{a.ticker}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                isTriggered
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-[#0ecb81]/20 text-[#0ecb81]"
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#848e9c] mt-0.5">
                            {a.alert_type} {a.threshold_value > 0 ? `@ ${a.threshold_value} BDT` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isTriggered && (
                            <button
                              type="button"
                              onClick={() => handleRearmAlert(a.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#f0b90b]/15 text-[#f0b90b] hover:bg-[#f0b90b]/25 text-[11px] font-bold"
                            >
                              Re-Arm
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAlert(a.id)}
                            className="p-1.5 rounded-lg text-[#848e9c] hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
