"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Bell,
  RefreshCw,
  BarChart2,
  DollarSign,
  Globe,
  Layers,
} from "lucide-react";
import {
  StockTicker,
  MarketSummary,
  StockNewsItem,
  MarketDepthData,
  BlockMarketDeal,
  IndexMover,
  SectorHeatmapData,
  stocksApi,
} from "@/lib/api/stocks";
import { BinanceTradingHeader } from "@/components/stocks/binance-trading-header";
import { BinanceWatchlist } from "@/components/stocks/binance-watchlist";
import { BinanceChartPanel } from "@/components/stocks/binance-chart-panel";
import { BinanceOrderBook } from "@/components/stocks/binance-order-book";
import { BinanceBottomHub } from "@/components/stocks/binance-bottom-hub";
import { StockAlertModal } from "@/components/stocks/stock-alert-modal";
import { LiveTickerTape } from "@/components/stocks/live-ticker-tape";

export default function StockMarketPage() {
  // Exchange and Active Pair State
  const [activeExchange, setActiveExchange] = useState<"DSE" | "CSE">("DSE");
  const [selectedTicker, setSelectedTicker] = useState<string>("GP");

  // Market Datasets
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [sectorHeatmap, setSectorHeatmap] = useState<SectorHeatmapData | null>(null);
  const [news, setNews] = useState<StockNewsItem[]>([]);
  const [blockDeals, setBlockDeals] = useState<BlockMarketDeal[]>([]);
  const [movers, setMovers] = useState<IndexMover[]>([]);
  const [topLists, setTopLists] = useState<any>(null);

  // Real-time Market Depth & Live Trades Feed
  const [depth, setDepth] = useState<MarketDepthData | null>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [depthLoading, setDepthLoading] = useState<boolean>(false);

  // Connectivity and Ticker Flashes
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [wsPing, setWsPing] = useState<number | undefined>(undefined);
  const [serverCycle, setServerCycle] = useState<number | undefined>(undefined);
  const [flashingTickers, setFlashingTickers] = useState<Record<string, "up" | "down">>({});

  // WhatsApp Alert Modal
  const [alertModalOpen, setAlertModalOpen] = useState<boolean>(false);
  const [alertInitialTicker, setAlertInitialTicker] = useState<string | undefined>(undefined);
  const [bottomHubCollapsed, setBottomHubCollapsed] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const selectedTickerRef = useRef<string>(selectedTicker);
  const activeExchangeRef = useRef<"DSE" | "CSE">(activeExchange);
  const flashTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef<number>(1000);

  useEffect(() => {
    selectedTickerRef.current = selectedTicker;
  }, [selectedTicker]);

  useEffect(() => {
    activeExchangeRef.current = activeExchange;
  }, [activeExchange]);

  // Current selected stock object
  const selectedStock = useMemo(() => {
    return stocks.find((s) => s.ticker === selectedTicker) || (stocks.length > 0 ? stocks[0] : null);
  }, [stocks, selectedTicker]);

  // Fetch depth for the active stock (REST fallback)
  const loadMarketDepth = useCallback(
    async (sym: string, exch: "DSE" | "CSE") => {
      if (!sym) return;
      setDepthLoading(true);
      try {
        const res = await stocksApi.getDepth(sym, exch);
        if (res.data) {
          setDepth(res.data);
        }
      } catch (err) {
        console.debug("Failed to fetch market depth:", err);
      } finally {
        setDepthLoading(false);
      }
    },
    []
  );

  // Initial bootstrap data via REST
  useEffect(() => {
    let isMounted = true;

    async function bootstrapData() {
      try {
        const [sumRes, secRes, newsRes, bmRes, movRes] = await Promise.allSettled([
          stocksApi.getSummary(),
          stocksApi.getSectors(),
          stocksApi.getNews({ limit: 30 }),
          stocksApi.getBlockMarket(),
          stocksApi.getMovers(),
        ]);

        if (isMounted) {
          if (sumRes.status === "fulfilled" && sumRes.value.data) {
            setMarketSummary(sumRes.value.data as any);
          }
          if (secRes.status === "fulfilled" && secRes.value.data) {
            setSectorHeatmap(secRes.value.data);
          }
          if (newsRes.status === "fulfilled" && newsRes.value.data?.news) {
            setNews(newsRes.value.data.news);
          }
          if (bmRes.status === "fulfilled" && bmRes.value.data?.deals) {
            setBlockDeals(bmRes.value.data.deals);
          }
          if (movRes.status === "fulfilled" && movRes.value.data) {
            setMovers(movRes.value.data.index_movers || []);
            setTopLists(movRes.value.data.top_lists || null);
          }
        }
      } catch (e) {
        console.debug("Bootstrap error:", e);
      }
    }

    bootstrapData();
    return () => {
      isMounted = false;
    };
  }, []);

  // When selectedTicker or activeExchange changes, notify WebSocket & load depth
  useEffect(() => {
    const sym = selectedTicker;
    const exch = activeExchange;
    if (sym) {
      loadMarketDepth(sym, exch);

      // Tell WebSocket server to stream real-time depth for this stock
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              action: "subscribe_depth",
              symbol: sym,
              exchange: exch,
            })
          );
        } catch {}
      }
    }
  }, [selectedTicker, activeExchange, loadMarketDepth]);

  // WebSocket Connection Lifecycle — 100% Real-Time Persistent
  useEffect(() => {
    let isCleanedUp = false;

    const connect = () => {
      if (isCleanedUp) return;

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      try {
        const wsUrl = stocksApi.getWsUrl();
        const ws = new window.WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isCleanedUp) {
            ws.close();
            return;
          }
          setIsConnected(true);
          reconnectDelayRef.current = 1000;

          // Request active symbol depth immediately upon connect
          const sym = selectedTickerRef.current || "GP";
          const exch = activeExchangeRef.current || "DSE";
          try {
            ws.send(
              JSON.stringify({
                action: "subscribe_depth",
                symbol: sym,
                exchange: exch,
              })
            );
          } catch {}
        };

        ws.onclose = () => {
          if (isCleanedUp) return;
          setIsConnected(false);
          const delay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(delay * 1.5, 6000);
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        };

        ws.onerror = (err) => {
          console.debug("WebSocket notice:", err);
        };

        ws.onmessage = (e) => {
          if (isCleanedUp) return;
          try {
            const payload = JSON.parse(e.data);

            // Server keepalive ping or pong
            if (payload.event === "ping") {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: "pong" }));
              }
              return;
            }

            if (payload.event === "pong") {
              if (payload.client_ts) {
                const rtt = Math.max(1, Date.now() - payload.client_ts);
                setWsPing(rtt);
              }
              return;
            }

            // Server periodic heartbeat
            if (payload.event === "heartbeat") {
              if (payload.server_time_ms) {
                const rtt = Math.max(1, Date.now() - payload.server_time_ms);
                setWsPing(rtt);
              }
              if (payload.cycle) {
                setServerCycle(payload.cycle);
              }
              if (payload.market_status || payload.exchanges) {
                setMarketSummary((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    market_status: payload.market_status ?? prev.market_status,
                    exchanges: payload.exchanges ?? prev.exchanges,
                    is_trading_hour: payload.is_trading_hour ?? prev.is_trading_hour,
                  };
                });
              }
              return;
            }

            // 1. Initial Snapshot on Connect
            if (payload.event === "init") {
              if (payload.market_summary || payload.market_status) {
                setMarketSummary({
                  summary: payload.market_summary,
                  is_trading_hour: payload.is_trading_hour,
                  market_status: payload.market_status,
                  exchanges: payload.exchanges,
                  total_tracked: payload.tickers_count,
                });
              }
              if (payload.tickers) {
                setStocks(payload.tickers);
                if (!selectedTickerRef.current && payload.tickers.length > 0) {
                  setSelectedTicker(payload.tickers[0].ticker);
                }
              }
              if (payload.recent_news) setNews(payload.recent_news);
              if (payload.sector_heatmap) setSectorHeatmap(payload.sector_heatmap);
              if (payload.block_market) setBlockDeals(payload.block_market);
              if (payload.movers) setMovers(payload.movers);
              if (payload.top_lists) setTopLists(payload.top_lists);
              if (payload.initial_depth) setDepth(payload.initial_depth);
              if (payload.recent_trades) setRecentTrades(payload.recent_trades);
            }

            // 2. Real-Time Order Book / Market Depth Update
            else if (payload.event === "depth_update") {
              if (payload.depth) {
                const currentSym = (selectedTickerRef.current || "").toUpperCase();
                const currentExch = (activeExchangeRef.current || "").toUpperCase();
                const payloadSym = (payload.symbol || "").toUpperCase();
                const payloadExch = (payload.exchange || "").toUpperCase();

                if (!payloadSym || payloadSym === currentSym) {
                  if (!payloadExch || payloadExch === currentExch) {
                    setDepth(payload.depth);
                  }
                }
              }
            }

            // 3. Real-Time Market Indices & Breadth Update
            else if (payload.event === "market_update") {
              if (payload.market_summary || payload.market_status) {
                setMarketSummary((prev) => ({
                  ...(prev ?? {}),
                  summary: payload.market_summary ?? prev?.summary,
                  is_trading_hour: payload.is_trading_hour ?? prev?.is_trading_hour ?? true,
                  market_status: payload.market_status ?? prev?.market_status,
                  exchanges: payload.exchanges ?? prev?.exchanges,
                  total_tracked: payload.total_tracked ?? prev?.total_tracked,
                } as any));
              }
            }

            // 4. Real-Time Sector Heatmap Update
            else if (payload.event === "sector_update") {
              if (payload.sector_heatmap) setSectorHeatmap(payload.sector_heatmap);
            }

            // 5. Real-Time News & Corporate PSI Update
            else if (payload.event === "news_update") {
              if (payload.news) setNews(payload.news);
            }

            // 6. Real-Time Block Market Deals Update
            else if (payload.event === "block_market_update") {
              if (payload.deals) setBlockDeals(payload.deals);
            }

            // 7. Real-Time Index Movers & Top Lists Update
            else if (payload.event === "movers_update") {
              if (payload.movers) setMovers(payload.movers);
              if (payload.top_lists) setTopLists(payload.top_lists);
            }

            // 8. Real-Time Stock Tick Diffs & Live Trade Executions
            else if (payload.event === "tick_diff") {
              const diffs = payload.ticks || [];
              if (!diffs.length) return;

              // Prepend newly executed trades into the Market Trades stream
              if (payload.trades && payload.trades.length > 0) {
                setRecentTrades((prev) => [...payload.trades, ...prev].slice(0, 60));
              }

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
                  } else {
                    map.set(d.ticker, d);
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
            }
          } catch (err) {
            console.debug("WS parse error:", err);
          }
        };
      } catch (err) {
        console.debug("WS init error:", err);
      }
    };

    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ action: "ping", client_ts: Date.now() }));
        } catch {}
      }
    }, 8000);

    return () => {
      isCleanedUp = true;
      clearInterval(pingInterval);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      Object.values(flashTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleOpenAlert = (ticker?: string) => {
    setAlertInitialTicker(ticker || selectedStock?.ticker || "GP");
    setAlertModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#0b0e11] text-[#eaecef] select-none">
      {/* 1. Live Running Continuous Marquee Ticker Tape at the very top */}
      <div className="shrink-0">
        <LiveTickerTape
          stocks={stocks}
          onSelectTicker={(t) => setSelectedTicker(t)}
        />
      </div>

      {/* 2. Binance Pro Header Bar (Exchange Switcher, Hero Stock, 24h Stats & Indices) */}
      <div className="shrink-0">
        <BinanceTradingHeader
          selectedStock={selectedStock}
          activeExchange={activeExchange}
          onSelectExchange={(ex) => setActiveExchange(ex)}
          marketSummary={marketSummary}
          isConnected={isConnected}
          onOpenAlertModal={handleOpenAlert}
          flashDirection={selectedStock ? flashingTickers[selectedStock.ticker] : undefined}
          wsPing={wsPing}
          serverCycle={serverCycle}
        />
      </div>

      {/* 3. Main 3-Column Binance Pro Trading Station Grid (100% viewport locked, zero scroll) */}
      <div className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">
        {/* Left Column: Watchlist & Pair Screener (3 cols on lg) */}
        <div className="col-span-3 h-full overflow-hidden flex flex-col border-r border-[#1e2329]">
          <BinanceWatchlist
            stocks={stocks}
            selectedTicker={selectedStock?.ticker || selectedTicker}
            onSelectTicker={(t) => setSelectedTicker(t)}
            flashingTickers={flashingTickers}
          />
        </div>

        {/* Center Column: Pro Chart & Bottom Hub (6 cols on lg) */}
        <div className="col-span-6 h-full overflow-hidden flex flex-col border-r border-[#1e2329]">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <BinanceChartPanel
              stock={selectedStock}
              depth={depth}
              onOpenAlertModal={handleOpenAlert}
            />
          </div>
          <div className={`shrink-0 transition-all duration-200 ${bottomHubCollapsed ? "h-[32px]" : "h-[220px]"}`}>
            <BinanceBottomHub
              selectedStock={selectedStock}
              news={news}
              heatmapData={sectorHeatmap}
              blockDeals={blockDeals}
              movers={movers}
              topLists={topLists}
              onSelectTicker={(t) => setSelectedTicker(t)}
              onOpenAlertModal={handleOpenAlert}
              isCollapsed={bottomHubCollapsed}
              onToggleCollapse={() => setBottomHubCollapsed(!bottomHubCollapsed)}
            />
          </div>
        </div>

        {/* Right Column: Binance Order Book & Recent Trades (3 cols on lg) */}
        <div className="col-span-3 h-full overflow-hidden flex flex-col">
          <BinanceOrderBook
            depth={depth}
            stock={selectedStock}
            activeExchange={activeExchange}
            onToggleExchange={(ex) => setActiveExchange(ex)}
            isLoading={depthLoading}
            liveTrades={recentTrades}
            onRefresh={() => {
              if (selectedStock) loadMarketDepth(selectedStock.ticker, activeExchange);
            }}
          />
        </div>
      </div>

      {/* 4. WhatsApp Stock Alert Configuration Modal */}
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
