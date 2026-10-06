"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Star,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { StockTicker } from "@/lib/api/stocks";

interface BinanceWatchlistProps {
  stocks: StockTicker[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  flashingTickers: Record<string, "up" | "down">;
}

export function BinanceWatchlist({
  stocks,
  selectedTicker,
  onSelectTicker,
  flashingTickers,
}: BinanceWatchlistProps) {
  const [search, setSearch] = useState<string>("");
  const [activeBoard, setActiveBoard] = useState<string>("ALL");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("dse_fav_stocks");
      return saved ? new Set(JSON.parse(saved)) : new Set(["GP", "SQURPHARMA", "BATBC", "BRACBANK"]);
    } catch {
      return new Set(["GP", "SQURPHARMA", "BATBC", "BRACBANK"]);
    }
  });

  const [sortBy, setSortBy] = useState<string>("turnover");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Toggle favorite
  const toggleFavorite = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      try {
        localStorage.setItem("dse_fav_stocks", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Extract unique sectors
  const sectors = useMemo(() => {
    const s = new Set<string>();
    stocks.forEach((st) => {
      if (st.sector) s.add(st.sector);
    });
    return Array.from(s).sort();
  }, [stocks]);

  // Filtered & Sorted Stocks
  const filteredStocks = useMemo(() => {
    let list = [...stocks];

    if (favoritesOnly) {
      list = list.filter((s) => favorites.has(s.ticker));
    }

    if (search) {
      const q = search.toUpperCase().trim();
      list = list.filter(
        (s) =>
          s.ticker.includes(q) ||
          ((s as any).name && (s as any).name.toUpperCase().includes(q)) ||
          s.sector?.toUpperCase().includes(q)
      );
    }

    if (activeBoard !== "ALL") {
      const bUpper = activeBoard.toUpperCase();
      if (bUpper === "DEBT") {
        list = list.filter(
          (s) => s.board?.toUpperCase() === "DEBT" || s.asset_type?.toUpperCase() === "CB" || s.ticker.includes("BOND")
        );
      } else if (bUpper === "SME") {
        list = list.filter((s) => s.board?.toUpperCase() === "SME");
      } else {
        list = list.filter((s) => s.board?.toUpperCase() === bUpper);
      }
    }

    if (activeCategory !== "ALL") {
      list = list.filter((s) => s.category?.toUpperCase() === activeCategory.toUpperCase());
    }

    if (selectedSector) {
      const sq = selectedSector.toLowerCase();
      list = list.filter((s) => s.sector?.toLowerCase() === sq);
    }

    const isReverse = sortOrder === "desc";
    list.sort((a, b) => {
      if (sortBy === "turnover") {
        return isReverse ? (b.value_mn || 0) - (a.value_mn || 0) : (a.value_mn || 0) - (b.value_mn || 0);
      }
      if (sortBy === "percent") {
        return isReverse ? (b.percent || 0) - (a.percent || 0) : (a.percent || 0) - (b.percent || 0);
      }
      if (sortBy === "ltp") {
        return isReverse ? (b.ltp || 0) - (a.ltp || 0) : (a.ltp || 0) - (b.ltp || 0);
      }
      if (sortBy === "volume") {
        return isReverse ? (b.volume || 0) - (a.volume || 0) : (a.volume || 0) - (b.volume || 0);
      }
      if (sortBy === "symbol") {
        return isReverse ? b.ticker.localeCompare(a.ticker) : a.ticker.localeCompare(b.ticker);
      }
      return 0;
    });

    return list;
  }, [stocks, search, activeBoard, activeCategory, selectedSector, favoritesOnly, favorites, sortBy, sortOrder]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeBoard, activeCategory, selectedSector, favoritesOnly, sortBy, sortOrder, pageSize]);

  // Auto-jump to the page containing selectedTicker so the active stock is always in the visible slice
  useEffect(() => {
    if (!selectedTicker) return;
    const index = filteredStocks.findIndex((s) => s.ticker === selectedTicker);
    if (index >= 0) {
      const targetPage = Math.floor(index / pageSize) + 1;
      setCurrentPage(targetPage);
    }
  }, [selectedTicker, filteredStocks, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Paginated slice of stocks (defaults to 25 per page)
  const paginatedStocks = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredStocks.slice(startIndex, startIndex + pageSize);
  }, [filteredStocks, safeCurrentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181a20] border-r border-[#1e2329] select-none text-xs overflow-hidden">
      {/* ── Compact Filter Controls Bar ────────────────────────── */}
      <div className="p-1.5 border-b border-[#1e2329] bg-[#12161c] space-y-1 shrink-0">
        {/* Row 1: Search + Board Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3 h-3 absolute left-2 text-[#848e9c]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker..."
              className="w-full bg-[#181a20] border border-[#2b313a] rounded px-6 py-0.5 text-[11px] text-[#eaecef] placeholder-[#5e6673] focus:outline-none focus:border-[#f0b90b] transition-all h-[24px]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-1.5 text-[#848e9c] hover:text-[#eaecef] text-[10px] font-bold"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`p-1 rounded transition-all shrink-0 h-[24px] w-[24px] flex items-center justify-center ${
              favoritesOnly ? "text-[#f0b90b] bg-[#f0b90b]/15" : "text-[#848e9c] hover:text-[#eaecef] bg-[#181a20] border border-[#2b313a]"
            }`}
            title="Favorites"
          >
            <Star className={`w-3 h-3 ${favoritesOnly ? "fill-[#f0b90b]" : ""}`} />
          </button>

          {["ALL", "MAIN", "SME", "DEBT"].map((b) => (
            <button
              key={b}
              onClick={() => setActiveBoard(b)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all shrink-0 h-[24px] ${
                activeBoard === b
                  ? "bg-[#2b313a] text-[#f0b90b] font-black border border-[#f0b90b]/30"
                  : "text-[#848e9c] hover:text-[#eaecef] bg-[#181a20] border border-[#2b313a]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Row 2: Category Filters + Sector Dropdown */}
        <div className="flex items-center justify-between gap-1 text-[10px] text-[#848e9c]">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#5e6673] font-mono">CAT:</span>
            {["ALL", "A", "B", "Z"].map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-1 rounded text-[9px] font-bold transition-all ${
                  activeCategory === c
                    ? "bg-[#f0b90b] text-black font-black"
                    : "text-[#848e9c] hover:text-[#eaecef] bg-[#181a20]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-[#5e6673]">{filteredStocks.length}P</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-[#181a20] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] rounded px-1 py-0 text-[9px] focus:outline-none max-w-[105px] truncate h-[20px]"
            >
              <option value="">All Sectors</option>
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table Headers (Sortable) ─────────────────────────── */}
      <div className="grid grid-cols-12 px-2 py-1 text-[10px] font-semibold text-[#848e9c] border-b border-[#1e2329] bg-[#12161c] shrink-0">
        <button
          onClick={() => handleSort("symbol")}
          className="col-span-5 text-left flex items-center gap-1 hover:text-[#eaecef]"
        >
          <span>Symbol</span>
          {sortBy === "symbol" && <ArrowUpDown className="w-2.5 h-2.5 text-[#f0b90b]" />}
        </button>

        <button
          onClick={() => handleSort("ltp")}
          className="col-span-3 text-right flex items-center justify-end gap-1 hover:text-[#eaecef]"
        >
          <span>LTP</span>
          {sortBy === "ltp" && <ArrowUpDown className="w-2.5 h-2.5 text-[#f0b90b]" />}
        </button>

        <button
          onClick={() => handleSort("percent")}
          className="col-span-4 text-right flex items-center justify-end gap-1 hover:text-[#eaecef]"
        >
          <span>24h Chg%</span>
          {sortBy === "percent" && <ArrowUpDown className="w-2.5 h-2.5 text-[#f0b90b]" />}
        </button>
      </div>

      {/* ── High-Density Single-Line Rows (Zero Scrolling for 25 Stocks) ─ */}
      <div className="flex-1 overflow-hidden divide-y divide-[#1e2329]/25 select-none">
        {paginatedStocks.length === 0 ? (
          <div className="p-4 text-center text-[#848e9c] text-xs">
            No stock pairs found.
          </div>
        ) : (
          paginatedStocks.map((stock) => {
            const isSelected = stock.ticker === selectedTicker;
            const flash = flashingTickers[stock.ticker];
            const isPos = (stock.change ?? 0) >= 0;
            const isFav = favorites.has(stock.ticker);

            return (
              <div
                key={stock.ticker}
                onClick={() => onSelectTicker(stock.ticker)}
                className={`grid grid-cols-12 items-center px-2 py-0 h-[22px] min-h-[22px] cursor-pointer transition-all border-l-2 ${
                  isSelected
                    ? "bg-[#2b313a]/75 border-l-[#f0b90b]"
                    : "border-l-transparent hover:bg-[#1e2329]/80"
                } ${
                  flash === "up"
                    ? "bg-[#0ecb81]/25"
                    : flash === "down"
                    ? "bg-[#f6465d]/25"
                    : ""
                }`}
                title={`${stock.ticker} | LTP: BDT ${stock.ltp.toFixed(2)} (${isPos ? "+" : ""}${stock.percent.toFixed(2)}%) | Turnover: ${stock.value_mn ? `${stock.value_mn.toFixed(1)}M` : `${stock.volume || 0} shares`} | Sector: ${stock.sector || "General"}`}
              >
                {/* Col 1: Star + Symbol + Category (Single Line) */}
                <div className="col-span-5 flex items-center gap-1 min-w-0">
                  <button
                    onClick={(e) => toggleFavorite(stock.ticker, e)}
                    className="text-[#5e6673] hover:text-[#f0b90b] transition-colors shrink-0 p-0"
                  >
                    <Star
                      className={`w-2.5 h-2.5 ${isFav ? "fill-[#f0b90b] text-[#f0b90b]" : ""}`}
                    />
                  </button>
                  <span className="font-mono font-bold text-[#eaecef] text-[11px] truncate leading-none">
                    {stock.ticker}
                  </span>
                  <span className="text-[8px] px-1 py-0 rounded bg-[#2b313a] text-[#848e9c] font-semibold leading-none shrink-0">
                    {stock.category || "A"}
                  </span>
                </div>

                {/* Col 2: LTP Price */}
                <div className="col-span-3 text-right font-mono font-bold text-[11px] text-[#eaecef] leading-none">
                  {stock.ltp.toFixed(1)}
                </div>

                {/* Col 3: Change % */}
                <div className="col-span-4 text-right leading-none">
                  <span
                    className={`inline-block px-1 py-0.5 rounded text-[10px] font-mono font-bold leading-none ${
                      isPos
                        ? "bg-[#0ecb81]/15 text-[#0ecb81]"
                        : "bg-[#f6465d]/15 text-[#f6465d]"
                    }`}
                  >
                    {isPos ? "+" : ""}
                    {stock.percent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Binance Pro Pagination Footer (Zero Scroll Workstation) ─ */}
      <div className="flex items-center justify-between px-2 py-1 border-t border-[#1e2329] bg-[#12161c] text-[10px] text-[#848e9c] shrink-0 h-[28px]">
        {/* Count summary & Row size selector */}
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-[#eaecef] font-bold">
            {filteredStocks.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}-
            {Math.min(safeCurrentPage * pageSize, filteredStocks.length)}
          </span>
          <span className="text-[#5e6673]">/</span>
          <span className="text-[#848e9c]">{filteredStocks.length}</span>

          <div className="h-2.5 w-px bg-[#2b313a] mx-0.5" />

          {/* Row size pills: 15, 20, 25 (default 25) */}
          <div className="flex items-center gap-0.5">
            {[15, 20, 25].map((sz) => (
              <button
                key={sz}
                onClick={() => setPageSize(sz)}
                className={`px-1 py-0 rounded text-[9px] font-mono font-bold transition-all ${
                  pageSize === sz
                    ? "bg-[#f0b90b] text-black"
                    : "text-[#5e6673] hover:text-[#eaecef]"
                }`}
                title={`Show ${sz} stocks per page`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage <= 1}
            className="p-0.5 rounded bg-[#181a20] hover:bg-[#2b313a] disabled:opacity-25 disabled:cursor-not-allowed text-[#eaecef] transition-all"
            title="First Page"
          >
            <ChevronsLeft className="w-3 h-3" />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="p-0.5 rounded bg-[#181a20] hover:bg-[#2b313a] disabled:opacity-25 disabled:cursor-not-allowed text-[#eaecef] transition-all"
            title="Previous Page"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          {/* Page Indicator Pill */}
          <div className="px-1.5 py-0.5 rounded bg-[#2b313a] text-[#f0b90b] font-mono font-bold text-[9px]">
            {safeCurrentPage}/{totalPages}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="p-0.5 rounded bg-[#181a20] hover:bg-[#2b313a] disabled:opacity-25 disabled:cursor-not-allowed text-[#eaecef] transition-all"
            title="Next Page"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage >= totalPages}
            className="p-0.5 rounded bg-[#181a20] hover:bg-[#2b313a] disabled:opacity-25 disabled:cursor-not-allowed text-[#eaecef] transition-all"
            title={`Last Page (${totalPages})`}
          >
            <ChevronsRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
