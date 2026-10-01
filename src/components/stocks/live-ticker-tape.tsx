"use client";

import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { StockTicker } from "@/lib/api/stocks";

interface LiveTickerTapeProps {
  stocks: StockTicker[];
  onSelectTicker: (ticker: string) => void;
}

export function LiveTickerTape({ stocks, onSelectTicker }: LiveTickerTapeProps) {
  if (!stocks || stocks.length === 0) return null;

  // Filter most active/prominent stocks for the ticker tape (up to 40 stocks)
  const activeStocks = stocks
    .filter((s) => (s.value_mn || 0) > 0 || Math.abs(s.percent || 0) > 0)
    .sort((a, b) => (b.value_mn || 0) - (a.value_mn || 0))
    .slice(0, 35);

  // Duplicate for seamless infinite loop
  const displayList = [...activeStocks, ...activeStocks];

  return (
    <div className="relative w-full overflow-hidden bg-card/80 border-y border-border/40 backdrop-blur-md py-2 flex items-center select-none shadow-inner">
      {/* Live Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground font-extrabold text-[11px] tracking-wider uppercase shrink-0 z-10 shadow-md rounded-r-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>DSE LIVE</span>
      </div>

      {/* Marquee Container */}
      <div className="flex overflow-hidden whitespace-nowrap mask-linear-gradient">
        <div className="flex items-center gap-6 animate-ticker hover:[animation-play-state:paused] cursor-pointer">
          {displayList.map((stock, idx) => {
            const isUp = (stock.change ?? 0) >= 0;
            return (
              <button
                key={`${stock.ticker}-${idx}`}
                onClick={() => onSelectTicker(stock.ticker)}
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="font-extrabold text-foreground text-xs">{stock.ticker}</span>
                <span className="font-mono text-xs text-foreground/90 font-bold">
                  {stock.ltp.toFixed(2)}
                </span>
                <span
                  className={`inline-flex items-center text-[11px] font-bold ${
                    isUp ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {isUp ? "+" : ""}
                  {stock.percent.toFixed(2)}%
                </span>
                <span className="text-muted-foreground/30 ml-2">|</span>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          display: inline-flex;
          animation: ticker 45s linear infinite;
        }
      `}</style>
    </div>
  );
}
