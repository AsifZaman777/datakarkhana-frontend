"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Activity,
  Globe,
  Radio,
  Layers,
  ChevronDown,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from "lucide-react";
import { StockTicker, MarketSummary } from "@/lib/api/stocks";

interface BinanceTradingHeaderProps {
  selectedStock: StockTicker | null;
  activeExchange: "DSE" | "CSE";
  onSelectExchange: (exchange: "DSE" | "CSE") => void;
  marketSummary: MarketSummary | null;
  isConnected: boolean;
  onOpenAlertModal: (ticker?: string) => void;
  flashDirection?: "up" | "down";
  wsPing?: number;
  serverCycle?: number;
}

export function BinanceTradingHeader({
  selectedStock,
  activeExchange,
  onSelectExchange,
  marketSummary,
  isConnected,
  onOpenAlertModal,
  flashDirection,
  wsPing,
  serverCycle,
}: BinanceTradingHeaderProps) {
  const indices = marketSummary?.summary?.indices || [];
  const breadth = marketSummary?.summary?.breadth || { advanced: 0, declined: 0, unchanged: 0 };
  const totals = marketSummary?.summary?.totals || {};
  const isTradingHour = marketSummary?.is_trading_hour ?? false;

  const dsex = indices.find((i) => i.key === "DSEX");
  const ds30 = indices.find((i) => i.key === "DS30");
  const dses = indices.find((i) => i.key === "DSES");

  const ltp = selectedStock?.ltp ?? 0;
  const change = selectedStock?.change ?? 0;
  const percent = selectedStock?.percent ?? 0;
  const isPositive = change >= 0;

  return (
    <div className="w-full bg-[#12161c] border-b border-[#1e2329] text-xs text-[#848e9c] shadow-sm select-none">
      {/* ── Top Exchange & Global Market Ribbon ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 border-b border-[#1e2329]/60 text-[11px]">
        {/* Left: Exchange Switcher & Connection */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-0.5 rounded-lg bg-[#181a20] border border-[#2b313a]">
            <button
              onClick={() => onSelectExchange("DSE")}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                activeExchange === "DSE"
                  ? "bg-[#f0b90b] text-black shadow-sm"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeExchange === "DSE" ? "bg-black" : "bg-emerald-500"}`} />
              <span>DSE (Dhaka)</span>
            </button>
            <button
              onClick={() => onSelectExchange("CSE")}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                activeExchange === "CSE"
                  ? "bg-[#f0b90b] text-black shadow-sm"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeExchange === "CSE" ? "bg-black" : "bg-cyan-400"}`} />
              <span>CSE (Chittagong)</span>
            </button>
          </div>

          {/* Market Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181a20] border border-[#2b313a]/80">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? isTradingHour
                    ? "bg-[#0ecb81] animate-pulse"
                    : "bg-[#f0b90b]"
                  : "bg-[#f6465d]"
              }`}
            />
            <span className="font-semibold text-[10px] text-[#eaecef]">
              {isConnected ? (isTradingHour ? "MARKET OPEN" : "POST-MARKET") : "CONNECTING..."}
            </span>
            <span className="text-[10px] text-[#848e9c]">BST (UTC+6)</span>
          </div>

          {/* Live WebSocket Telemetry Indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181a20] border border-[#2b313a]/80 font-mono text-[10px]">
            <Radio className={`w-3 h-3 ${isConnected ? "text-[#0ecb81] animate-pulse" : "text-[#f6465d]"}`} />
            <span className={isConnected ? "text-[#0ecb81] font-bold" : "text-[#f6465d]"}>
              {isConnected ? "WS STREAM" : "DISCONNECTED"}
            </span>
            {wsPing !== undefined && wsPing > 0 && (
              <span className="text-[#848e9c]">({wsPing}ms)</span>
            )}
            {serverCycle !== undefined && (
              <span className="text-[#f0b90b] hidden sm:inline">#{serverCycle}</span>
            )}
          </div>

          <span className="hidden lg:inline-block text-[#5e6673]">|</span>
          <span className="hidden lg:inline-block text-[11px] text-[#848e9c]">
            Feed: <strong className="text-[#0ecb81]">LankaBangla Portal Direct</strong>
          </span>
        </div>

        {/* Center/Right: Live Indices Ticker Ribbon */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5">
          {dsex && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#848e9c] font-medium">DSEX:</span>
              <span className="font-mono font-bold text-[#eaecef]">{dsex.value.toLocaleString()}</span>
              <span
                className={`font-mono text-[10px] flex items-center ${
                  dsex.change >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"
                }`}
              >
                {dsex.change >= 0 ? "+" : ""}
                {dsex.change.toFixed(2)} ({dsex.change >= 0 ? "+" : ""}
                {dsex.percent.toFixed(2)}%)
              </span>
            </div>
          )}

          {ds30 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#848e9c] font-medium">DS30:</span>
              <span className="font-mono font-bold text-[#eaecef]">{ds30.value.toLocaleString()}</span>
              <span
                className={`font-mono text-[10px] flex items-center ${
                  ds30.change >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"
                }`}
              >
                {ds30.change >= 0 ? "+" : ""}
                {ds30.change.toFixed(2)}%
              </span>
            </div>
          )}

          {/* Market Breadth */}
          <div className="hidden lg:flex items-center gap-2 px-2 py-0.5 rounded bg-[#181a20] border border-[#2b313a]/50">
            <span className="text-[10px] text-[#848e9c]">Breadth:</span>
            <span className="text-[#0ecb81] font-mono font-bold text-[10px]">▲ {breadth.advanced}</span>
            <span className="text-[#f6465d] font-mono font-bold text-[10px]">▼ {breadth.declined}</span>
            <span className="text-[#848e9c] font-mono font-bold text-[10px]">■ {breadth.unchanged}</span>
          </div>

          {/* Total Turnover */}
          {totals.turnover ? (
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[#848e9c]">Turnover:</span>
              <span className="font-mono font-bold text-[#f0b90b]">
                {(totals.turnover / 10).toFixed(2)} Cr
              </span>
            </div>
          ) : null}

          {/* Quick Alert CTA */}
          <button
            onClick={() => onOpenAlertModal(selectedStock?.ticker)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] border border-[#f0b90b]/30 font-bold transition-all text-[11px]"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts</span>
          </button>
        </div>
      </div>

      {/* ── Main Binance Pro Ticker Header Banner ──────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2.5 bg-[#181a20]">
        {/* Selected Symbol Hero with Badges */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#eaecef] tracking-tight font-mono">
                {selectedStock?.ticker || "SELECT TICKER"}
              </span>
              <span className="text-xs text-[#848e9c] font-medium hidden sm:inline">
                / BDT
              </span>
              {/* Category Badge */}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f0b90b]/15 text-[#f0b90b] border border-[#f0b90b]/30">
                Cat {selectedStock?.category || "A"}
              </span>
              {/* Board Badge */}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2b313a] text-[#eaecef] border border-[#363c4e]">
                {selectedStock?.board || "MAIN"}
              </span>
              {/* Sector Badge */}
              {selectedStock?.sector && (
                <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1e2329] text-[#848e9c]">
                  {selectedStock.sector}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#848e9c] truncate max-w-[280px]">
              {selectedStock?.name || "Dhaka & Chittagong Stock Exchange Live"}
            </span>
          </div>
        </div>

        {/* Center: Hero LTP Price with Flash Animations */}
        <div className="flex items-center gap-6">
          <div
            className={`flex flex-col transition-all duration-300 px-3 py-1 rounded-lg ${
              flashDirection === "up"
                ? "bg-[#0ecb81]/20 ring-1 ring-[#0ecb81]"
                : flashDirection === "down"
                ? "bg-[#f6465d]/20 ring-1 ring-[#f6465d]"
                : "bg-transparent"
            }`}
          >
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"
                }`}
              >
                {ltp.toFixed(2)}
              </span>
              <span className="text-xs text-[#848e9c] font-medium">BDT</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"}>
                {isPositive ? "+" : ""}
                {change.toFixed(2)}
              </span>
              <span
                className={`font-semibold ${
                  isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"
                }`}
              >
                ({isPositive ? "+" : ""}
                {percent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* 24h Metrics Stats Bar (Binance Trading Style) */}
          <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-1 text-[11px]">
            <div>
              <span className="text-[#848e9c] block">24h High</span>
              <span className="font-mono font-semibold text-[#eaecef]">
                {selectedStock?.high ? selectedStock.high.toFixed(2) : "--"}
              </span>
            </div>
            <div>
              <span className="text-[#848e9c] block">24h Low</span>
              <span className="font-mono font-semibold text-[#eaecef]">
                {selectedStock?.low ? selectedStock.low.toFixed(2) : "--"}
              </span>
            </div>
            <div>
              <span className="text-[#848e9c] block">Prev Close</span>
              <span className="font-mono font-semibold text-[#eaecef]">
                {selectedStock?.ycp ? selectedStock.ycp.toFixed(2) : "--"}
              </span>
            </div>
            <div>
              <span className="text-[#848e9c] block">24h Volume</span>
              <span className="font-mono font-semibold text-[#eaecef]">
                {selectedStock?.volume ? (selectedStock.volume >= 1000000 ? `${(selectedStock.volume / 1000000).toFixed(2)}M` : selectedStock.volume.toLocaleString()) : "0"}
              </span>
            </div>
            <div className="hidden lg:block">
              <span className="text-[#848e9c] block">24h Turnover</span>
              <span className="font-mono font-semibold text-[#eaecef]">
                {selectedStock?.value_mn ? `${selectedStock.value_mn.toFixed(2)}M` : "0.00M"}
              </span>
            </div>
            <div className="hidden lg:block">
              <span className="text-[#848e9c] block">Trades</span>
              <span className="font-mono font-semibold text-[#eaecef]">
                {selectedStock?.trades ? selectedStock.trades.toLocaleString() : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Right CTA Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAlertModal(selectedStock?.ticker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0b90b] hover:bg-[#d8a406] text-black font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Create Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
