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
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const indices = marketSummary?.summary?.indices || [];
  const breadth = marketSummary?.summary?.breadth || { advanced: 0, declined: 0, unchanged: 0 };
  const totals = marketSummary?.summary?.totals || {};
  const isTradingHour = marketSummary?.is_trading_hour ?? false;

  // Real-time market status and exchanges directly from LankaBangla
  const exchanges = marketSummary?.exchanges || [];
  const currentExchangeInfo = exchanges.find(
    (e) => e.code.toUpperCase() === activeExchange.toUpperCase()
  );
  const rawStatus =
    currentExchangeInfo?.marketStatus ||
    marketSummary?.market_status ||
    (isTradingHour ? "Open" : "Closed");

  // Dynamic colors matching LankaBangla portal (.btn-market-*)
  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "open") return "text-[#82f73b]";
    if (s === "pre-open") return "text-[#aaf73b]";
    if (s === "post-close" || s === "cpt") return "text-[#f59e0b]";
    if (s === "closed") return "text-[#f6465d]";
    return "text-[#82f73b]";
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "open") {
      return {
        label: "MARKET OPEN",
        dotColor: "bg-[#0ecb81] animate-pulse",
        textColor: "text-[#0ecb81]",
      };
    }
    if (s === "pre-open") {
      return {
        label: "PRE-OPEN SESSION",
        dotColor: "bg-[#aaf73b] animate-pulse",
        textColor: "text-[#aaf73b]",
      };
    }
    if (s === "post-close" || s === "cpt") {
      return {
        label: "POST-CLOSE REPORTING",
        dotColor: "bg-[#f0b90b]",
        textColor: "text-[#f0b90b]",
      };
    }
    return {
      label: "MARKET CLOSED",
      dotColor: "bg-[#f6465d]",
      textColor: "text-[#f6465d]",
    };
  };

  const badgeInfo = isConnected
    ? getStatusBadge(rawStatus)
    : {
        label: "CONNECTING...",
        dotColor: "bg-[#f6465d]",
        textColor: "text-[#f6465d]",
      };

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
        {/* Left: LankaBangla Live Status Button, Switcher & Telemetry */}
        <div className="flex items-center gap-2.5">
          {/* LankaBangla Official Exchange & Live Market Status Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#39859f] hover:bg-[#32778f] text-white text-[11px] font-bold shadow-sm border border-[#4ea1bc]/60 transition-all select-none active:scale-[0.98]"
              title="LankaBangla Portal Live Market Status (Click to switch exchange)"
            >
              <span className="text-sm leading-none">🇧🇩</span>
              <span className="tracking-wide text-white font-bold">{activeExchange}</span>
              <span className={`font-bold ${getStatusColor(rawStatus)}`}>
                ({rawStatus})
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/90 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-[#181a20] border border-[#2b313a] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-[#2b313a]/80 text-[10px] uppercase font-bold text-[#848e9c] flex items-center justify-between">
                  <span>LankaBangla Exchanges</span>
                  <span className="text-[#0ecb81] font-mono text-[9px]">LIVE FEED</span>
                </div>
                {(exchanges.length > 0
                  ? exchanges
                  : [
                      { code: "DSE", name: "Dhaka Stock Exchange PLC.", marketStatus: rawStatus },
                      { code: "CSE", name: "Chittagong Stock Exchange PLC.", marketStatus: rawStatus },
                    ]
                ).map((exch) => {
                  const isSelected = activeExchange.toUpperCase() === exch.code.toUpperCase();
                  const exchStatus = exch.marketStatus || rawStatus;
                  return (
                    <button
                      key={exch.code}
                      onClick={() => {
                        onSelectExchange(exch.code as "DSE" | "CSE");
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#202630] transition-colors ${
                        isSelected ? "bg-[#2b313a]/60 text-white" : "text-[#eaecef]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🇧🇩</span>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>{exch.code}</span>
                            <span className={`text-[10px] font-bold ${getStatusColor(exchStatus)}`}>
                              ({exchStatus})
                            </span>
                          </div>
                          <div className="text-[10px] text-[#848e9c] line-clamp-1">
                            {exch.name}
                          </div>
                        </div>
                      </div>
                      {isSelected && <span className="text-[#0ecb81] font-bold text-xs">✓</span>}
                    </button>
                  );
                })}
                <div className="px-3 py-1.5 mt-1 border-t border-[#2b313a]/80 text-[9px] text-[#848e9c] flex items-center justify-between">
                  <span>Source: lankabd.com</span>
                  <span className="text-[#0ecb81]">Direct API Sync</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Exchange Switcher Tabs */}
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-[#181a20] border border-[#2b313a]">
            <button
              onClick={() => onSelectExchange("DSE")}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 text-[10px] ${
                activeExchange === "DSE"
                  ? "bg-[#f0b90b] text-black shadow-sm"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeExchange === "DSE" ? "bg-black" : "bg-emerald-500"}`} />
              <span>DSE</span>
            </button>
            <button
              onClick={() => onSelectExchange("CSE")}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 text-[10px] ${
                activeExchange === "CSE"
                  ? "bg-[#f0b90b] text-black shadow-sm"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeExchange === "CSE" ? "bg-black" : "bg-cyan-400"}`} />
              <span>CSE</span>
            </button>
          </div>

          {/* Real-time Market Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181a20] border border-[#2b313a]/80">
            <span className={`w-2 h-2 rounded-full ${badgeInfo.dotColor}`} />
            <span className={`font-semibold text-[10px] ${badgeInfo.textColor}`}>
              {badgeInfo.label}
            </span>
            <span className="text-[10px] text-[#848e9c] hidden md:inline">BST (UTC+6)</span>
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
