"use client";

import React, { useState, useEffect, useRef } from "react";
import { StockTicker } from "@/lib/api/stocks";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Bell,
  LineChart,
  ArrowUpDown,
  Layers,
  X,
  AlignJustify,
  SlidersHorizontal,
} from "lucide-react";

interface MarketWatchTableProps {
  stocks: StockTicker[];
  flashingTickers: Record<string, "up" | "down">;
  onOpenChart: (ticker: string) => void;
  onOpenAlert: (ticker: string) => void;
  onViewDepth?: (ticker: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedBoard: string;
  onBoardChange: (board: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: string) => void;
}

export function MarketWatchTable({
  stocks,
  flashingTickers,
  onOpenChart,
  onOpenAlert,
  onViewDepth,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBoard,
  onBoardChange,
  sortBy,
  sortOrder,
  onSortChange,
}: MarketWatchTableProps) {
  // Ultra-dense default layout with 100 rows per page
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isDense, setIsDense] = useState<boolean>(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Pressing '/' or 'Ctrl+K' focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const totalPages = Math.ceil(stocks.length / pageSize) || 1;
  const paginatedStocks = stocks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categories = ["ALL", "A", "B", "N", "Z"];

  const getBoardBadge = (board?: string) => {
    switch (board?.toUpperCase()) {
      case "SME":
        return (
          <span className="px-1 py-0.5 rounded text-[8.5px] font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 tracking-tight">
            SME
          </span>
        );
      case "ATB":
        return (
          <span className="px-1 py-0.5 rounded text-[8.5px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 tracking-tight">
            ATB
          </span>
        );
      case "DEBT":
        return (
          <span className="px-1 py-0.5 rounded text-[8.5px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 tracking-tight">
            BOND
          </span>
        );
      case "YIELDDBT":
        return (
          <span className="px-1 py-0.5 rounded text-[8.5px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 tracking-tight">
            G-SEC
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col">
      {/* 1. Dedicated High-Visibility Highlighted Search Bar */}
      <div className="p-3.5 sm:p-4 bg-muted/20 border-b border-border/30 space-y-3">
        {/* Prominent Search Bar with Glowing Accent */}
        <div className="relative flex items-center w-full rounded-xl border-2 border-primary/60 dark:border-primary/50 bg-background dark:bg-slate-900/90 shadow-[0_0_20px_rgba(59,130,246,0.18)] dark:shadow-[0_0_25px_rgba(59,130,246,0.25)] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all p-1">
          {/* Eye-catching Search Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-black text-xs shadow-sm shrink-0 select-none">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">SEARCH</span>
          </div>

          {/* High-Contrast Search Input */}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="SEARCH ANY OF 640+ STOCKS, SMES, ATB, BONDS, G-SEC (e.g. SQURPHARMA, ACHIASF, LBS, BEXGSUKUK)..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs sm:text-sm font-bold text-foreground placeholder:text-muted-foreground/60 placeholder:font-semibold bg-transparent focus:outline-none uppercase tracking-wide"
          />

          {/* Right Action Tools in Search Bar */}
          <div className="flex items-center gap-2 pr-2 shrink-0">
            {searchQuery && (
              <>
                <span className="hidden md:inline-flex text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {stocks.length} matches
                </span>
                <button
                  onClick={() => {
                    onSearchChange("");
                    setCurrentPage(1);
                    searchInputRef.current?.focus();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Clear</span>
                </button>
              </>
            )}

            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/80 text-[10px] font-mono text-muted-foreground font-bold border border-border/40 select-none">
              Press <span className="text-primary font-black">/</span>
            </kbd>
          </div>
        </div>

        {/* 2. Fast Filter Strip: Boards, Categories, Density & Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          {/* Board Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mr-1">
              Board:
            </span>
            {[
              { id: "ALL", label: "🌐 All Boards" },
              { id: "PUBLIC", label: "🏛️ Main Board" },
              { id: "SME", label: "🚀 SME" },
              { id: "ATB", label: "🔄 ATB" },
              { id: "DEBT", label: "📜 Debt" },
              { id: "YIELDDBT", label: "🇧🇩 G-Sec" },
            ].map((board) => (
              <button
                key={board.id}
                onClick={() => {
                  onBoardChange(board.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedBoard.toUpperCase() === board.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {board.label}
              </button>
            ))}
          </div>

          {/* Right Group: Categories, Density Toggle & Rows */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Pills */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground font-bold mr-0.5 hidden lg:inline">
                Cat:
              </span>
              <div className="flex items-center rounded-lg bg-muted/40 p-0.5 border border-border/20">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onCategoryChange(cat);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      selectedCategory.toUpperCase() === cat
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Density Toggle Button */}
            <button
              onClick={() => setIsDense((prev) => !prev)}
              title={isDense ? "Switch to Comfortable mode" : "Switch to Dense compact mode"}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDense
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground"
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span className="text-[11px]">{isDense ? "Dense Mode" : "Comfortable"}</span>
            </button>

            {/* Stocks Counter */}
            <span className="text-xs text-muted-foreground font-mono font-bold bg-muted/40 px-2.5 py-1 rounded-lg border border-border/20">
              {stocks.length} Instruments
            </span>
          </div>
        </div>
      </div>

      {/* 3. Ultra-Dense Financial Table with all 11 Official DSE Columns */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className={`border-b border-border/30 bg-muted/25 text-muted-foreground font-bold tracking-wider uppercase ${
                isDense ? "text-[10px]" : "text-[11px]"
              }`}
            >
              {(() => {
                const renderSortHeader = (
                  label: string,
                  columnKey: string,
                  align: "left" | "right" | "center" = "right"
                ) => {
                  const isActive = sortBy === columnKey;
                  const alignClass =
                    align === "left"
                      ? "justify-start"
                      : align === "center"
                      ? "justify-center"
                      : "justify-end";

                  return (
                    <th
                      onClick={() => onSortChange(columnKey)}
                      className={`${
                        isDense ? "py-1.5 px-2" : "py-2.5 px-3"
                      } cursor-pointer hover:text-foreground transition-colors group select-none whitespace-nowrap ${
                        align === "left" ? "text-left" : align === "center" ? "text-center" : "text-right"
                      }`}
                    >
                      <div className={`flex items-center ${alignClass} gap-1`}>
                        <span className={isActive ? "text-primary font-black" : ""}>{label}</span>
                        {isActive ? (
                          <span className="text-primary text-[10px] font-black">
                            {sortOrder === "asc" ? "▲" : "▼"}
                          </span>
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </th>
                  );
                };

                return (
                  <>
                    {renderSortHeader("Trading Code", "code", "left")}
                    {renderSortHeader("LTP*", "ltp", "right")}
                    {renderSortHeader("High", "high", "right")}
                    {renderSortHeader("Low", "low", "right")}
                    {renderSortHeader("CloseP*", "close", "right")}
                    {renderSortHeader("YCP*", "ycp", "right")}
                    {renderSortHeader("Change (Tk)", "change", "right")}
                    {renderSortHeader("% Change", "percent", "right")}
                    {renderSortHeader("Trade", "trades", "right")}
                    {renderSortHeader("Value (mn)", "turnover", "right")}
                    {renderSortHeader("Volume", "volume", "right")}
                    <th className={`${isDense ? "py-1.5 px-2" : "py-2 px-3"} text-center whitespace-nowrap min-w-[125px]`}>
                      <div className="flex items-center justify-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold">
                        <Layers className="w-3 h-3" />
                        <span>Actions</span>
                      </div>
                    </th>
                  </>
                );
              })()}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/20">
            {paginatedStocks.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-muted-foreground/70 text-xs">
                  <p className="font-semibold text-sm">No stocks match your search query or filters</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Try searching another symbol or resetting filters</p>
                </td>
              </tr>
            ) : (
              paginatedStocks.map((stock) => {
                const flash = flashingTickers[stock.ticker];
                const changeVal = stock.change ?? 0;
                const isPositive = changeVal > 0;
                const isNegative = changeVal < 0;

                return (
                  <tr
                    key={stock.ticker}
                    className={`transition-colors duration-200 odd:bg-transparent even:bg-muted/10 hover:bg-primary/10 ${
                      flash === "up"
                        ? "bg-emerald-500/15"
                        : flash === "down"
                        ? "bg-rose-500/15"
                        : ""
                    }`}
                  >
                    {/* 1. TRADING CODE */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} whitespace-nowrap`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onOpenChart(stock.ticker)}
                          className="font-black text-foreground hover:text-primary transition-colors text-left text-xs tracking-tight"
                        >
                          {stock.ticker}
                        </button>
                        {stock.category && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-bold font-mono bg-muted/60 text-muted-foreground border border-border/30">
                            {stock.category}
                          </span>
                        )}
                        {getBoardBadge(stock.board)}
                        {stock.sector && (
                          <span
                            className="text-[10px] text-muted-foreground/50 hidden 2xl:inline truncate max-w-[90px]"
                            title={stock.sector}
                          >
                            {stock.sector}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. LTP* */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right tabular-nums text-[11.5px] whitespace-nowrap`}>
                      <span
                        className={`font-mono font-black px-1.5 py-0.5 rounded transition-colors duration-200 ${
                          flash === "up"
                            ? "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40"
                            : flash === "down"
                            ? "bg-rose-500/25 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/40"
                            : isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isNegative
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-foreground"
                        }`}
                      >
                        {stock.ltp !== undefined && stock.ltp !== null ? stock.ltp.toFixed(2) : "--"}
                      </span>
                    </td>

                    {/* 3. HIGH */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono text-muted-foreground tabular-nums text-[11px] whitespace-nowrap`}>
                      {stock.high ? stock.high.toFixed(2) : "--"}
                    </td>

                    {/* 4. LOW */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono text-muted-foreground tabular-nums text-[11px] whitespace-nowrap`}>
                      {stock.low ? stock.low.toFixed(2) : "--"}
                    </td>

                    {/* 5. CLOSEP* */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono text-foreground/80 tabular-nums text-[11px] whitespace-nowrap`}>
                      {stock.close ? stock.close.toFixed(2) : (stock.ltp ? stock.ltp.toFixed(2) : "--")}
                    </td>

                    {/* 6. YCP* */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono text-muted-foreground tabular-nums text-[11px] whitespace-nowrap`}>
                      {stock.ycp ? stock.ycp.toFixed(2) : "--"}
                    </td>

                    {/* 7. CHANGE (Tk) */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono font-bold tabular-nums text-[11px] whitespace-nowrap`}>
                      <span
                        className={
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isNegative
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        }
                      >
                        {isPositive ? "+" : ""}
                        {stock.change !== undefined && stock.change !== null ? stock.change.toFixed(2) : "--"}
                      </span>
                    </td>

                    {/* 8. % CHANGE */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono font-bold tabular-nums whitespace-nowrap`}>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 leading-none ${
                          isDense ? "text-[10px]" : "text-[11px]"
                        } ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : isNegative
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : isNegative ? (
                          <TrendingDown className="w-2.5 h-2.5" />
                        ) : null}
                        <span>
                          {isPositive ? "+" : ""}
                          {stock.percent !== undefined && stock.percent !== null ? `${stock.percent.toFixed(2)}%` : "--"}
                        </span>
                      </span>
                    </td>

                    {/* 9. TRADE */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono text-muted-foreground tabular-nums text-[11px] whitespace-nowrap`}>
                      {stock.trades ? stock.trades.toLocaleString() : "--"}
                    </td>

                    {/* 10. VALUE (mn) */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono font-bold text-foreground tabular-nums text-[11px] whitespace-nowrap`}>
                      {stock.value_mn ? stock.value_mn.toFixed(2) : "--"}
                    </td>

                    {/* 11. VOLUME */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-right font-mono text-muted-foreground tabular-nums text-[11px] whitespace-nowrap`}>
                      {stock.volume ? stock.volume.toLocaleString() : "--"}
                    </td>

                    {/* 12. Market Depth & Row Actions */}
                    <td className={`${isDense ? "py-1 px-2" : "py-2 px-3"} text-center whitespace-nowrap`}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* High-Visibility Market Depth Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewDepth) {
                              onViewDepth(stock.ticker);
                            } else {
                              onOpenChart(stock.ticker);
                            }
                          }}
                          title={`View ${stock.ticker} Live Market Depth (10-Level Order Book)`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 border border-cyan-500/35 text-[10px] font-extrabold shadow-2xs hover:scale-105 active:scale-95 transition-all"
                        >
                          <Layers className="w-3 h-3 text-cyan-500" />
                          <span>Depth</span>
                        </button>

                        {/* Interactive TradingView Chart Button */}
                        <button
                          onClick={() => onOpenChart(stock.ticker)}
                          title={`View ${stock.ticker} TradingView Chart`}
                          className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/25 transition-all hover:scale-105"
                        >
                          <LineChart className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Price Alert Button */}
                        <button
                          onClick={() => onOpenAlert(stock.ticker)}
                          title={`Set WhatsApp Price Alert for ${stock.ticker}`}
                          className="p-1 rounded-md bg-amber-500/10 text-amber-500 hover:bg-amber-500/25 transition-all hover:scale-105"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Compact Pagination Footer */}
      <div className="p-2.5 sm:p-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]">
            Showing {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, stocks.length)} of {stocks.length} stocks
          </span>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-semibold">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 rounded-md border border-border/40 bg-background text-[11px] font-bold text-foreground cursor-pointer focus:outline-none"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={200}>200 / page</option>
              <option value={9999}>All Stocks ({stocks.length})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded-md border border-border/40 hover:bg-muted font-bold disabled:opacity-30 transition-colors text-[11px]"
          >
            Previous
          </button>
          <span className="font-bold px-2 text-foreground font-mono text-[11px]">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded-md border border-border/40 hover:bg-muted font-bold disabled:opacity-30 transition-colors text-[11px]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
