"use client";

import React, { useState } from "react";
import {
  Newspaper,
  Info,
  Layers,
  TrendingUp,
  DollarSign,
  Shield,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import {
  StockTicker,
  StockNewsItem,
  SectorHeatmapData,
  BlockMarketDeal,
  IndexMover,
} from "@/lib/api/stocks";
import { BinanceCompanyOverview } from "./binance-company-overview";

interface BinanceBottomHubProps {
  selectedStock: StockTicker | null;
  news: StockNewsItem[];
  heatmapData: SectorHeatmapData | null;
  blockDeals: BlockMarketDeal[];
  movers: IndexMover[];
  topLists: any;
  onSelectTicker: (ticker: string) => void;
  onOpenAlertModal: (ticker?: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onMouseDownResize?: (e: React.MouseEvent) => void;
}

type BottomTab = "news" | "overview" | "sectors" | "movers" | "block" | "boards";

export function BinanceBottomHub({
  selectedStock,
  news,
  heatmapData,
  blockDeals,
  movers,
  topLists,
  onSelectTicker,
  onOpenAlertModal,
  isCollapsed = false,
  onToggleCollapse,
  onMouseDownResize,
}: BinanceBottomHubProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("news");
  const [newsFilterCurrent, setNewsFilterCurrent] = useState<boolean>(false);
  const [newsSearch, setNewsSearch] = useState<string>("");
  const [moversSubTab, setMoversSubTab] = useState<"overview" | "gainers" | "losers" | "turnover" | "volume" | "index_movers">("overview");

  // Filtered news
  const displayedNews = React.useMemo(() => {
    let list = [...news];
    if (newsFilterCurrent && selectedStock) {
      list = list.filter(
        (n) =>
          n.code === selectedStock.ticker ||
          n.summary.toUpperCase().includes(selectedStock.ticker) ||
          n.body.toUpperCase().includes(selectedStock.ticker)
      );
    }
    if (newsSearch) {
      const q = newsSearch.toUpperCase().trim();
      list = list.filter(
        (n) =>
          n.summary.toUpperCase().includes(q) ||
          n.code.toUpperCase().includes(q) ||
          n.body.toUpperCase().includes(q)
      );
    }
    return list;
  }, [news, newsFilterCurrent, selectedStock, newsSearch]);

  const ltp = selectedStock?.ltp ?? 0;
  const ycp = selectedStock?.ycp ?? ltp;
  const high = selectedStock?.high ?? ltp;
  const low = selectedStock?.low ?? ltp;

  const handleTabClick = (tabId: BottomTab) => {
    setActiveTab(tabId);
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  return (
    <div className="w-full bg-[#181a20] border-t border-[#1e2329] select-none text-xs text-[#848e9c] h-full flex flex-col overflow-hidden">
      {/* ── Hub Navigation Tab Bar (Draggable like VS Code) ────────────────── */}
      <div
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName !== "BUTTON" && !(e.target as HTMLElement).closest("button")) {
            onMouseDownResize?.(e);
          }
        }}
        className="flex items-center justify-between px-2 border-b border-[#1e2329] bg-[#12161c] h-[32px] shrink-0"
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "news", label: "News (PSI)", icon: Newspaper },
            { id: "overview", label: "Company Overview", icon: Info },
            { id: "sectors", label: "19 Sectors", icon: Layers },
            { id: "movers", label: "Movers & Top", icon: TrendingUp },
            { id: "block", label: "Block Market", icon: DollarSign },
            { id: "boards", label: "Boards", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as BottomTab)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  isActive
                    ? "bg-[#2b313a] text-[#f0b90b] shadow-sm"
                    : "text-[#848e9c] hover:text-[#eaecef] hover:bg-[#1e2329]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {selectedStock && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
              <span className="font-mono font-bold text-[#eaecef]">{selectedStock.ticker}</span>
              <span className="px-1 py-0 rounded text-[9px] bg-[#f0b90b]/15 text-[#f0b90b]">
                Cat {selectedStock.category}
              </span>
            </div>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2b313a] text-[#eaecef] hover:text-[#f0b90b] text-[10px] font-bold transition-all"
              title={isCollapsed ? "Expand Hub" : "Collapse Hub"}
            >
              {isCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Active Tab View Panel (Docked Zero-Overflow Container) ─── */}
      {!isCollapsed && (
        <div className="p-2 flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {/* TAB 1: News & PSI Disclosures */}
        {activeTab === "news" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  placeholder="Filter announcements by keyword..."
                  className="bg-[#12161c] border border-[#2b313a] rounded-lg px-3 py-1 text-xs text-[#eaecef] placeholder-[#5e6673] focus:outline-none focus:border-[#f0b90b]"
                />
                {selectedStock && (
                  <button
                    onClick={() => setNewsFilterCurrent(!newsFilterCurrent)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      newsFilterCurrent
                        ? "bg-[#f0b90b] text-black border-[#f0b90b]"
                        : "bg-[#12161c] text-[#848e9c] border-[#2b313a] hover:text-[#eaecef]"
                    }`}
                  >
                    Only {selectedStock.ticker}
                  </button>
                )}
              </div>
              <span className="text-[11px] text-[#848e9c]">
                Showing {displayedNews.length} disclosures via LankaBangla
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto no-scrollbar">
              {displayedNews.length === 0 ? (
                <div className="col-span-full p-8 text-center text-[#848e9c]">
                  No news or corporate announcements match your filter.
                </div>
              ) : (
                displayedNews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectTicker(item.code)}
                    className="p-3 rounded-lg bg-[#12161c] border border-[#2b313a]/60 hover:border-[#f0b90b]/50 transition-all cursor-pointer flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono font-black text-[#f0b90b] text-xs">
                          {item.code}
                        </span>
                        <span className="text-[10px] text-[#848e9c]">{item.date}</span>
                      </div>
                      <p className="text-[11px] text-[#eaecef] line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#848e9c] pt-1 border-t border-[#1e2329]">
                      <span className="text-emerald-400 font-semibold">{item.type}</span>
                      <span className="hover:text-[#f0b90b] flex items-center gap-0.5">
                        <span>Trade Pair</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Company Overview (LankaBangla) */}
        {activeTab === "overview" && (
          <div className="h-full">
            <BinanceCompanyOverview
              stock={selectedStock}
              onSelectTicker={onSelectTicker}
            />
          </div>
        )}

        {/* TAB 3: 19 Sectors Heatmap */}
        {activeTab === "sectors" && (
          <div className="space-y-2.5">
            {/* Header & LankaBangla Color Legend Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-[#12161c] border border-[#2b313a]/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#eaecef]">19 Market Sectors</span>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-[#0ecb81]/15 text-[#0ecb81] font-semibold">
                    ▲ {heatmapData?.adv ?? 0} Adv
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#848e9c]/15 text-[#848e9c] font-semibold">
                    ― {heatmapData?.unch ?? 0} Flat
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#f6465d]/15 text-[#f6465d] font-semibold">
                    ▼ {heatmapData?.dec ?? 0} Dec
                  </span>
                </div>
              </div>

              {/* LankaBangla Direct Color Legend */}
              <div className="flex items-center gap-0.5 text-[9px] font-bold text-white overflow-x-auto no-scrollbar py-0.5">
                <span className="px-1.5 py-0.5 rounded-l text-center" style={{ backgroundColor: "rgba(224, 2, 24, 0.9)" }}>≤ -3.0%</span>
                <span className="px-1.5 py-0.5 text-center" style={{ backgroundColor: "rgba(169, 4, 28, 0.88)" }}>≤ -0.5%</span>
                <span className="px-1.5 py-0.5 text-center" style={{ backgroundColor: "rgba(142, 4, 18, 0.85)" }}>&lt; 0.0%</span>
                <span className="px-1.5 py-0.5 text-center" style={{ backgroundColor: "rgba(55, 65, 81, 0.7)" }}>0.0%</span>
                <span className="px-1.5 py-0.5 text-center" style={{ backgroundColor: "rgba(35, 86, 48, 0.85)" }}>&gt; 0.0%</span>
                <span className="px-1.5 py-0.5 text-center" style={{ backgroundColor: "rgba(40, 121, 61, 0.88)" }}>≥ 0.5%</span>
                <span className="px-1.5 py-0.5 rounded-r text-center" style={{ backgroundColor: "rgba(23, 199, 38, 0.9)" }}>≥ 3.0%</span>
              </div>
            </div>

            {/* 19 Sector Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[340px] overflow-y-auto no-scrollbar">
              {(heatmapData?.sectors || []).map((sec) => {
                const isPos = sec.change_pct > 0;
                const isNeg = sec.change_pct < 0;
                return (
                  <div
                    key={sec.code || sec.name}
                    className="p-2.5 rounded-lg border border-[#2b313a]/60 flex flex-col justify-between transition-all hover:scale-[1.02] hover:border-[#f0b90b]/50 cursor-pointer shadow-sm"
                    style={{ background: sec.bg_color || "#12161c" }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-white text-[11px] truncate block drop-shadow" title={sec.name}>
                        {sec.name}
                      </span>
                      <span
                        className={`font-mono font-black text-[11px] px-1 py-0.2 rounded text-white drop-shadow whitespace-nowrap ${
                          isPos ? "bg-black/40 text-[#49d267]" : isNeg ? "bg-black/40 text-[#ff4d4f]" : "bg-black/30 text-white/90"
                        }`}
                      >
                        {isPos ? "+" : ""}{sec.change_pct.toFixed(2)}%
                      </span>
                    </div>

                    {/* Middle: Advances / Flat / Declines */}
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold mt-2 pt-1 border-t border-white/10 text-white/90 drop-shadow">
                      <span className="text-[#8beb80] flex items-center gap-0.5" title="Advancing stocks">
                        ▲ {sec.price_up ?? 0}
                      </span>
                      <span className="text-white/80 flex items-center gap-0.5" title="Unchanged stocks">
                        ― {sec.price_flat ?? 0}
                      </span>
                      <span className="text-[#ff8080] flex items-center gap-0.5" title="Declining stocks">
                        ▼ {sec.price_down ?? 0}
                      </span>
                    </div>

                    {/* Bottom: Sector Turnover in Mn BDT */}
                    <div className="flex items-center justify-between text-[9.5px] text-white/70 mt-1 font-mono drop-shadow">
                      <span>Turnover:</span>
                      <span className="text-white font-semibold">{sec.turnover ? `${sec.turnover.toFixed(1)}M` : "--"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Index Movers & Top Lists */}
        {activeTab === "movers" && (
          <div className="space-y-2.5">
            {/* Movers Sub-navigation bar */}
            <div className="flex items-center justify-between gap-2 p-1 rounded-lg bg-[#12161c] border border-[#2b313a]/50">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "gainers", label: "Top Gainers (10)" },
                  { id: "losers", label: "Top Losers (10)" },
                  { id: "turnover", label: "Turnover (10)" },
                  { id: "volume", label: "Volume (10)" },
                  { id: "index_movers", label: "Index Movers (DSEX)" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setMoversSubTab(st.id as any)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all ${
                      moversSubTab === st.id
                        ? "bg-[#2b313a] text-[#f0b90b] shadow-sm"
                        : "text-[#848e9c] hover:text-[#eaecef] hover:bg-[#1e2329]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-[#848e9c] font-mono shrink-0 hidden sm:inline">
                Real-Time LankaBangla Feed
              </span>
            </div>

            {/* View A: Overview (4 Columns + Index Movers Row) */}
            {moversSubTab === "overview" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Top 5 Gainers */}
                  <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5 border-b border-[#2b313a]/40 pb-1">
                      <span className="text-xs font-bold text-[#0ecb81] flex items-center gap-1">
                        ▲ Top Gainers
                      </span>
                      <button
                        onClick={() => setMoversSubTab("gainers")}
                        className="text-[10px] text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                      >
                        View 10 →
                      </button>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {(topLists?.top_gainers || []).slice(0, 5).map((s: any) => (
                        <div
                          key={s.ticker}
                          onClick={() => onSelectTicker(s.ticker)}
                          className="flex items-center justify-between p-1 rounded hover:bg-[#1e2329] cursor-pointer"
                        >
                          <span className="font-bold text-[#eaecef]">{s.ticker}</span>
                          <span className="text-[#848e9c]">{s.ltp}</span>
                          <span className="text-[#0ecb81] font-bold">+{s.percent?.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 Losers */}
                  <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5 border-b border-[#2b313a]/40 pb-1">
                      <span className="text-xs font-bold text-[#f6465d] flex items-center gap-1">
                        ▼ Top Losers
                      </span>
                      <button
                        onClick={() => setMoversSubTab("losers")}
                        className="text-[10px] text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                      >
                        View 10 →
                      </button>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {(topLists?.top_losers || []).slice(0, 5).map((s: any) => (
                        <div
                          key={s.ticker}
                          onClick={() => onSelectTicker(s.ticker)}
                          className="flex items-center justify-between p-1 rounded hover:bg-[#1e2329] cursor-pointer"
                        >
                          <span className="font-bold text-[#eaecef]">{s.ticker}</span>
                          <span className="text-[#848e9c]">{s.ltp}</span>
                          <span className="text-[#f6465d] font-bold">{s.percent?.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 Turnover */}
                  <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5 border-b border-[#2b313a]/40 pb-1">
                      <span className="text-xs font-bold text-[#f0b90b] flex items-center gap-1">
                        ⚡ Top Turnover
                      </span>
                      <button
                        onClick={() => setMoversSubTab("turnover")}
                        className="text-[10px] text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                      >
                        View 10 →
                      </button>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {(topLists?.top_turnover || []).slice(0, 5).map((s: any) => (
                        <div
                          key={s.ticker}
                          onClick={() => onSelectTicker(s.ticker)}
                          className="flex items-center justify-between p-1 rounded hover:bg-[#1e2329] cursor-pointer"
                        >
                          <span className="font-bold text-[#eaecef]">{s.ticker}</span>
                          <span className="text-[#f0b90b] font-bold">{s.value_mn ? `${s.value_mn.toFixed(1)}M` : "--"}</span>
                          <span className={s.percent >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"}>
                            {s.percent >= 0 ? "+" : ""}{s.percent?.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 Volume */}
                  <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5 border-b border-[#2b313a]/40 pb-1">
                      <span className="text-xs font-bold text-[#38bdf8] flex items-center gap-1">
                        📊 Top Volume
                      </span>
                      <button
                        onClick={() => setMoversSubTab("volume")}
                        className="text-[10px] text-[#848e9c] hover:text-[#f0b90b] transition-colors"
                      >
                        View 10 →
                      </button>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {(topLists?.top_volume || []).slice(0, 5).map((s: any) => (
                        <div
                          key={s.ticker}
                          onClick={() => onSelectTicker(s.ticker)}
                          className="flex items-center justify-between p-1 rounded hover:bg-[#1e2329] cursor-pointer"
                        >
                          <span className="font-bold text-[#eaecef]">{s.ticker}</span>
                          <span className="text-[#38bdf8]">{s.volume ? `${(s.volume / 1000).toFixed(0)}K` : "--"}</span>
                          <span className={s.percent >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"}>
                            {s.percent >= 0 ? "+" : ""}{s.percent?.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Index Movers Row in Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60">
                    <div className="flex items-center justify-between mb-1.5 border-b border-[#2b313a]/40 pb-1">
                      <span className="text-xs font-bold text-[#0ecb81]">▲ Index Pullers (DSEX +Points)</span>
                      <button
                        onClick={() => setMoversSubTab("index_movers")}
                        className="text-[10px] text-[#848e9c] hover:text-[#f0b90b]"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {(topLists?.index_movers_pos || (movers || []).filter((m: any) => (m.index_mover_points ?? 0) > 0)).slice(0, 5).map((m: any) => (
                        <div
                          key={m.symbol}
                          onClick={() => onSelectTicker(m.symbol)}
                          className="flex items-center justify-between p-1 rounded hover:bg-[#1e2329] cursor-pointer"
                        >
                          <span className="font-bold text-[#eaecef]">{m.symbol}</span>
                          <span className="text-[#848e9c]">LTP {m.ltp}</span>
                          <span className="text-[#0ecb81] font-bold">+{m.index_mover_points?.toFixed(2)} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60">
                    <div className="flex items-center justify-between mb-1.5 border-b border-[#2b313a]/40 pb-1">
                      <span className="text-xs font-bold text-[#f6465d]">▼ Index Draggers (DSEX -Points)</span>
                      <button
                        onClick={() => setMoversSubTab("index_movers")}
                        className="text-[10px] text-[#848e9c] hover:text-[#f0b90b]"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {(topLists?.index_movers_neg || (movers || []).filter((m: any) => (m.index_mover_points ?? 0) < 0)).slice(0, 5).map((m: any) => (
                        <div
                          key={m.symbol}
                          onClick={() => onSelectTicker(m.symbol)}
                          className="flex items-center justify-between p-1 rounded hover:bg-[#1e2329] cursor-pointer"
                        >
                          <span className="font-bold text-[#eaecef]">{m.symbol}</span>
                          <span className="text-[#848e9c]">LTP {m.ltp}</span>
                          <span className="text-[#f6465d] font-bold">{m.index_mover_points?.toFixed(2)} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View B: Full Table for Gainers, Losers, Turnover, Volume, or Index Movers */}
            {moversSubTab !== "overview" && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-semibold text-[#848e9c] border-b border-[#2b313a] bg-[#12161c]">
                  <span className="col-span-4 text-left">Stock / Company</span>
                  <span className="col-span-2 text-right">LTP</span>
                  <span className="col-span-2 text-right">{moversSubTab === "index_movers" ? "Impact (Pts)" : "Change %"}</span>
                  <span className="col-span-2 text-right">Value (Mn)</span>
                  <span className="col-span-2 text-right">Volume</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#1e2329]/40 no-scrollbar font-mono text-[11px]">
                  {(
                    moversSubTab === "gainers" ? (topLists?.top_gainers || []) :
                    moversSubTab === "losers" ? (topLists?.top_losers || []) :
                    moversSubTab === "turnover" ? (topLists?.top_turnover || []) :
                    moversSubTab === "volume" ? (topLists?.top_volume || []) :
                    (movers || [])
                  ).map((s: any, idx: number) => {
                    const isPos = (s.percent ?? s.change_percent ?? 0) >= 0;
                    const pts = s.index_mover_points;
                    return (
                      <div
                        key={s.ticker || s.symbol || idx}
                        onClick={() => onSelectTicker(s.ticker || s.symbol)}
                        className="grid grid-cols-12 px-3 py-1.5 hover:bg-[#1e2329] cursor-pointer transition-colors items-center"
                      >
                        <div className="col-span-4 flex flex-col min-w-0">
                          <span className="font-bold text-[#eaecef]">{s.ticker || s.symbol}</span>
                          <span className="text-[10px] text-[#848e9c] truncate">{s.name || s.company_name}</span>
                        </div>
                        <span className="col-span-2 text-right text-[#eaecef] font-bold">
                          {s.ltp?.toFixed(2) ?? "--"}
                        </span>
                        <span className={`col-span-2 text-right font-bold ${
                          moversSubTab === "index_movers"
                            ? (pts >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]")
                            : (isPos ? "text-[#0ecb81]" : "text-[#f6465d]")
                        }`}>
                          {moversSubTab === "index_movers"
                            ? `${pts >= 0 ? "+" : ""}${pts?.toFixed(2)} pts`
                            : `${isPos ? "+" : ""}${(s.percent ?? s.change_percent)?.toFixed(2)}%`}
                        </span>
                        <span className="col-span-2 text-right text-[#f0b90b]">
                          {s.value_mn ? `${s.value_mn.toFixed(2)}M` : "--"}
                        </span>
                        <span className="col-span-2 text-right text-[#848e9c]">
                          {s.volume ? s.volume.toLocaleString() : "--"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Block Market Deals */}
        {activeTab === "block" && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-semibold text-[#848e9c] border-b border-[#2b313a] bg-[#12161c]">
              <span className="col-span-3 text-left">Symbol & Company</span>
              <span className="col-span-2 text-right">Max Price</span>
              <span className="col-span-2 text-right">Min Price</span>
              <span className="col-span-2 text-right">Quantity</span>
              <span className="col-span-2 text-right">Value (MN)</span>
              <span className="col-span-1 text-right">Exch</span>
            </div>
            <div className="max-h-[250px] overflow-y-auto divide-y divide-[#1e2329]/40 no-scrollbar font-mono text-[11px]">
              {blockDeals.length === 0 ? (
                <div className="p-8 text-center text-[#848e9c]">
                  No block market transactions recorded for today yet.
                </div>
              ) : (
                blockDeals.map((deal, idx) => (
                  <div
                    key={`bm_${idx}`}
                    onClick={() => onSelectTicker(deal.symbol)}
                    className="grid grid-cols-12 px-3 py-1.5 items-center hover:bg-[#1e2329] cursor-pointer"
                  >
                    <div className="col-span-3">
                      <span className="font-bold text-[#f0b90b] block">{deal.symbol}</span>
                      <span className="text-[10px] text-[#848e9c] truncate block">
                        {deal.company_name}
                      </span>
                    </div>
                    <span className="col-span-2 text-right text-[#eaecef]">{deal.max_price}</span>
                    <span className="col-span-2 text-right text-[#848e9c]">{deal.min_price}</span>
                    <span className="col-span-2 text-right text-[#eaecef]">
                      {deal.quantity?.toLocaleString()}
                    </span>
                    <span className="col-span-2 text-right font-bold text-emerald-400">
                      {deal.value_mn?.toFixed(3)}M
                    </span>
                    <span className="col-span-1 text-right text-[#848e9c] text-[10px]">
                      {deal.exchange}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: DSE & CSE Board Directory */}
        {activeTab === "boards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 space-y-1.5">
              <span className="font-bold text-emerald-400 text-xs block">1. Main Board</span>
              <p className="text-[11px] text-[#848e9c] leading-relaxed">
                Large-cap, mid-cap, and mature public equities. Categories: A (30%+ dividend, regular AGM), B (sub-30% dividend), N (New listing), Z (Non-compliant/loss-making).
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 space-y-1.5">
              <span className="font-bold text-[#f0b90b] text-xs block">2. SME Board</span>
              <p className="text-[11px] text-[#848e9c] leading-relaxed">
                Small and Medium Enterprises board designed for growth companies. Eligible for qualified investors with reduced capital thresholds.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 space-y-1.5">
              <span className="font-bold text-cyan-400 text-xs block">3. Debt & Bond Market</span>
              <p className="text-[11px] text-[#848e9c] leading-relaxed">
                Government Treasury Bonds (G-Sec, 2Y to 20Y tenor), Corporate Sukuk, debentures, and commercial paper instruments.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#12161c] border border-[#2b313a]/60 space-y-1.5">
              <span className="font-bold text-purple-400 text-xs block">4. Alternative Trading (ATB)</span>
              <p className="text-[11px] text-[#848e9c] leading-relaxed">
                Platform for non-listed companies, unlisted debt securities, and open-end mutual funds to facilitate secondary market transfers.
              </p>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
