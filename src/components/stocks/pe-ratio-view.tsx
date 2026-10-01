"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Calculator, LineChart, Bell } from "lucide-react";
import { PEItem, stocksApi } from "@/lib/api/stocks";

interface PERatioViewProps {
  onOpenChart: (ticker: string) => void;
  onOpenAlert: (ticker: string) => void;
}

export function PERatioView({ onOpenChart, onOpenAlert }: PERatioViewProps) {
  const [data, setData] = useState<PEItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 35;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await stocksApi.getPe();
      setData(res.data.pe_data || []);
    } catch (e) {
      console.error("Error loading PE data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data.filter((item) =>
    item.code.toUpperCase().includes(search.toUpperCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">DSE Price-to-Earnings (P/E) Ratios</h2>
            <p className="text-xs text-muted-foreground">
              Official basic, diluted, and trailing P/E ratios for audited and un-audited financial statements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker code..."
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
                <th className="py-3 px-4">Trade Code</th>
                <th className="py-3 px-4 text-right">Close (Tk)</th>
                <th className="py-3 px-4 text-right">YCP</th>
                <th className="py-3 px-4 text-right">P/E 1 (Basic)</th>
                <th className="py-3 px-4 text-right">P/E 2 (Diluted)</th>
                <th className="py-3 px-4 text-right">P/E 3 (Basic)</th>
                <th className="py-3 px-4 text-right">P/E 4 (Diluted)</th>
                <th className="py-3 px-4 text-right">Trailing P/E</th>
                <th className="py-3 px-4 text-center">Valuation</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {paginated.map((item, idx) => {
                const peVal = parseFloat(item.pe1 || item.trailing_pe) || 0;
                let valLabel = "N/A";
                let valColor = "bg-muted text-muted-foreground";

                if (peVal > 0 && peVal < 12) {
                  valLabel = "Attractive";
                  valColor = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                } else if (peVal >= 12 && peVal <= 25) {
                  valLabel = "Moderate";
                  valColor = "bg-primary/10 text-primary border border-primary/20";
                } else if (peVal > 25) {
                  valLabel = "High / Premium";
                  valColor = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                }

                return (
                  <tr key={item.code} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-black text-foreground">
                      <button
                        onClick={() => onOpenChart(item.code)}
                        className="hover:text-primary transition-colors text-left"
                      >
                        {item.code}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {item.close_price || "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {item.ycp || "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {item.pe1 || "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {item.pe2 || "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {item.pe3 || "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {item.pe4 || "--"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-foreground">
                      {item.trailing_pe || "--"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${valColor}`}>
                        {valLabel}
                      </span>
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
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} items
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
