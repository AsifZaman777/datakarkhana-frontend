"use client";

import React, { useState } from "react";
import { BellRing, ChevronRight, Newspaper, X } from "lucide-react";
import { StockNewsItem } from "@/lib/api/stocks";

interface NewsTickerProps {
  news: StockNewsItem[];
  onSelectTicker?: (ticker: string) => void;
}

export function NewsTicker({ news, onSelectTicker }: NewsTickerProps) {
  const [selectedNews, setSelectedNews] = useState<StockNewsItem | null>(null);

  if (!news || news.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 p-2.5 px-4 rounded-xl border border-border/40 bg-secondary/30 backdrop-blur-md overflow-hidden text-xs">
        <div className="flex items-center gap-1.5 shrink-0 font-bold text-amber-500 uppercase tracking-wide">
          <Newspaper className="w-4 h-4 animate-bounce" />
          <span>DSE News:</span>
        </div>

        {/* Scrollable announcement items */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap flex-1 py-0.5">
          {news.slice(0, 10).map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedNews(item)}
              className="flex items-center gap-2 hover:text-primary transition-colors text-left group"
            >
              <span className="font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px]">
                {item.code}
              </span>
              <span className="text-muted-foreground group-hover:text-foreground line-clamp-1">
                {item.summary}
              </span>
              <span className="text-[10px] text-muted-foreground/60">{item.time}</span>
            </button>
          ))}
        </div>
      </div>

      {/* News Details Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border/60 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-sm font-extrabold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                {selectedNews.code}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                {selectedNews.type}
              </span>
              <span className="text-xs text-muted-foreground ml-auto pr-6">
                {selectedNews.date} at {selectedNews.time} BST
              </span>
            </div>

            <div>
              <h3 className="font-bold text-foreground text-base leading-snug">
                {selectedNews.summary}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedNews.name}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 text-xs text-muted-foreground leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-border/20">
              {selectedNews.body || selectedNews.summary}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {onSelectTicker && (
                <button
                  onClick={() => {
                    onSelectTicker(selectedNews.code);
                    setSelectedNews(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  <span>View {selectedNews.code} Chart</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
