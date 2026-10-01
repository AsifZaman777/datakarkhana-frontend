"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Flame, DollarSign, Activity, LineChart, Bell, RefreshCw, Layers } from "lucide-react";
import { StockTicker, TopSharesData, stocksApi } from "@/lib/api/stocks";

interface TopSharesViewProps {
  onOpenChart: (ticker: string) => void;
  onOpenAlert: (ticker: string) => void;
  onViewDepth?: (ticker: string) => void;
}

export function TopSharesView({ onOpenChart, onOpenAlert, onViewDepth }: TopSharesViewProps) {
  const [activeTab, setActiveTab] = useState<"turnover" | "gainers" | "losers" | "volume">("turnover");
  const [topData, setTopData] = useState<TopSharesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await stocksApi.getTopShares();
      setTopData(res.data);
    } catch (e) {
      console.error("Error fetching top shares:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getActiveList = (): StockTicker[] => {
    if (!topData) return [];
    if (activeTab === "turnover") return topData.top_turnover || [];
    if (activeTab === "gainers") return topData.top_gainers || [];
    if (activeTab === "losers") return topData.top_losers || [];
    if (activeTab === "volume") return topData.top_volume || [];
    return [];
  };

  const list = getActiveList();

  return (
    <div className="space-y-6">
      {/* Top Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("turnover")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "turnover"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Top 20 Turnover</span>
          </button>

          <button
            onClick={() => setActiveTab("gainers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "gainers"
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Top 20 Gainers</span>
          </button>

          <button
            onClick={() => setActiveTab("losers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "losers"
                ? "bg-rose-500 text-white shadow-md"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Top 20 Losers</span>
          </button>

          <button
            onClick={() => setActiveTab("volume")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "volume"
                ? "bg-indigo-500 text-white shadow-md"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Top 20 Volume</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Top 3 Spotlight Cards */}
      {list.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {list.slice(0, 3).map((item, idx) => {
            const isUp = (item.change ?? 0) >= 0;
            return (
              <div
                key={item.ticker}
                className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl relative overflow-hidden flex items-center justify-between"
              >
                <div className="absolute top-2 right-3 font-black text-4xl text-muted/20 select-none">
                  #{idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-foreground">{item.ticker}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary font-bold">
                      {item.category || "A"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.sector || "DSE Stock"}</p>
                  <p className="text-xs text-muted-foreground/80 font-mono mt-2">
                    Turnover: <span className="font-bold text-foreground">{item.value_mn?.toFixed(2)} mn Tk</span>
                  </p>
                </div>

                <div className="text-right z-10">
                  <p className="text-lg font-black text-foreground">{item.ltp.toFixed(2)} Tk</p>
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                      isUp
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    {isUp ? "+" : ""}
                    {item.percent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-semibold text-[11px]">
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3">Trading Code</th>
                <th className="py-2 px-3 text-right">LTP (Tk)</th>
                <th className="py-2 px-3 text-right">Change (%)</th>
                <th className="py-2 px-3 text-right">Day High</th>
                <th className="py-2 px-3 text-right">Day Low</th>
                <th className="py-2 px-3 text-right">Volume</th>
                <th className="py-2 px-3 text-right">Turnover (mn)</th>
                <th className="py-2 px-3 text-center">Depth & Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {list.map((stock, i) => {
                const isUp = (stock.change ?? 0) >= 0;
                return (
                  <tr key={stock.ticker} className="hover:bg-muted/40 transition-colors odd:bg-transparent even:bg-muted/10">
                    <td className="py-1.5 px-3 text-center font-bold text-muted-foreground text-[11px]">{i + 1}</td>
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenChart(stock.ticker)}
                          className="font-extrabold text-foreground hover:text-primary transition-colors text-left"
                        >
                          {stock.ticker}
                        </button>
                        {stock.sector && (
                          <span className="text-[10px] text-muted-foreground/60 hidden sm:inline truncate max-w-[120px]">
                            {stock.sector}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-black text-foreground tabular-nums">
                      {stock.ltp.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] ${
                          isUp
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>
                          {isUp ? "+" : ""}
                          {stock.change.toFixed(2)} ({isUp ? "+" : ""}
                          {stock.percent.toFixed(2)}%)
                        </span>
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-muted-foreground tabular-nums text-[11px]">
                      {stock.high ? stock.high.toFixed(2) : "--"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-muted-foreground tabular-nums text-[11px]">
                      {stock.low ? stock.low.toFixed(2) : "--"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-muted-foreground tabular-nums text-[11px]">
                      {stock.volume ? stock.volume.toLocaleString() : "--"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-foreground tabular-nums text-[11px]">
                      {stock.value_mn ? stock.value_mn.toFixed(2) : "--"}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onViewDepth && (
                          <button
                            onClick={() => onViewDepth(stock.ticker)}
                            title={`View ${stock.ticker} Live Market Depth (10-Level Order Book)`}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] font-bold transition-all hover:scale-105"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Depth</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenChart(stock.ticker)}
                          title="View Chart"
                          className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <LineChart className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAlert(stock.ticker)}
                          title="Set Alert"
                          className="p-1 rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
