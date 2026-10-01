"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  TrendingUp,
  Bell,
  RefreshCw,
  BarChart2,
  LineChart,
  DollarSign,
  AlertOctagon,
  Calculator,
  Calendar,
  Globe,
  Newspaper,
  LayoutGrid,
} from "lucide-react";
import { StockTicker, MarketSummary, StockNewsItem, stocksApi } from "@/lib/api/stocks";
import { LiveTickerTape } from "@/components/stocks/live-ticker-tape";
import { MarketSummaryBar } from "@/components/stocks/market-summary-bar";
import { SectorHeatmap } from "@/components/stocks/sector-heatmap";
import { MarketWatchTable } from "@/components/stocks/market-watch-table";
import { StockChartModal } from "@/components/stocks/stock-chart-modal";
import { StockAlertModal } from "@/components/stocks/stock-alert-modal";
import { MarketDepthView } from "@/components/stocks/market-depth-view";
import { TopSharesView } from "@/components/stocks/top-shares-view";
import { CircuitBreakerView } from "@/components/stocks/circuit-breaker-view";
import { RecentMarketInfoView } from "@/components/stocks/recent-market-info-view";
import { PERatioView } from "@/components/stocks/pe-ratio-view";
import { AtAGlanceView } from "@/components/stocks/at-a-glance-view";
import { AllNewsView } from "@/components/stocks/all-news-view";

type NavTab = "watch" | "depth" | "top" | "circuit" | "pe" | "recent" | "at-a-glance" | "news";

export default function StockMarketPage() {
  const [activeTab, setActiveTab] = useState<NavTab>("watch");
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [news, setNews] = useState<StockNewsItem[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [flashingTickers, setFlashingTickers] = useState<Record<string, "up" | "down">>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBoard, setSelectedBoard] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("turnover");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals
  const [activeChartTicker, setActiveChartTicker] = useState<string | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState<boolean>(false);
  const [alertInitialTicker, setAlertInitialTicker] = useState<string | undefined>(undefined);
  const [depthTargetInstrument, setDepthTargetInstrument] = useState<string>("IPDC");

  const eventSourceRef = useRef<EventSource | null>(null);
  const flashTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef<number>(1000);

  // Initial REST fetch
  const fetchInitialData = async () => {
    try {
      const [sumRes, stocksRes, newsRes] = await Promise.all([
        stocksApi.getSummary(),
        stocksApi.getAll(),
        stocksApi.getNews(undefined, 25),
      ]);
      setMarketSummary(sumRes.data);
      setStocks(stocksRes.data.stocks || []);
      setNews(newsRes.data.news || []);
    } catch (e) {
      console.error("Initial stock data fetch failed:", e);
    }
  };

  // SSE stream with auto-reconnect (exponential backoff)
  useEffect(() => {
    fetchInitialData();

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(stocksApi.getStreamUrl());
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = 1000; // reset backoff on successful connect
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Exponential backoff: 1s → 2s → 4s → max 15s
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, 15000);
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      es.addEventListener("init", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.market_summary) setMarketSummary({ summary: payload.market_summary, is_trading_hour: true, total_tracked: payload.tickers_count });
          if (payload.tickers) setStocks(payload.tickers);
          if (payload.recent_news) setNews(payload.recent_news);
        } catch (err) {
          console.error("SSE init parse error:", err);
        }
      });

      // Live DSEX/DS30/DSES index updates — fires whenever backend detects a change
      es.addEventListener("market_update", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.market_summary) {
            setMarketSummary((prev) => ({
              ...(prev ?? {}),
              summary: payload.market_summary,
              is_trading_hour: true,
            } as any));
          }
        } catch (err) {
          console.error("SSE market_update parse error:", err);
        }
      });

      es.addEventListener("tick_diff", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const diffs = payload.ticks || [];
          if (!diffs.length) return;

          const newFlashes: Record<string, "up" | "down"> = {};

          setStocks((prevStocks) => {
            const map = new Map(prevStocks.map((s) => [s.ticker, s]));
            diffs.forEach((d: any) => {
              const existing = map.get(d.ticker);
              if (existing) {
                map.set(d.ticker, {
                  ...existing,
                  ltp: d.ltp,
                  change: d.change,
                  percent: d.percent,
                  volume: d.volume,
                  value_mn: d.value_mn,
                  high: d.high,
                  low: d.low,
                  trades: d.trades,
                  direction: d.direction,
                });
              }
              newFlashes[d.ticker] = d.direction === "up" ? "up" : "down";
            });
            return Array.from(map.values());
          });

          setFlashingTickers((prev) => ({ ...prev, ...newFlashes }));

          Object.keys(newFlashes).forEach((code) => {
            if (flashTimersRef.current[code]) clearTimeout(flashTimersRef.current[code]);
            flashTimersRef.current[code] = setTimeout(() => {
              setFlashingTickers((prev) => {
                const updated = { ...prev };
                delete updated[code];
                return updated;
              });
            }, 750);
          });
        } catch (err) {
          console.error("SSE tick_diff parse error:", err);
        }
      });
    };

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
      eventSourceRef.current = null;
      Object.values(flashTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  // Filtered & Sorted Stocks for Market Watch
  const filteredStocks = useMemo(() => {
    let list = [...stocks];

    if (searchQuery) {
      const q = searchQuery.toUpperCase().trim();
      list = list.filter(
        (s) =>
          s.ticker.includes(q) ||
          s.sector?.toUpperCase().includes(q) ||
          ((s as any).name && (s as any).name.toUpperCase().includes(q))
      );
    }

    if (selectedCategory && selectedCategory !== "ALL") {
      list = list.filter((s) => s.category?.toUpperCase() === selectedCategory.toUpperCase());
    }

    if (selectedBoard && selectedBoard !== "ALL") {
      const bUpper = selectedBoard.toUpperCase();
      if (bUpper === "DEBT") {
        list = list.filter((s) => s.board?.toUpperCase() === "DEBT" || s.asset_type?.toUpperCase() === "CB");
      } else if (bUpper === "YIELDDBT" || bUpper === "G-SEC") {
        list = list.filter((s) => s.board?.toUpperCase() === "YIELDDBT" || s.asset_type?.toUpperCase() === "GOVDBT");
      } else {
        list = list.filter((s) => s.board?.toUpperCase() === bUpper);
      }
    }

    if (selectedSector) {
      const qSec = selectedSector.toLowerCase();
      list = list.filter((s) => {
        const sec = (s.sector || "").toLowerCase();
        return sec === qSec || sec.includes(qSec) || qSec.includes(sec);
      });
    }

    const isReverse = sortOrder === "desc";
    list.sort((a, b) => {
      if (sortBy === "turnover" || sortBy === "value_mn") return isReverse ? (b.value_mn || 0) - (a.value_mn || 0) : (a.value_mn || 0) - (b.value_mn || 0);
      if (sortBy === "percent") return isReverse ? (b.percent || 0) - (a.percent || 0) : (a.percent || 0) - (b.percent || 0);
      if (sortBy === "change") return isReverse ? (b.change || 0) - (a.change || 0) : (a.change || 0) - (b.change || 0);
      if (sortBy === "ltp") return isReverse ? (b.ltp || 0) - (a.ltp || 0) : (a.ltp || 0) - (b.ltp || 0);
      if (sortBy === "high") return isReverse ? (b.high || 0) - (a.high || 0) : (a.high || 0) - (b.high || 0);
      if (sortBy === "low") return isReverse ? (b.low || 0) - (a.low || 0) : (a.low || 0) - (b.low || 0);
      if (sortBy === "close") return isReverse ? (b.close || 0) - (a.close || 0) : (a.close || 0) - (b.close || 0);
      if (sortBy === "ycp") return isReverse ? (b.ycp || 0) - (a.ycp || 0) : (a.ycp || 0) - (b.ycp || 0);
      if (sortBy === "trades" || sortBy === "trade") return isReverse ? (b.trades || 0) - (a.trades || 0) : (a.trades || 0) - (b.trades || 0);
      if (sortBy === "volume") return isReverse ? (b.volume || 0) - (a.volume || 0) : (a.volume || 0) - (b.volume || 0);
      if (sortBy === "code") return isReverse ? b.ticker.localeCompare(a.ticker) : a.ticker.localeCompare(b.ticker);
      return 0;
    });

    return list;
  }, [stocks, searchQuery, selectedCategory, selectedBoard, selectedSector, sortBy, sortOrder]);

  const handleSortChange = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  const handleOpenAlert = (ticker?: string) => {
    setAlertInitialTicker(ticker);
    setAlertModalOpen(true);
  };

  const handleViewDepth = (ticker: string) => {
    setDepthTargetInstrument(ticker);
    setActiveTab("depth");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Live Continuous Marquee Ticker Tape at the Top */}
      <div className="-mx-6 -mt-6 lg:-mx-10 lg:-mt-6">
        <LiveTickerTape
          stocks={stocks}
          onSelectTicker={(ticker) => {
            setActiveChartTicker(ticker);
          }}
        />
      </div>

      {/* 2. Top Header & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-primary" />
              <span>DSE Stock Market Live</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold text-xs border border-emerald-500/20">
              REAL-TIME
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dhaka Stock Exchange live quotes, TradingView charts, market depth order books, circuit limits, and automated WhatsApp alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenAlert()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span>Setup WhatsApp Alerts</span>
          </button>

          <button
            onClick={fetchInitialData}
            title="Refresh snapshot"
            className="p-2.5 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Market Summary Indices Bar (Always visible) */}
      <MarketSummaryBar summary={marketSummary} isConnected={isConnected} onRefresh={fetchInitialData} />

      {/* 4. Navigation Tabs for Deep Market Analysis */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-md shadow-sm">
        {[
          { id: "watch", label: "Market Watch", icon: BarChart2 },
          { id: "depth", label: "Market Depth", icon: LineChart },
          { id: "top", label: "Top Shares", icon: DollarSign },
          { id: "circuit", label: "Circuit Breakers", icon: AlertOctagon },
          { id: "pe", label: "P/E Ratio", icon: Calculator },
          { id: "recent", label: "Recent Market Info", icon: Calendar },
          { id: "at-a-glance", label: "At a Glance", icon: Globe },
          { id: "news", label: "News & PSI", icon: Newspaper },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NavTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground hover:scale-[1.02]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Active Tab Content Views */}
      {activeTab === "watch" && (
        <div className="space-y-6">
          <SectorHeatmap
            selectedSector={selectedSector}
            onSelectSector={(s) => setSelectedSector(s)}
          />

          <MarketWatchTable
            stocks={filteredStocks}
            flashingTickers={flashingTickers}
            onOpenChart={(t) => setActiveChartTicker(t)}
            onOpenAlert={(t) => handleOpenAlert(t)}
            onViewDepth={(t) => handleViewDepth(t)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBoard={selectedBoard}
            onBoardChange={setSelectedBoard}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
      )}

      {activeTab === "depth" && (
        <MarketDepthView
          initialInstrument={depthTargetInstrument}
          allStocks={stocks}
          onOpenChart={(t) => setActiveChartTicker(t)}
          onOpenAlert={(t) => handleOpenAlert(t)}
        />
      )}

      {activeTab === "top" && (
        <TopSharesView
          onOpenChart={(t) => setActiveChartTicker(t)}
          onOpenAlert={(t) => handleOpenAlert(t)}
          onViewDepth={(t) => handleViewDepth(t)}
        />
      )}

      {activeTab === "circuit" && (
        <CircuitBreakerView
          onOpenChart={(t) => setActiveChartTicker(t)}
          onOpenAlert={(t) => handleOpenAlert(t)}
        />
      )}

      {activeTab === "pe" && (
        <PERatioView
          onOpenChart={(t) => setActiveChartTicker(t)}
          onOpenAlert={(t) => handleOpenAlert(t)}
        />
      )}

      {activeTab === "recent" && <RecentMarketInfoView />}

      {activeTab === "at-a-glance" && <AtAGlanceView />}

      {activeTab === "news" && (
        <AllNewsView onOpenChart={(t) => setActiveChartTicker(t)} />
      )}

      {/* 7. TradingView Chart Modal */}
      {activeChartTicker && (
        <StockChartModal
          ticker={activeChartTicker}
          onClose={() => setActiveChartTicker(null)}
          onOpenAlertModal={(t) => handleOpenAlert(t)}
        />
      )}

      {/* 8. WhatsApp Stock Alert Modal */}
      {alertModalOpen && (
        <StockAlertModal
          initialTicker={alertInitialTicker}
          allStocks={stocks}
          onClose={() => setAlertModalOpen(false)}
        />
      )}
    </div>
  );
}
