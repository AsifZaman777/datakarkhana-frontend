"use client";

import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Newspaper, ChevronRight, X, LineChart } from "lucide-react";
import { StockNewsItem, stocksApi } from "@/lib/api/stocks";

interface AllNewsViewProps {
  onOpenChart: (ticker: string) => void;
}

export function AllNewsView({ onOpenChart }: AllNewsViewProps) {
  const [news, setNews] = useState<StockNewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [activeModalItem, setActiveModalItem] = useState<StockNewsItem | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await stocksApi.getNews(undefined, 80);
      setNews(res.data.news || []);
    } catch (e) {
      console.error("Error fetching news archive:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filtered = news.filter((item) => {
    const matchesSearch =
      item.code.toUpperCase().includes(search.toUpperCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      (item.body && item.body.toLowerCase().includes(search.toLowerCase()));

    if (selectedType === "ALL") return matchesSearch;
    if (selectedType === "PSI") return matchesSearch && (item.type?.toLowerCase().includes("sensitive") || item.type?.toLowerCase().includes("psi"));
    if (selectedType === "DIVIDEND") return matchesSearch && item.summary.toLowerCase().includes("dividend");
    if (selectedType === "EPS") return matchesSearch && (item.summary.toLowerCase().includes("eps") || item.summary.toLowerCase().includes("financial"));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Category Pills */}
      <div className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">DSE News & Corporate Disclosures</h2>
            <p className="text-xs text-muted-foreground">
              Official company notices, dividend proposals, earnings releases, and Price Sensitive Information (PSI).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/60 bg-background/50 text-xs font-bold text-foreground focus:outline-none uppercase"
            />
          </div>

          <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/20">
            {[
              { id: "ALL", label: "All News" },
              { id: "PSI", label: "PSI Only" },
              { id: "DIVIDEND", label: "Dividends" },
              { id: "EPS", label: "Financials / EPS" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedType === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="p-2 rounded-xl border border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground/60 text-xs rounded-2xl border border-border/40 bg-card/60">
            {loading ? "Loading announcements..." : "No corporate disclosures match your criteria."}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveModalItem(item)}
              className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl hover:bg-card/90 transition-all cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {item.code}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
                    {item.type || "Announcement"}
                  </span>
                  <span className="text-xs text-muted-foreground/60 ml-2">
                    {item.date} at {item.time} BST
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.summary}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{item.name}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChart(item.code);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-xs font-bold text-secondary-foreground flex items-center gap-1.5"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Chart</span>
                </button>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full News Reader Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/60 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-base font-black px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                {activeModalItem.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary font-bold text-secondary-foreground">
                {activeModalItem.type}
              </span>
              <span className="text-xs text-muted-foreground ml-auto pr-8">
                {activeModalItem.date} at {activeModalItem.time} BST
              </span>
            </div>

            <div>
              <h2 className="text-base font-extrabold text-foreground leading-snug">
                {activeModalItem.summary}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{activeModalItem.name}</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/20 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
              {activeModalItem.body || activeModalItem.summary}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onOpenChart(activeModalItem.code);
                  setActiveModalItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5"
              >
                <span>View {activeModalItem.code} Chart</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
