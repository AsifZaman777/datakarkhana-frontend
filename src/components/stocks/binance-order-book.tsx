"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Clock,
  Zap,
  ExternalLink,
  Shield,
  BarChart2,
} from "lucide-react";
import { MarketDepthData, StockTicker } from "@/lib/api/stocks";

interface BinanceOrderBookProps {
  depth: MarketDepthData | null;
  stock: StockTicker | null;
  activeExchange: "DSE" | "CSE";
  onToggleExchange: (ex: "DSE" | "CSE") => void;
  isLoading: boolean;
  onRefresh: () => void;
  liveTrades?: {
    id: string;
    ticker?: string;
    price: number;
    size: number;
    time: string;
    is_buy?: boolean;
    isBuy?: boolean;
    direction?: string;
  }[];
}

type DepthMode = "both" | "bids" | "asks";
type ActiveTab = "book" | "depth" | "trades";

export function BinanceOrderBook({
  depth,
  stock,
  activeExchange,
  onToggleExchange,
  isLoading,
  onRefresh,
  liveTrades,
}: BinanceOrderBookProps) {
  const [mode, setMode] = useState<DepthMode>("both");
  const [activeTab, setActiveTab] = useState<ActiveTab>("book");

  const bids = depth?.bids || [];
  const asks = depth?.asks || [];
  const ltp = stock?.ltp ?? depth?.stats?.ltp ?? 0;
  const isPos = (stock?.change ?? 0) >= 0;

  // Max volume for cumulative depth visual bars
  const maxBidVol = Math.max(...bids.map((b) => b.total || b.volume), 1);
  const maxAskVol = Math.max(...asks.map((a) => a.total || a.volume), 1);
  const maxOverall = Math.max(maxBidVol, maxAskVol, 100);

  // Spread calculation
  const topBid = bids[0]?.price ?? ltp;
  const topAsk = asks[0]?.price ?? ltp;
  const spread = Math.max(0, topAsk - topBid);
  const spreadPct = topBid > 0 ? ((spread / topBid) * 100).toFixed(2) : "0.00";

  // Use live websocket trades if available, else fallback
  const recentTrades = React.useMemo(() => {
    if (liveTrades && liveTrades.length > 0) {
      return liveTrades.map((t) => ({
        id: t.id,
        time: t.time,
        price: t.price,
        size: t.size,
        isBuy: t.is_buy ?? t.isBuy ?? (t.direction === "up"),
        ticker: t.ticker,
      }));
    }
    if (!stock) return [];
    const basePrice = ltp > 0 ? ltp : 100;
    const now = new Date();
    const tradesList = [];
    for (let i = 0; i < 18; i++) {
      const tradeTime = new Date(now.getTime() - i * 8000);
      const isBuy = i % 3 !== 0;
      const priceVariation = ((i % 4) - 1.5) * 0.1;
      const p = Number((basePrice + (isBuy ? priceVariation : -priceVariation)).toFixed(2));
      const sz = Math.floor(Math.abs(Math.sin(i * 2)) * 800 + 50) * 10;
      tradesList.push({
        id: `tr_${i}`,
        time: tradeTime.toTimeString().split(" ")[0],
        price: p,
        size: sz,
        isBuy,
        ticker: stock.ticker,
      });
    }
    return tradesList;
  }, [liveTrades, stock, ltp]);

  const visibleAsks = mode === "bids" ? [] : asks.slice(0, mode === "both" ? 8 : 16);
  const visibleBids = mode === "asks" ? [] : bids.slice(0, mode === "both" ? 8 : 16);

  const lankabdUrl = depth?.lankabd_url || `https://lankabd.com/Home/MarketDepth?mktDepthSymbol=${stock?.ticker || 'GP'}`;
  const totalBuyVol = depth?.total_buy_volume ?? bids.reduce((acc, b) => acc + (b.volume || 0), 0);
  const totalSellVol = depth?.total_sell_volume ?? asks.reduce((acc, a) => acc + (a.volume || 0), 0);
  const buyPct = depth?.buy_percentage ?? (totalBuyVol + totalSellVol > 0 ? Math.round((totalBuyVol / (totalBuyVol + totalSellVol)) * 100) : 50);
  const sellPct = depth?.sell_percentage ?? (100 - buyPct);

  return (
    <div className="flex flex-col h-full bg-[#181a20] select-none text-xs overflow-hidden">
      {/* ── Order Book Top Controls Bar ──────────────────────── */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1e2329] bg-[#12161c] shrink-0 h-[32px]">
        {/* Tab switcher: Order Book | Market Depth | Trades */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("book")}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              activeTab === "book"
                ? "bg-[#2b313a] text-[#f0b90b] shadow-sm"
                : "text-[#848e9c] hover:text-[#eaecef]"
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab("depth")}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              activeTab === "depth"
                ? "bg-[#2b313a] text-[#0ecb81] shadow-sm"
                : "text-[#848e9c] hover:text-[#eaecef]"
            }`}
            title="LankaBangla 10-Level Market Depth"
          >
            Market Depth
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              activeTab === "trades"
                ? "bg-[#2b313a] text-[#f0b90b] shadow-sm"
                : "text-[#848e9c] hover:text-[#eaecef]"
            }`}
          >
            Trades
          </button>
        </div>

        {/* Exchange Selector pill & Refresh */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 rounded bg-[#181a20] border border-[#2b313a]">
            <button
              onClick={() => onToggleExchange("DSE")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                activeExchange === "DSE"
                  ? "bg-[#f0b90b] text-black font-black"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              DSE
            </button>
            <button
              onClick={() => onToggleExchange("CSE")}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                activeExchange === "CSE"
                  ? "bg-[#f0b90b] text-black font-black"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              CSE
            </button>
          </div>

          <button
            onClick={onRefresh}
            className={`p-1 text-[#848e9c] hover:text-[#eaecef] rounded transition-all ${
              isLoading ? "animate-spin text-[#f0b90b]" : ""
            }`}
            title="Refresh Order Depth"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── TAB 1: BINANCE PRO ORDER BOOK VIEW ───────────────── */}
      {activeTab === "book" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Depth View Mode Toggle (Both, Bids, Asks) */}
          <div className="flex items-center justify-between px-3 py-1 text-[10px] border-b border-[#1e2329]/60 text-[#848e9c] shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode("both")}
                className={`p-0.5 rounded ${mode === "both" ? "bg-[#2b313a] text-[#eaecef]" : "hover:text-[#eaecef]"}`}
                title="Default (Both)"
              >
                <div className="flex flex-col gap-0.5 w-3 h-2.5 justify-center">
                  <div className="bg-[#f6465d] h-1 w-full rounded-sm" />
                  <div className="bg-[#0ecb81] h-1 w-full rounded-sm" />
                </div>
              </button>
              <button
                onClick={() => setMode("bids")}
                className={`p-0.5 rounded ${mode === "bids" ? "bg-[#2b313a] text-[#eaecef]" : "hover:text-[#eaecef]"}`}
                title="Bids Only"
              >
                <div className="bg-[#0ecb81] h-2.5 w-3 rounded-sm" />
              </button>
              <button
                onClick={() => setMode("asks")}
                className={`p-0.5 rounded ${mode === "asks" ? "bg-[#2b313a] text-[#eaecef]" : "hover:text-[#eaecef]"}`}
                title="Asks Only"
              >
                <div className="bg-[#f6465d] h-2.5 w-3 rounded-sm" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[9px]">
              <span>Spread:</span>
              <span className="text-[#eaecef] font-bold">
                {spread.toFixed(2)} ({spreadPct}%)
              </span>
            </div>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-12 px-2.5 py-0.5 text-[9px] font-semibold text-[#848e9c] border-b border-[#1e2329] bg-[#12161c] shrink-0">
            <span className="col-span-4 text-left">Price (BDT)</span>
            <span className="col-span-4 text-right">Size (Qty)</span>
            <span className="col-span-4 text-right">Total Depth</span>
          </div>

          {/* ASKS LIST (Red, Sells) */}
          <div className="flex-1 flex flex-col justify-end overflow-hidden divide-y divide-[#1e2329]/20">
            {visibleAsks.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-[#848e9c]/60 font-mono text-[10px] italic">
                No active sell orders in book
              </div>
            ) : (
              visibleAsks.slice().reverse().map((ask, idx) => {
                const depthPct = Math.min(100, Math.round(((ask.total || ask.volume) / maxOverall) * 100));
                return (
                  <div
                    key={`ask_${idx}`}
                    className="grid grid-cols-12 px-2.5 py-0.5 text-[10px] font-mono relative items-center hover:bg-[#f6465d]/10 cursor-pointer h-[20px]"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/15 pointer-events-none transition-all duration-300"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="col-span-4 text-left font-bold text-[#f6465d] relative z-10 leading-none">
                      {ask.price.toFixed(2)}
                    </span>
                    <span className="col-span-4 text-right text-[#eaecef] relative z-10 leading-none">
                      {ask.volume.toLocaleString()}
                    </span>
                    <span className="col-span-4 text-right text-[#848e9c] relative z-10 leading-none">
                      {(ask.total || ask.volume).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Current Price & Spread Middle Ribbon */}
          <div className="px-2.5 py-1 bg-[#12161c] border-y border-[#1e2329] flex items-center justify-between my-0.5 shrink-0 h-[28px]">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-black font-mono tracking-tight ${
                  isPos ? "text-[#0ecb81]" : "text-[#f6465d]"
                }`}
              >
                {ltp.toFixed(2)}
              </span>
              <span className="text-[10px]">{isPos ? "▲" : "▼"}</span>
              <span className="text-[9px] text-[#848e9c] font-mono">
                {activeExchange} Best
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#f0b90b]">
              LTP Direct
            </span>
          </div>

          {/* BIDS LIST (Green, Buys) */}
          <div className="flex-1 overflow-hidden divide-y divide-[#1e2329]/20">
            {visibleBids.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-[#848e9c]/60 font-mono text-[10px] italic">
                No active buy orders in book
              </div>
            ) : (
              visibleBids.map((bid, idx) => {
                const depthPct = Math.min(100, Math.round(((bid.total || bid.volume) / maxOverall) * 100));
                return (
                  <div
                    key={`bid_${idx}`}
                    className="grid grid-cols-12 px-2.5 py-0.5 text-[10px] font-mono relative items-center hover:bg-[#0ecb81]/10 cursor-pointer h-[20px]"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/15 pointer-events-none transition-all duration-300"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="col-span-4 text-left font-bold text-[#0ecb81] relative z-10 leading-none">
                      {bid.price.toFixed(2)}
                    </span>
                    <span className="col-span-4 text-right text-[#eaecef] relative z-10 leading-none">
                      {bid.volume.toLocaleString()}
                    </span>
                    <span className="col-span-4 text-right text-[#848e9c] relative z-10 leading-none">
                      {(bid.total || bid.volume).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Depth Pressure Percentage Bar */}
          <div className="p-1.5 border-t border-[#1e2329] bg-[#12161c] shrink-0">
            <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
              <span className="text-[#0ecb81] font-bold">
                Bids {buyPct}%
              </span>
              <span className="text-[#f6465d] font-bold">
                Asks {sellPct}%
              </span>
            </div>
            <div className="w-full bg-[#1e2329] h-1 rounded-full overflow-hidden flex">
              <div
                className="bg-[#0ecb81] h-full"
                style={{ width: `${buyPct}%` }}
              />
              <div
                className="bg-[#f6465d] h-full"
                style={{ width: `${sellPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEDICATED LANKABANGLA MARKET DEPTH TAB ────── */}
      {activeTab === "depth" && (
        <div className="flex-1 flex flex-col overflow-hidden text-xs">
          {/* Header with symbol & LankaBD Direct Link */}
          <div className="flex items-center justify-between px-2.5 py-1 border-b border-[#1e2329] bg-[#12161c] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[#eaecef] text-[11px]">
                {stock?.ticker || "STOCK"}
              </span>
              <span className="px-1 py-0 rounded text-[8px] bg-[#2b313a] text-[#848e9c]">
                {activeExchange}
              </span>
            </div>
            <a
              href={lankabdUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] text-[#f0b90b] hover:underline font-mono"
            >
              <span>LankaBD Depth</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Demand vs Supply Overview Gauge */}
          <div className="px-2.5 py-1.5 bg-[#181a20] border-b border-[#1e2329] shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-[#0ecb81] font-bold">
                Buy Demand: {totalBuyVol.toLocaleString()} ({buyPct}%)
              </span>
              <span className="text-[#f6465d] font-bold">
                Sell Supply: {totalSellVol.toLocaleString()} ({sellPct}%)
              </span>
            </div>
            <div className="w-full bg-[#1e2329] h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-[#0ecb81] h-full transition-all duration-300"
                style={{ width: `${buyPct}%` }}
              />
              <div
                className="bg-[#f6465d] h-full transition-all duration-300"
                style={{ width: `${sellPct}%` }}
              />
            </div>
          </div>

          {/* 10-Level Market Depth Tables */}
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar divide-y divide-[#1e2329]">
            {/* BUY ORDERS SECTION */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-12 px-2 py-0.5 text-[9px] font-semibold text-[#0ecb81] bg-[#0ecb81]/10 border-b border-[#1e2329]">
                <span className="col-span-3 text-left">Orders</span>
                <span className="col-span-5 text-right">Buy Qty</span>
                <span className="col-span-4 text-right">Bid Price</span>
              </div>
              <div className="divide-y divide-[#1e2329]/20 overflow-hidden">
                {bids.length === 0 ? (
                  <div className="py-3 px-2 text-center text-[#848e9c]/60 font-mono text-[10px] italic">
                    No active buy orders in book
                  </div>
                ) : (
                  bids.slice(0, 10).map((b, i) => {
                    const depthPct = Math.min(100, Math.round(((b.total || b.volume) / maxOverall) * 100));
                    return (
                      <div
                        key={`b_depth_${i}`}
                        className="grid grid-cols-12 px-2 py-0.5 text-[10px] font-mono items-center relative hover:bg-[#0ecb81]/10 h-[19px]"
                      >
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/10 pointer-events-none"
                          style={{ width: `${depthPct}%` }}
                        />
                        <span className="col-span-3 text-left text-[#848e9c] relative z-10 leading-none">
                          {b.orders || 1}
                        </span>
                        <span className="col-span-5 text-right text-[#eaecef] relative z-10 leading-none font-medium">
                          {b.volume.toLocaleString()}
                        </span>
                        <span className="col-span-4 text-right text-[#0ecb81] relative z-10 leading-none font-bold">
                          {b.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SELL ORDERS SECTION */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-12 px-2 py-0.5 text-[9px] font-semibold text-[#f6465d] bg-[#f6465d]/10 border-b border-[#1e2329]">
                <span className="col-span-4 text-left">Ask Price</span>
                <span className="col-span-5 text-right">Sell Qty</span>
                <span className="col-span-3 text-right">Orders</span>
              </div>
              <div className="divide-y divide-[#1e2329]/20 overflow-hidden">
                {asks.length === 0 ? (
                  <div className="py-3 px-2 text-center text-[#848e9c]/60 font-mono text-[10px] italic">
                    No active sell orders in book
                  </div>
                ) : (
                  asks.slice(0, 10).map((a, i) => {
                    const depthPct = Math.min(100, Math.round(((a.total || a.volume) / maxOverall) * 100));
                    return (
                      <div
                        key={`a_depth_${i}`}
                        className="grid grid-cols-12 px-2 py-0.5 text-[10px] font-mono items-center relative hover:bg-[#f6465d]/10 h-[19px]"
                      >
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/10 pointer-events-none"
                          style={{ width: `${depthPct}%` }}
                        />
                        <span className="col-span-4 text-left text-[#f6465d] relative z-10 leading-none font-bold">
                          {a.price.toFixed(2)}
                        </span>
                        <span className="col-span-5 text-right text-[#eaecef] relative z-10 leading-none font-medium">
                          {a.volume.toLocaleString()}
                        </span>
                        <span className="col-span-3 text-right text-[#848e9c] relative z-10 leading-none">
                          {a.orders || 1}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Market Statistics Mini Box at bottom of Depth */}
          <div className="px-2 py-1 bg-[#12161c] border-t border-[#1e2329] font-mono text-[9px] text-[#848e9c] shrink-0">
            <div className="flex justify-between">
              <span>LTP: <strong className="text-[#eaecef]">{ltp.toFixed(2)}</strong></span>
              <span>High: <strong className="text-[#0ecb81]">{depth?.stats?.high ?? stock?.high ?? ltp}</strong></span>
              <span>Low: <strong className="text-[#f6465d]">{depth?.stats?.low ?? stock?.low ?? ltp}</strong></span>
              <span>YCP: <strong className="text-[#eaecef]">{depth?.stats?.ycp ?? stock?.ycp ?? ltp}</strong></span>
            </div>
            <div className="flex justify-between pt-0.5 text-[8px]">
              <span>Trades: {depth?.stats?.trades?.toLocaleString() ?? stock?.trades?.toLocaleString() ?? 0}</span>
              <span>Vol: {depth?.stats?.volume?.toLocaleString() ?? stock?.volume?.toLocaleString() ?? 0}</span>
              <span>Val: {depth?.stats?.value_mn ? `${depth.stats.value_mn.toFixed(1)}M` : (stock?.value_mn ? `${stock.value_mn.toFixed(1)}M` : '0')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MARKET TRADES FEED TAB ───────────────────── */}
      {activeTab === "trades" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-12 px-2.5 py-1 text-[9px] font-semibold text-[#848e9c] border-b border-[#1e2329] bg-[#12161c] shrink-0">
            <span className="col-span-4 text-left">Price (BDT)</span>
            <span className="col-span-4 text-right">Amount (Qty)</span>
            <span className="col-span-4 text-right">Time (BST)</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1e2329]/30 no-scrollbar">
            {recentTrades.map((tr) => (
              <div
                key={tr.id}
                className="grid grid-cols-12 px-2.5 py-0.5 text-[10px] font-mono items-center hover:bg-[#1e2329]/50 h-[20px]"
              >
                <span
                  className={`col-span-4 text-left font-bold ${
                    tr.isBuy ? "text-[#0ecb81]" : "text-[#f6465d]"
                  }`}
                >
                  {tr.price.toFixed(2)}
                </span>
                <span className="col-span-4 text-right text-[#eaecef]">
                  {tr.size.toLocaleString()}
                </span>
                <span className="col-span-4 text-right text-[#848e9c] text-[9px]">
                  {tr.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
