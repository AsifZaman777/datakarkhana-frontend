"use client";

import React, { useState, useEffect } from "react";
import { Calendar, RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { RecentMarketInfoRow, stocksApi } from "@/lib/api/stocks";

export function RecentMarketInfoView() {
  const [rows, setRows] = useState<RecentMarketInfoRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [daysPreset, setDaysPreset] = useState<number>(30);

  const fetchData = async (days: number) => {
    try {
      setLoading(true);
      const toDate = new Date().toISOString().split("T")[0];
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const res = await stocksApi.getRecentMarketInfo(fromDate, toDate);
      setRows(res.data.rows || []);
    } catch (e) {
      console.error("Error loading recent market info:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(daysPreset);
  }, [daysPreset]);

  // Aggregate stats
  const validDsex = rows.map((r) => r.dsex).filter((v) => v > 0);
  const maxDsex = validDsex.length ? Math.max(...validDsex) : 0;
  const minDsex = validDsex.length ? Math.min(...validDsex) : 0;
  const avgTurnover = rows.length ? rows.reduce((acc, r) => acc + (r.value || 0), 0) / rows.length : 0;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Recent Market Information & Statistics</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Daily historical trend of DSE indices, trading volume, turnover, and market capitalization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold">Timeframe:</span>
          {[15, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDaysPreset(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                daysPreset === d
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {d} Days
            </button>
          ))}
          <button
            onClick={() => fetchData(daysPreset)}
            disabled={loading}
            className="p-2 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all ml-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Highest DSEX in Period</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">{maxDsex.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Lowest DSEX in Period</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{minDsex.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Average Daily Turnover</span>
          <p className="text-2xl font-black text-foreground mt-1">
            {(avgTurnover / 10).toFixed(2)} <span className="text-sm font-normal">Cr BDT</span>
          </p>
        </div>
      </div>

      {/* Historical Table */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">DSEX Index</th>
                <th className="py-3 px-4 text-right">DS30 Index</th>
                <th className="py-3 px-4 text-right">DSES Shariah</th>
                <th className="py-3 px-4 text-right">Trades</th>
                <th className="py-3 px-4 text-right">Volume (Shares)</th>
                <th className="py-3 px-4 text-right">Turnover (Cr Tk)</th>
                <th className="py-3 px-4 text-right">Market Cap (Cr Tk)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground/60 text-xs">
                    {loading ? "Loading historical market info..." : "No records found for this period."}
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.date || i} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground font-mono">{r.date}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-foreground">
                      {r.dsex ? r.dsex.toFixed(2) : "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {r.ds30 ? r.ds30.toFixed(2) : "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {r.dses ? r.dses.toFixed(2) : "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {r.trades ? r.trades.toLocaleString() : "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {r.volume ? (r.volume / 1000000).toFixed(2) + "M" : "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {r.value ? (r.value / 10).toFixed(2) : "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {r.marketCap ? (r.marketCap / 10000000).toFixed(0) : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
