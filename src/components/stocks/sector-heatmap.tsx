"use client";

import React, { useState, useEffect } from "react";
import { SectorHeatmapData, ScrapedSectorItem } from "@/lib/api/stocks";
import { X, Filter } from "lucide-react";

// Official DSE baseline scraped directly from www.dse.com.bd homepage
const DEFAULT_DSE_HEATMAP: SectorHeatmapData = {
  adv: 5,
  dec: 7,
  top_12: [
    { code: "Textile", name: "Textile", change_pct: 0.8, col_span: 2, row_span: 2, bg_color: "rgba(29,122,63,0.6870734212765506)" },
    { code: "Insurance", name: "Insurance", change_pct: -1.9, col_span: 2, row_span: 2, bg_color: "rgba(192,57,43,0.8756269792041309)" },
    { code: "PharmaChem", name: "PharmaChem", change_pct: -0.5, col_span: 2, row_span: 2, bg_color: "rgba(192,57,43,0.6385649542548286)" },
    { code: "Financial In", name: "Financial In", change_pct: -6.1, col_span: 2, row_span: 1, bg_color: "rgba(192,57,43,0.9)" },
    { code: "Engineering", name: "Engineering", change_pct: 2.5, col_span: 2, row_span: 1, bg_color: "rgba(29,122,63,0.9)" },
    { code: "MutFund", name: "MutFund", change_pct: -2.5, col_span: 2, row_span: 1, bg_color: "rgba(192,57,43,0.9)" },
    { code: "Bank", name: "Bank", change_pct: -0.1, col_span: 2, row_span: 1, bg_color: "rgba(192,57,43,0.5756479524197791)" },
    { code: "Misc", name: "Misc", change_pct: -0.8, col_span: 1, row_span: 1, bg_color: "rgba(192,57,43,0.6900840126494078)" },
    { code: "FuelPower", name: "FuelPower", change_pct: -0.4, col_span: 1, row_span: 1, bg_color: "rgba(192,57,43,0.6163655307202948)" },
    { code: "FoodAllied", name: "FoodAllied", change_pct: 0.3, col_span: 1, row_span: 1, bg_color: "rgba(29,122,63,0.6011210715213872)" },
    { code: "IT", name: "IT", change_pct: 0.0, col_span: 1, row_span: 1, bg_color: "rgba(29,122,63,0.5517997848295307)" },
    { code: "Tannery", name: "Tannery", change_pct: 4.6, col_span: 1, row_span: 1, bg_color: "rgba(29,122,63,0.9)" },
  ],
  sectors: [],
};

interface SectorHeatmapProps {
  heatmapData?: SectorHeatmapData | null;
  selectedSector?: string;
  onSelectSector: (sector: string) => void;
  initialData?: SectorHeatmapData | null;
}

export function SectorHeatmap({
  heatmapData,
  selectedSector,
  onSelectSector,
  initialData,
}: SectorHeatmapProps) {
  const [data, setData] = useState<SectorHeatmapData>(initialData || DEFAULT_DSE_HEATMAP);

  useEffect(() => {
    if (heatmapData) {
      setData(heatmapData);
    } else if (initialData) {
      setData(initialData);
    }
  }, [heatmapData, initialData]);

  const sectors = data?.top_12 && data.top_12.length > 0 ? data.top_12 : (data?.sectors || []).slice(0, 12);
  const advCount = data?.adv ?? 5;
  const decCount = data?.dec ?? 7;

  const getTileSpanClass = (sec: ScrapedSectorItem, idx: number) => {
    const col = sec.col_span;
    const row = sec.row_span;

    if (col === 2 && row === 2) return "col-span-2 row-span-2";
    if (col === 2 && row === 1) return "col-span-2 row-span-1";
    if (col === 1 && row === 2) return "col-span-1 row-span-2";
    if (col === 1 && row === 1) return "col-span-1 row-span-1";

    // Official DSE fallback layout by index
    // Top 3 (Textile, Insurance, PharmaChem): col-span-2 row-span-2
    // Next 4 (Financial In, Engineering, MutFund, Bank): col-span-2 row-span-1
    // Rest (Misc, FuelPower, FoodAllied, IT, Tannery): col-span-1 row-span-1
    if (idx < 3) return "col-span-2 row-span-2";
    if (idx < 7) return "col-span-2 row-span-1";
    return "col-span-1 row-span-1";
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/70 backdrop-blur-xl p-3 sm:p-4 shadow-xs space-y-2.5">
      {/* Header bar matching exact DSE layout */}
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <h3 className="text-[11.5px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/90">
            Sector Heatmap
          </h3>

          {selectedSector && (
            <button
              onClick={() => onSelectSector("")}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors ml-2"
              title="Click to reset sector filter"
            >
              <Filter className="w-3 h-3" />
              <span>{selectedSector}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Adv / Dec Stats */}
          <div className="text-[12px] font-mono select-none">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{advCount} adv</span>
            <span className="text-muted-foreground/60 mx-1">·</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{decCount} dec</span>
          </div>

        </div>
      </div>

      {/* Grid matching official DSE treemap layout */}
      <div className="grid grid-cols-6 gap-[3px] auto-rows-[64px] sm:auto-rows-[70px]">
        {sectors.map((sec: ScrapedSectorItem, idx: number) => {
          const isSelected =
            selectedSector &&
            (selectedSector.toLowerCase() === sec.code.toLowerCase() ||
              selectedSector.toLowerCase() === sec.name.toLowerCase() ||
              (sec.raw_name && selectedSector.toLowerCase() === sec.raw_name.toLowerCase()));

          const isUp = (sec.change_pct ?? 0) >= 0;
          const spanClass = getTileSpanClass(sec, idx);

          // Exact DSE color style or robust RGBA fallbacks
          let bg = sec.bg_color;
          if (!bg) {
            const abs = Math.abs(sec.change_pct ?? 0);
            const alpha = abs >= 2.0 ? 0.90 : abs >= 1.0 ? 0.78 : abs >= 0.5 ? 0.65 : 0.55;
            bg = isUp ? `rgba(29, 122, 63, ${alpha})` : `rgba(192, 57, 43, ${alpha})`;
          }

          return (
            <button
              key={sec.code || sec.name || idx}
              type="button"
              onClick={() => onSelectSector(isSelected ? "" : sec.code)}
              style={{
                backgroundColor: bg,
                borderRadius: "1px",
              }}
              className={`relative ${spanClass} text-left transition-all duration-150 overflow-hidden hover:brightness-110 active:scale-[0.99] select-none ${
                isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background z-10" : ""
              }`}
              title={`Click to filter stocks by ${sec.name} (${isUp ? "+" : ""}${sec.change_pct.toFixed(1)}%)`}
            >
              <div className="absolute inset-0 p-2 sm:p-2.5 flex flex-col justify-between text-white">
                {/* Top-left: Sector Name */}
                <div className="text-[12px] font-medium leading-tight truncate">
                  {sec.name}
                </div>

                {/* Bottom-left: Percentage */}
                <div className="text-[12px] sm:text-[13px] font-bold font-mono tracking-tight leading-none">
                  {isUp ? "+" : ""}{sec.change_pct !== undefined ? sec.change_pct.toFixed(1) : "0.0"}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
