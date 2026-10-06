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
}: BinanceBottomHubProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("news");
  const [newsFilterCurrent, setNewsFilterCurrent] = useState<boolean>(false);
  const [newsSearch, setNewsSearch] = useState<string>("");

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
      {/* ── Hub Navigation Tab Bar ────────────────────────────── */}
      <div className="flex items-center justify-between px-2 border-b border-[#1e2329] bg-[#12161c] h-[32px] shrink-0">
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
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {(heatmapData?.sectors || []).map((sec) => {
                const isPos = sec.change_pct >= 0;
                return (
                  <div
                    key={sec.code}
                    className="p-3 rounded-lg border border-[#2b313a] flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer"
                    style={{ backgroundColor: sec.bg_color || "#12161c" }}
                  >
                    <div>
                      <span className="font-bold text-white text-xs truncate block drop-shadow">
                        {sec.name}
                      </span>
                      <span className="text-[10px] text-white/80 block mt-0.5 drop-shadow">
                        Turnover: {sec.turnover ? `${sec.turnover.toFixed(1)}M` : "--"}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-black text-xs mt-2 self-end px-1.5 py-0.5 rounded text-white drop-shadow ${
                        isPos ? "bg-black/30" : "bg-black/40"
                      }`}
                    >
                      {isPos ? "+" : ""}
                      {sec.change_pct.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Index Movers & Top Lists */}
        {activeTab === "movers" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Top Gainers */}
              <div className="p-3 rounded-lg bg-[#12161c] border border-[#2b313a]/60">
                <span className="text-xs font-bold text-[#0ecb81] block mb-2">
                  Top 5 Gainers
                </span>
                <div className="space-y-1.5 font-mono text-[11px]">
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

              {/* Top Losers */}
              <div className="p-3 rounded-lg bg-[#12161c] border border-[#2b313a]/60">
                <span className="text-xs font-bold text-[#f6465d] block mb-2">
                  Top 5 Losers
                </span>
                <div className="space-y-1.5 font-mono text-[11px]">
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

              {/* Top Turnover */}
              <div className="p-3 rounded-lg bg-[#12161c] border border-[#2b313a]/60">
                <span className="text-xs font-bold text-[#f0b90b] block mb-2">
                  Top Turnover Leaders
                </span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {(topLists?.top_turnover || []).slice(0, 5).map((s: any) => (
                    <div
                      key={s.ticker}
                      onClick={() => onSelectTicker(s.ticker)}
                      className="flex items-center justify-between p-1 rounded hover:bg-[#1e2329] cursor-pointer"
                    >
                      <span className="font-bold text-[#eaecef]">{s.ticker}</span>
                      <span className="text-[#f0b90b] font-bold">
                        {s.value_mn ? `${s.value_mn.toFixed(1)}M` : "--"}
                      </span>
                      <span className={s.percent >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"}>
                        {s.percent >= 0 ? "+" : ""}{s.percent?.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
