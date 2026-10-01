"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Send, CheckCircle2, AlertTriangle, RefreshCw, Trash2, Smartphone } from "lucide-react";
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

  // Load saved phone from localStorage on open
  useEffect(() => {
    const savedPhone = localStorage.getItem("dk_stock_alert_phone");
    if (savedPhone) {
      setPhoneNumber(savedPhone);
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
    if (!phoneNumber || phoneNumber.length < 10) {
      setStatusMessage({ text: "Please enter a valid WhatsApp phone number.", type: "error" });
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

      setStatusMessage({ text: `Alert armed for ${ticker}!`, type: "success" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/60 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">WhatsApp Stock Alerts</h2>
            <p className="text-xs text-muted-foreground">
              Instant alerts sent directly to your phone via local WhatsApp automation.
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : statusMessage.type === "error"
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                : "bg-primary/10 text-primary border-primary/20"
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

        {/* Step 1: WhatsApp Number */}
        <div className="p-4 rounded-2xl border border-border/40 bg-background/50 space-y-3">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-primary" />
            <span>Step 1: Your WhatsApp Number</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 01712345678 or 8801712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />
            <button
              type="button"
              onClick={handleSendTestPing}
              disabled={testSending}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testSending ? "Sending Ping..." : "Send Test Alert"}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Trigger Rules */}
        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div className="p-4 rounded-2xl border border-border/40 bg-background/50 space-y-4">
            <label className="text-xs font-bold text-foreground">
              Step 2: Configure Stock Trigger
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground font-medium mb-1 block">
                  Select Stock Ticker
                </label>
                <select
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/60 bg-card text-xs font-bold text-foreground focus:outline-none"
                >
                  {allStocks.map((s) => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} (LTP: {s.ltp.toFixed(2)} BDT)
                    </option>
                  ))}
                </select>
                {selectedStock && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Current LTP: <span className="font-bold text-foreground">{selectedStock.ltp.toFixed(2)} BDT</span> ({selectedStock.percent >= 0 ? "+" : ""}{selectedStock.percent.toFixed(2)}%)
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-medium mb-1 block">
                  Alert Condition Type
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/60 bg-card text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="PRICE_BELOW">🎯 Buy Target (Price Drops Below)</option>
                  <option value="PRICE_ABOVE">💰 Take-Profit (Price Rises Above)</option>
                  <option value="PERCENT_SPIKE">🚀 Intraday Momentum (+% Spike)</option>
                  <option value="PERCENT_DROP">⚠️ Sharp Crash (-% Drop)</option>
                  <option value="CIRCUIT_LIMIT">🔥 Circuit Breaker (Ceiling/Floor)</option>
                  <option value="NEWS_DISCLOSURE">📢 Corporate Announcements (DSE News)</option>
                </select>
              </div>
            </div>

            {/* Threshold Input */}
            {alertType !== "NEWS_DISCLOSURE" && alertType !== "CIRCUIT_LIMIT" && (
              <div>
                <label className="text-[11px] text-muted-foreground font-medium mb-1 block">
                  {alertType.includes("PERCENT") ? "Target % Change" : "Target Price (BDT)"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="e.g. 210.0"
                  className="w-full px-3 py-2 rounded-xl border border-border/60 bg-card text-xs font-mono font-bold text-foreground focus:outline-none"
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
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="oneShotToggle" className="text-xs text-muted-foreground cursor-pointer">
                <span className="font-semibold text-foreground">Auto-Pause after firing (Recommended)</span> — avoids spamming your WhatsApp if price fluctuates around threshold.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
          >
            {submitting ? "Saving Alert..." : "Arm Stock Alert"}
          </button>
        </form>

        {/* Step 3: Active User Alerts List */}
        <div className="space-y-3 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Configured Alerts ({alerts.length})
            </h3>
            {loadingAlerts && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-4">
              No active alerts yet. Add your first stock above!
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {alerts.map((a) => {
                const isTriggered = a.status === "TRIGGERED";
                return (
                  <div
                    key={a.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isTriggered
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-background/40 border-border/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{a.ticker}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isTriggered
                              ? "bg-amber-500/20 text-amber-500"
                              : "bg-emerald-500/20 text-emerald-500"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {a.alert_type} {a.threshold_value > 0 ? `@ ${a.threshold_value} BDT` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isTriggered && (
                        <button
                          type="button"
                          onClick={() => handleRearmAlert(a.id)}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold"
                        >
                          Re-Arm
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(a.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
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
