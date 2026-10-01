"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, TrendingUp, TrendingDown, Bell, LineChart, Shield, ArrowRightLeft } from "lucide-react";
import { MarketDepthData, stocksApi, StockTicker } from "@/lib/api/stocks";

interface MarketDepthViewProps {
  initialInstrument?: string;
  allStocks: StockTicker[];
  onOpenChart: (ticker: string) => void;
  onOpenAlert: (ticker: string) => void;
}

export function MarketDepthView({
  initialInstrument = "IPDC",
  allStocks,
  onOpenChart,
  onOpenAlert,
}: MarketDepthViewProps) {
  const [selectedCode, setSelectedCode] = useState<string>(initialInstrument);
  const [searchInput, setSearchInput] = useState<string>("");
  const [depthData, setDepthData] = useState<MarketDepthData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [instruments, setInstruments] = useState<{ code: string; name: string; price: number }[]>([]);

  // Sync when initialInstrument prop changes
  useEffect(() => {
    if (initialInstrument) {
      setSelectedCode(initialInstrument);
    }
  }, [initialInstrument]);

  // Load available instruments
  useEffect(() => {
    stocksApi.getDepthInstruments().then((res) => {
      setInstruments(res.data.rows || []);
    }).catch(() => {});
  }, []);

  const fetchDepth = async (code: string) => {
    try {
      setLoading(true);
      const res = await stocksApi.getMarketDepth(code);
      setDepthData(res.data);
    } catch (e) {
      console.error("Error fetching market depth:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCode) {
      fetchDepth(selectedCode);
      // Auto-poll depth every 5 seconds
      const timer = setInterval(() => {
        stocksApi.getMarketDepth(selectedCode).then((res) => setDepthData(res.data)).catch(() => {});
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [selectedCode]);

  const bids = depthData?.bids || [];
  const asks = depthData?.asks || [];
  const stats = depthData?.priceStats;

  const totalBuyQty = bids.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSellQty = asks.reduce((acc, curr) => acc + curr.quantity, 0);
  const maxBidQty = Math.max(...bids.map((b) => b.quantity), 1);
  const maxAskQty = Math.max(...asks.map((a) => a.quantity), 1);

  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestAsk > 0 && bestBid > 0 ? (bestAsk - bestBid).toFixed(2) : "--";

  const totalDepthVolume = totalBuyQty + totalSellQty;
  const buyRatio = totalDepthVolume > 0 ? (totalBuyQty / totalDepthVolume) * 100 : 50;

  // Combine depth instruments with all tracked market instruments across all boards
  const availableInstruments = React.useMemo(() => {
    const map = new Map<string, { code: string; name: string; price: number; board?: string }>();
    allStocks.forEach((s) => {
      map.set(s.ticker, { code: s.ticker, name: s.sector || s.ticker, price: s.ltp, board: s.board });
    });
    instruments.forEach((i) => {
      const existing = map.get(i.code);
      if (existing) {
        existing.name = i.name || existing.name;
        if (i.price) existing.price = i.price;
      } else {
        map.set(i.code, { code: i.code, name: i.name || i.code, price: i.price });
      }
    });
    return Array.from(map.values());
  }, [allStocks, instruments]);

  // Filter instruments for autocomplete
  const filteredInstruments = searchInput
    ? availableInstruments
        .filter((i) => i.code.toUpperCase().includes(searchInput.toUpperCase()) || i.name.toUpperCase().includes(searchInput.toUpperCase()))
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Search & Instrument Switcher */}
      <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search instrument (e.g. IPDC, ACHIASF, LBS)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/60 bg-background/50 text-xs font-bold text-foreground focus:outline-none uppercase"
            />

            {/* Dropdown Suggestions */}
            {searchInput && filteredInstruments.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-border/20">
                {filteredInstruments.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setSelectedCode(item.code);
                      setSearchInput("");
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-foreground">{item.code}</span>
                      {item.board && item.board !== "PUBLIC" && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {item.board}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-1">{item.name}</span>
                    </div>
                    {item.price > 0 && <span className="font-mono font-bold">{item.price} BDT</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { code: "IPDC", label: "IPDC" },
              { code: "GP", label: "GP" },
              { code: "SQURPHARMA", label: "SQURPHARMA" },
              { code: "ACHIASF", label: "ACHIASF (SME)" },
              { code: "LBS", label: "LBS (ATB)" },
              { code: "BEXGSUKUK", label: "BEXGSUKUK (Debt)" },
            ].map((chip) => (
              <button
                key={chip.code}
                onClick={() => setSelectedCode(chip.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCode === chip.code
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChart(selectedCode)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-bold transition-all"
          >
            <LineChart className="w-4 h-4" />
            <span>Interactive Chart</span>
          </button>
          <button
            onClick={() => onOpenAlert(selectedCode)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-bold border border-amber-500/20 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span>Set Alert</span>
          </button>
          <button
            onClick={() => fetchDepth(selectedCode)}
            disabled={loading}
            className="p-2 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Order Book Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Book Depth Table (2 columns: Bids vs Asks) */}
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <span>{selectedCode} Live Market Depth</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  10-LEVEL QUEUE
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time buyer and seller queues on Dhaka Stock Exchange
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Spread</span>
              <p className="text-sm font-black font-mono text-foreground">{spread} Tk</p>
            </div>
          </div>

          {/* Buy vs Sell Pressure Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-500">Total Buyers: {totalBuyQty.toLocaleString()} shares</span>
              <span className="text-rose-500">Total Sellers: {totalSellQty.toLocaleString()} shares</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-muted/30">
              <div
                style={{ width: `${buyRatio}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Buyers: ${buyRatio.toFixed(1)}%`}
              />
              <div
                style={{ width: `${100 - buyRatio}%` }}
                className="bg-rose-500 transition-all duration-300"
                title={`Sellers: ${(100 - buyRatio).toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Side by side: Bids & Asks Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* BUY / BID SIDE */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
              <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pb-2 border-b border-emerald-500/20">
                <span>Orders</span>
                <span>Quantity</span>
                <span>Bid Price (Tk)</span>
              </div>

              {bids.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground/60 py-6">No active buy orders</p>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {bids.map((b, i) => {
                    const depthPercent = (b.quantity / maxBidQty) * 100;
                    return (
                      <div key={i} className="relative py-1.5 px-2 rounded-lg flex items-center justify-between overflow-hidden">
                        <div
                          style={{ width: `${depthPercent}%` }}
                          className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none rounded"
                        />
                        <span className="text-muted-foreground z-10 text-[11px]">{b.orders}</span>
                        <span className="font-semibold z-10">{b.quantity.toLocaleString()}</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 z-10">
                          {b.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SELL / ASK SIDE */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
              <div className="flex justify-between text-xs font-bold text-rose-600 dark:text-rose-400 pb-2 border-b border-rose-500/20">
                <span>Ask Price (Tk)</span>
                <span>Quantity</span>
                <span>Orders</span>
              </div>

              {asks.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground/60 py-6">No active sell orders</p>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {asks.map((a, i) => {
                    const depthPercent = (a.quantity / maxAskQty) * 100;
                    return (
                      <div key={i} className="relative py-1.5 px-2 rounded-lg flex items-center justify-between overflow-hidden">
                        <div
                          style={{ width: `${depthPercent}%` }}
                          className="absolute left-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none rounded"
                        />
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 z-10">
                          {a.price.toFixed(2)}
                        </span>
                        <span className="font-semibold z-10">{a.quantity.toLocaleString()}</span>
                        <span className="text-muted-foreground z-10 text-[11px]">{a.orders}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Live Quote Stats */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/30">
              Live Price Snapshot
            </h3>

            {stats ? (
              <div className="space-y-3 mt-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border/20 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Last Traded Price</span>
                  <p className="text-3xl font-black text-foreground mt-0.5">{stats.ltp?.toFixed(2)} <span className="text-sm font-normal">BDT</span></p>
                </div>

                <div className="divide-y divide-border/20 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Open Price</span>
                    <span className="font-mono font-bold text-foreground">{stats.open?.toFixed(2) || "--"}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Day's High</span>
                    <span className="font-mono font-bold text-emerald-500">{stats.high?.toFixed(2) || "--"}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Day's Low</span>
                    <span className="font-mono font-bold text-rose-500">{stats.low?.toFixed(2) || "--"}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Yesterday's Close</span>
                    <span className="font-mono font-bold text-foreground">{stats.ycp?.toFixed(2) || "--"}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Volume Traded</span>
                    <span className="font-mono font-bold text-foreground">{stats.volume?.toLocaleString() || "--"}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Trade Value</span>
                    <span className="font-mono font-bold text-foreground">{(stats.value / 10).toFixed(2)} Cr BDT</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-muted-foreground">Execution Trades</span>
                    <span className="font-mono font-bold text-foreground">{stats.trades?.toLocaleString() || "--"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-10 text-center">Loading live stats...</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/20 text-[11px] text-muted-foreground">
            ⚡ Market Depth reflects active limit orders submitted by brokers in the DSE matching engine.
          </div>
        </div>
      </div>
    </div>
  );
}
