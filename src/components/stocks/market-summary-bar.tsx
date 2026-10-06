"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Clock } from "lucide-react";
import { MarketSummary } from "@/lib/api/stocks";

interface MarketSummaryBarProps {
  summary: MarketSummary | null;
  isConnected: boolean;
  onRefresh?: () => void;
}

export function MarketSummaryBar({ summary, isConnected }: MarketSummaryBarProps) {
  const indices = summary?.summary?.indices || [];
  const totals = summary?.summary?.totals;
  const breadth = summary?.summary?.breadth;
  const isLive = summary?.is_trading_hour ?? false;
  const rawMarketStatus = summary?.market_status || (isLive ? "Open" : "Closed");
  const normStatus = rawMarketStatus.toLowerCase();

  const totalAdv = breadth?.advanced ?? 0;
  const totalDec = breadth?.declined ?? 0;
  const totalUnch = breadth?.unchanged ?? 0;
  const totalIssues = totalAdv + totalDec + totalUnch;

  const advPct = totalIssues > 0 ? (totalAdv / totalIssues) * 100 : 0;
  const decPct = totalIssues > 0 ? (totalDec / totalIssues) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-5 shadow-sm space-y-4">
      {/* Top row: Status, Live Indicator, Totals */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? normStatus === "open"
                    ? "bg-emerald-500 animate-pulse"
                    : normStatus === "pre-open"
                    ? "bg-lime-400 animate-pulse"
                    : "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isConnected ? "LankaBangla Live Feed Active" : "Connecting to Local Stream..."}
            </span>
          </div>

          <span className="text-muted-foreground/40">•</span>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/60 text-secondary-foreground">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {normStatus === "open" ? (
                <span className="text-emerald-500 font-semibold">Live Session (Market Open)</span>
              ) : normStatus === "pre-open" ? (
                <span className="text-lime-400 font-semibold">Pre-Opening Session</span>
              ) : normStatus === "post-close" || normStatus === "cpt" ? (
                <span className="text-amber-400 font-semibold">Post-Close Session</span>
              ) : (
                <span className="text-muted-foreground">Market Closed</span>
              )}
            </span>
          </div>
        </div>

        {totals && (
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div>
              <span className="text-muted-foreground/70">Turnover: </span>
              <span className="font-semibold text-foreground">
                BDT {(Number(totals.turnover ?? totals.value ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mn
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/70">Volume: </span>
              <span className="font-semibold text-foreground">
                {Number(totals.volume || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/70">Trades: </span>
              <span className="font-semibold text-foreground">
                {Number(totals.trades || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Middle row: Key Indices (DSEX, DS30, DSES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {indices.map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div
              key={idx.key}
              className="p-3.5 rounded-xl border border-border/30 bg-background/50 hover:bg-background/80 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold tracking-wider text-muted-foreground">{idx.key}</p>
                <p className="text-xl font-extrabold text-foreground tracking-tight mt-0.5">
                  {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div
                className={`flex flex-col items-end px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  isUp
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                <div className="flex items-center gap-1">
                  {isUp ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isUp ? "+" : ""}
                    {idx.change.toFixed(2)}
                  </span>
                </div>
                <span className="text-[11px] font-normal">
                  ({isUp ? "+" : ""}
                  {idx.percent.toFixed(2)}%)
                </span>
              </div>
            </div>
          );
        })}

        {/* Market Breadth Card */}
        <div className="p-3.5 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1.5">
            <span className="font-bold tracking-wider">MARKET BREADTH</span>
            <span>{totalIssues} Issues</span>
          </div>

          {/* Visual Breadth Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted/40 my-1">
            <div
              style={{ width: `${advPct}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Advanced: ${totalAdv}`}
            />
            <div
              style={{ width: `${100 - advPct - decPct}%` }}
              className="bg-slate-400 transition-all duration-500"
              title={`Unchanged: ${totalUnch}`}
            />
            <div
              style={{ width: `${decPct}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Declined: ${totalDec}`}
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ▲ {totalAdv} Up
            </span>
            <span className="text-muted-foreground font-medium">
              = {totalUnch} Unch
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              ▼ {totalDec} Down
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
