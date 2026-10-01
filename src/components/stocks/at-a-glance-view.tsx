"use client";

import React, { useState, useEffect } from "react";
import { Globe, RefreshCw, BarChart } from "lucide-react";
import { stocksApi } from "@/lib/api/stocks";

export function AtAGlanceView() {
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await stocksApi.getAtAGlance();
      setData(res.data.at_a_glance || []);
    } catch (e) {
      console.error("Error loading at-a-glance data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">DSE Market at a Glance</h2>
            <p className="text-xs text-muted-foreground">
              Official macroeconomic comparison, market capitalizations, and listed issues across recent years.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20 text-muted-foreground font-semibold">
                <th className="py-3.5 px-5">Particulars</th>
                <th className="py-3.5 px-5 text-right font-mono">2023</th>
                <th className="py-3.5 px-5 text-right font-mono">2024</th>
                <th className="py-3.5 px-5 text-right font-mono font-bold text-foreground">2025</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted-foreground/60 text-xs">
                    {loading ? "Loading statistics..." : "No data available."}
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-5 font-bold text-foreground">
                      {row.particulars || row.col_0 || "--"}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-muted-foreground">
                      {row["2023"] || row.col_1 || "--"}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-muted-foreground">
                      {row["2024"] || row.col_2 || "--"}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-black text-foreground">
                      {row["2025"] || row.col_3 || "--"}
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
