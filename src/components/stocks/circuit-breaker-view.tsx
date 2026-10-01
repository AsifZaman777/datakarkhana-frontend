"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, AlertOctagon, LineChart, Bell } from "lucide-react";
import { CircuitBreakerItem, stocksApi } from "@/lib/api/stocks";

interface CircuitBreakerViewProps {
  onOpenChart: (ticker: string) => void;
  onOpenAlert: (ticker: string) => void;
}

export function CircuitBreakerView({ onOpenChart, onOpenAlert }: CircuitBreakerViewProps) {
  const [data, setData] = useState<CircuitBreakerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedBoard, setSelectedBoard] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 30;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await stocksApi.getCircuitBreakers();
      setData(res.data.circuit_breakers || []);
    } catch (e) {
      console.error("Error loading circuit breakers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data.filter((item) => {
    const matchSearch =
      item.code.toUpperCase().includes(search.toUpperCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    const matchBoard =
      selectedBoard === "ALL" || (item.board || "PUBLIC").toUpperCase() === selectedBoard.toUpperCase();
    return matchSearch && matchBoard;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const boards = ["ALL", "PUBLIC", "SME", "ATB"];

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">DSE Circuit Breakers & Price Limits</h2>
            <p className="text-xs text-muted-foreground">
              Official daily upper ceiling, lower floor, and allowable price bands for Public, SME, and ATB securities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Board Selector Pills */}
          <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/20">
            {boards.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBoard(b);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedBoard === b
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b === "ALL" ? "All Boards" : b}
              </button>
            ))}
          </div>
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/60 bg-background/50 text-xs font-bold text-foreground focus:outline-none uppercase"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Trading Code</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4 text-right">Close Price</th>
                <th className="py-3 px-4 text-center">Breaker %</th>
                <th className="py-3 px-4 text-right">Lower Limit (Floor)</th>
                <th className="py-3 px-4 text-center">Allowable Range</th>
                <th className="py-3 px-4 text-right">Upper Limit (Ceiling)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {paginated.map((item, idx) => {
                const range = item.upper_limit - item.lower_limit;
                const pos = range > 0 ? ((item.close_price - item.lower_limit) / range) * 100 : 50;

                return (
                  <tr key={item.code} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-black text-foreground">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenChart(item.code)}
                          className="hover:text-primary transition-colors text-left"
                        >
                          {item.code}
                        </button>
                        {item.board && item.board !== "PUBLIC" && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              item.board === "SME"
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {item.board}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate" title={item.name}>
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {item.close_price > 0 ? item.close_price.toFixed(2) : "--"}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-500">
                      {item.breaker_pct}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-500">
                      {item.lower_limit > 0 ? item.lower_limit.toFixed(2) : "--"}
                    </td>
                    <td className="py-3 px-4 text-center w-36">
                      <div className="w-full bg-muted/40 h-2 rounded-full relative overflow-hidden">
                        <div
                          style={{ left: `${Math.max(0, Math.min(100, pos))}%` }}
                          className="absolute -translate-x-1/2 top-0 bottom-0 w-2.5 bg-primary rounded-full"
                          title={`Position: ${pos.toFixed(0)}%`}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-500">
                      {item.upper_limit > 0 ? item.upper_limit.toFixed(2) : "--"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenChart(item.code)}
                          title="View Chart"
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <LineChart className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAlert(item.code)}
                          title="Set Alert"
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
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

        {/* Pagination */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} securities
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-border/40 hover:bg-muted disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border/40 hover:bg-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
