"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Search, BarChart3, History, Sparkles, ExternalLink, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EcommerceScraperForm } from "@/components/scraper/ecommerce-scraper-form";
import { ScraperTerminal } from "@/components/scraper/scraper-terminal";
import { EcommerceAnalysisView } from "@/components/scraper/ecommerce-analysis-view";
import { EcommerceJobHistory } from "@/components/scraper/ecommerce-job-history";
import { ecommerceApi } from "@/lib/api/ecommerce";
import type { ScraperJob } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";

export default function EcommerceScraperPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("console");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [activeJobQuery, setActiveJobQuery] = useState<string>("");
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [recentJobs, setRecentJobs] = useState<ScraperJob[]>([]);

  // Load E-Commerce scraping jobs
  const refreshJobs = useCallback(() => {
    ecommerceApi
      .listJobs()
      .then((res) => {
        setRecentJobs(res.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  // Job lifecycle handlers
  const handleJobCreated = (jobId: number) => {
    setCooldown(60);
    setActiveJobId(jobId);
    setIsJobRunning(true);
    setActiveLogs([]);
    setActiveTab("console");
  };

  const handleJobFinished = useCallback(
    (status: string, resultCount: number) => {
      setIsJobRunning(false);
      refreshJobs();
      if (status === "done") {
        toast.success(
          lang === "bn"
            ? `ই-কমার্স স্ক্র্যাপিং সম্পন্ন! ${resultCount} টি পণ্য সংগৃহীত হয়েছে।`
            : `Universal E-Commerce scraping complete! Collected ${resultCount} products.`
        );
        setActiveTab("analysis");
      } else if (status === "stopped") {
        toast.info(
          lang === "bn"
            ? `ই-কমার্স স্ক্র্যাপিং বন্ধ করা হয়েছে। ${resultCount} টি পণ্য সংরক্ষিত।`
            : `E-Commerce scraping stopped. Preserved ${resultCount} collected products.`
        );
        setActiveTab("analysis");
      } else {
        toast.error(
          lang === "bn"
            ? "ই-কমার্স স্ক্র্যাপার জব সম্পন্ন হয়েছে (০ টি রেকর্ড বা ত্রুটি)।"
            : "E-Commerce job ended with 0 items or encountered an error."
        );
      }
    },
    [refreshJobs, lang]
  );

  // Cooldown countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSelectJobFromHistory = (jobId: number, query: string) => {
    setActiveJobId(jobId);
    setActiveJobQuery(query);
    setActiveTab("analysis");
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                {lang === "bn" ? "ইউনিভার্সাল ই-কমার্স ইন্টেলিজেন্স ইঞ্জিন" : "Universal E-Commerce Intelligence Engine"}
                <Badge className="bg-indigo-600 text-white font-bold text-[10px] px-2">
                  Universal / Multi-Store
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "bn"
                  ? "যেকোনো ই-কমার্স সাইটের লিংক পেস্ট করুন (eBay, Pickaboo, Amazon ইত্যাদি) এবং প্রাইস, রিভিউ, রেটিং ও স্টক ডাটা অটোমেটিক সংগ্রহ করুন"
                  : "Plug & play web scraper: paste any product, search, or catalog link to extract prices, reviews, ratings, and stock status"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5 text-xs py-1 px-3">
            <Zap className="h-3 w-3 mr-1 text-indigo-400" />
            <span>Plug & Play Scaling</span>
          </Badge>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/60 border border-border/40 p-1">
          <TabsTrigger value="console" className="gap-2 text-xs font-semibold">
            <Search className="h-3.5 w-3.5 text-indigo-400" />
            {lang === "bn" ? "কনসোল ও লাইভ স্ক্রিন" : "Scraper Console & Live View"}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2 text-xs font-semibold">
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            {lang === "bn" ? "প্রোডাক্ট এনালাইসিস ও ক্যাটালগ" : "Product Analysis & Insights"}
            {activeJobId && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
                #{activeJobId}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs font-semibold">
            <History className="h-3.5 w-3.5 text-amber-400" />
            {lang === "bn" ? "জব হিস্ট্রি" : "Crawl History"}
            {recentJobs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-accent text-[10px] font-mono">
                {recentJobs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: CONSOLE & LIVE SCREENSHOT MONITOR ── */}
        <TabsContent value="console" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <EcommerceScraperForm
                onJobCreated={handleJobCreated}
                cooldownRemaining={cooldown}
              />
            </div>

            {/* Reusable ScraperTerminal Component: Visual Screenshots + Live Logs + Stop Button */}
            <div className="lg:col-span-7">
              <ScraperTerminal
                logs={activeLogs}
                activeJobId={activeJobId}
                isJobRunning={isJobRunning}
                onJobFinished={handleJobFinished}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: PRODUCT ANALYSIS & PRIVATE CATALOGUE ── */}
        <TabsContent value="analysis" className="space-y-6 pt-4">
          <EcommerceAnalysisView
            jobId={activeJobId || recentJobs[0]?.id || null}
            query={activeJobQuery || recentJobs[0]?.query || ""}
            isJobRunning={isJobRunning}
          />
        </TabsContent>

        {/* ── TAB 3: ECOMMERCE JOB HISTORY ── */}
        <TabsContent value="history" className="space-y-6 pt-4">
          <EcommerceJobHistory
            jobs={recentJobs}
            onRefresh={refreshJobs}
            activeJobId={activeJobId}
            onSelectJob={handleSelectJobFromHistory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
