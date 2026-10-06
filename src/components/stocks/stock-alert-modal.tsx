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
} from "lucide-react";
import { stocksApi, UserStockAlert, StockTicker } from "@/lib/api/stocks";

interface StockAlertModalProps {
  initialTicker?: string;
  allStocks: StockTicker[];
  onClose: () => void;
}

export function StockAlertModal({ initialTicker, allStocks, onClose }: StockAlertModalProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [ticker, setTicker] = useState<string>(initialTicker || (allStocks[0]?.ticker || "SQURPHARMA"));
  const [alertType, setAlertType] = useState<string>("PRICE_BELOW");
  const [threshold, setThreshold] = useState<string>("");
  const [isOneShot, setIsOneShot] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [testSending, setTestSending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [alerts, setAlerts] = useState<UserStockAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);

  // OTP Verification state
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [checkingVerification, setCheckingVerification] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);

  // Load saved phone from localStorage on open
  useEffect(() => {
    const savedPhone = localStorage.getItem("dk_stock_alert_phone");
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      checkPhoneVerification(savedPhone);
      loadUserAlerts(savedPhone);
    }
  }, []);

  // Update threshold suggestion when ticker or alertType changes
  useEffect(() => {
    const currentStock = allStocks.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
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
  }, [ticker, alertType, allStocks]);

  const checkPhoneVerification = async (phone: string) => {
    if (!phone || phone.trim().length < 10) {
      setIsVerified(false);
      return;
    }
    try {
      setCheckingVerification(true);
      const res = await stocksApi.checkVerification(phone);
      setIsVerified(res.data.is_verified);
    } catch (e) {
      setIsVerified(false);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handlePhoneBlur = () => {
    if (phoneNumber && phoneNumber.trim().length >= 10) {
      checkPhoneVerification(phoneNumber);
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

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setStatusMessage({ text: "Please enter a valid WhatsApp number (e.g. 017xxxxxxxx)", type: "error" });
      return;
    }
    try {
      setSendingOtp(true);
      setStatusMessage(null);
      const res = await stocksApi.sendOtp(phoneNumber);
      setOtpSent(true);
      setStatusMessage({
        text: `Security OTP sent to ${phoneNumber} via WhatsApp. Please check your self-chat.`,
        type: "success",
      });
    } catch (e: any) {
      setStatusMessage({
        text: e.response?.data?.detail || "Failed to send OTP code. Please ensure WhatsApp is active.",
        type: "error",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setStatusMessage({ text: "Please enter the 6-digit code received on WhatsApp.", type: "error" });
      return;
    }
    try {
      setVerifyingOtp(true);
      setStatusMessage(null);
      const res = await stocksApi.verifyOtp(phoneNumber, otpCode.trim());
      setIsVerified(true);
      setOtpSent(false);
      setOtpCode("");
      localStorage.setItem("dk_stock_alert_phone", phoneNumber);
      setStatusMessage({
        text: "WhatsApp Self-Chat verified successfully! You can now arm alerts.",
        type: "success",
      });
      loadUserAlerts(phoneNumber);
    } catch (e: any) {
      setStatusMessage({
        text: e.response?.data?.detail || "Invalid or expired OTP code. Please try again.",
        type: "error",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSendTestPing = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setStatusMessage({ text: "Please enter a valid WhatsApp number (e.g. 017xxxxxxxx)", type: "error" });
      return;
    }
    try {
      setTestSending(true);
      localStorage.setItem("dk_stock_alert_phone", phoneNumber);
      const res = await stocksApi.sendTestPing(phoneNumber);
      setStatusMessage({ text: res.data.message, type: "success" });
    } catch (e: any) {
      setStatusMessage({ text: e.response?.data?.detail || "Failed to dispatch test message.", type: "error" });
    } finally {
      setTestSending(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setStatusMessage({ text: "Please verify your WhatsApp number with OTP first.", type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      localStorage.setItem("dk_stock_alert_phone", phoneNumber);

      const val = alertType === "NEWS_DISCLOSURE" || alertType === "CIRCUIT_LIMIT" ? 0 : parseFloat(threshold) || 0;

      await stocksApi.createAlert({
        whatsapp_number: phoneNumber,
        ticker,
        alert_type: alertType,
        threshold_value: val,
        is_one_shot: isOneShot,
      });

      setStatusMessage({ text: `Alert armed for ${ticker}! Messages will arrive in your WhatsApp self-chat.`, type: "success" });
      loadUserAlerts(phoneNumber);
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
      loadUserAlerts(phoneNumber);
      setStatusMessage({ text: "Alert re-armed to ACTIVE!", type: "success" });
    } catch (e) {
      console.error("Error re-arming alert:", e);
    }
  };

  const selectedStock = allStocks.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#181a20] border border-[#2b313a] rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar text-xs text-[#848e9c]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#f0b90b]/15 text-[#f0b90b] border border-[#f0b90b]/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#eaecef]">WhatsApp Stock Bot & Alerts</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30">
                Headless Mode
              </span>
            </div>
            <p className="text-[11px] text-[#848e9c] mt-0.5">
              Personal AI Stock Assistant delivering real-time target price alerts to your WhatsApp Self-Chat.
            </p>
          </div>
        </div>

        {/* Self-Chat Bot Guide Callout */}
        <div className="p-3 rounded-2xl bg-[#12161c] border border-[#2b313a]/70 flex items-start gap-2.5">
          <MessageSquare className="w-4 h-4 text-[#f0b90b] mt-0.5 shrink-0" />
          <div className="space-y-0.5 text-[11px]">
            <span className="font-bold text-[#eaecef] block">Self-Chat Bot Architecture (Message Yourself)</span>
            <p className="text-[#848e9c] leading-relaxed">
              All notifications are delivered directly into your WhatsApp <b>&quot;Message yourself&quot;</b> chat.
              You can also reply to the bot in self-chat (e.g. send <code className="text-[#f0b90b]">GP</code> or <code className="text-[#f0b90b]">TOP</code>) for instant quotes!
            </p>
          </div>
        </div>

        {/* Feedback Message */}
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
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* STEP 1: WhatsApp Number & OTP Verification */}
        <div className="p-4 rounded-2xl border border-[#2b313a] bg-[#12161c] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#eaecef] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#f0b90b]" />
              <span>Step 1: Your WhatsApp Number & Verification</span>
            </label>
            {checkingVerification ? (
              <span className="text-[10px] text-[#848e9c] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Checking...</span>
              </span>
            ) : isVerified ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Self-Chat</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>OTP Required</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. 01712345678 or +88017xxxxxxxx"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setIsVerified(false);
              }}
              onBlur={handlePhoneBlur}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#2b313a] bg-[#181a20] text-xs text-[#eaecef] focus:outline-none focus:border-[#f0b90b] font-mono placeholder-[#5e6673]"
            />

            {isVerified ? (
              <button
                type="button"
                onClick={handleSendTestPing}
                disabled={testSending}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2b313a] hover:bg-[#363d47] text-[#eaecef] transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#0ecb81]" />
                <span>{testSending ? "Sending..." : "Test Self-Chat Alert"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || !phoneNumber || phoneNumber.length < 10}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#f0b90b] hover:bg-[#f0b90b]/90 text-black transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{sendingOtp ? "Dispatching..." : "Send Verification OTP"}</span>
              </button>
            )}
          </div>

          {/* OTP Input Form (only visible if OTP was sent and not yet verified) */}
          {!isVerified && otpSent && (
            <div className="p-3 rounded-xl bg-[#181a20] border border-[#f0b90b]/40 space-y-2 mt-2">
              <span className="text-[11px] font-bold text-[#eaecef] block">
                Enter 6-Digit OTP sent to your WhatsApp Self-Chat:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 582910"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-36 px-3 py-2 rounded-lg border border-[#2b313a] bg-[#12161c] text-xs font-mono font-bold text-center tracking-widest text-[#f0b90b] focus:outline-none focus:border-[#f0b90b]"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length < 4}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-black transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{verifyingOtp ? "Verifying..." : "Confirm & Link Number"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="px-2.5 py-2 rounded-lg text-xs text-[#848e9c] hover:text-[#eaecef] transition-colors"
                >
                  Resend OTP
                </button>
              </div>
              <p className="text-[10px] text-[#848e9c]">
                🔐 This verification prevents spam and ensures alerts only route to your authorized WhatsApp.
              </p>
            </div>
          )}
        </div>

        {/* STEP 2: Configure Stock Trigger */}
        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div className={`p-4 rounded-2xl border border-[#2b313a] bg-[#12161c] space-y-3 transition-opacity ${
            !isVerified ? "opacity-60 pointer-events-none" : "opacity-100"
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#eaecef]">
                Step 2: Configure Stock Trigger Rule
              </label>
              {!isVerified && (
                <span className="text-[10px] text-[#f0b90b] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Locked until Step 1 verification</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <span className="font-semibold text-[#eaecef]">Auto-Pause after firing (Recommended)</span> — avoids spamming your self-chat if price fluctuates around threshold.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isVerified}
            className="w-full py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-[#f0b90b] text-black hover:bg-[#f0b90b]/90 transition-all shadow-md disabled:opacity-40"
          >
            {submitting ? "Arming Alert..." : isVerified ? "Arm Stock Alert in Self-Chat" : "Verify Phone Number to Arm Alert"}
          </button>
        </form>

        {/* STEP 3: Active User Alerts List */}
        <div className="space-y-3 pt-3 border-t border-[#2b313a]/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#848e9c]">
              Your Active Alert Rules ({alerts.length})
            </h3>
            {loadingAlerts && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#848e9c]" />}
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-[#848e9c]/60 text-center py-4">
              No active alerts yet. Verify your self-chat and arm your first stock above!
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
                        : "bg-[#12161c] border-[#2b313a]/70"
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
    </div>
  );
}
