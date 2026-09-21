"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Search, BarChart3, History, Sparkles, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DarazScraperForm } from "@/components/scraper/daraz-scraper-form";
import { ScraperTerminal } from "@/components/scraper/scraper-terminal";
import { DarazAnalysisView } from "@/components/scraper/daraz-analysis-view";
import { DarazJobHistory } from "@/components/scraper/daraz-job-history";
import { darazApi } from "@/lib/api/daraz";
import type { ScraperJob } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";

export default function DarazScraperPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("console");
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [activeJobQuery, setActiveJobQuery] = useState<string>("");
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [recentJobs, setRecentJobs] = useState<ScraperJob[]>([]);

  // Load Daraz scraping jobs
  const refreshJobs = useCallback(() => {
    darazApi
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
            ? `দারাজ স্ক্র্যাপিং সম্পন্ন! ${resultCount} টি পণ্য সংগৃহীত হয়েছে।`
            : `Daraz scraping complete! Collected ${resultCount} products.`
        );
        // Prompt user or automatically let them view analysis
        setActiveTab("analysis");
      } else if (status === "stopped") {
        toast.info(
          lang === "bn"
            ? `দারাজ স্ক্র্যাপিং বন্ধ করা হয়েছে। ${resultCount} টি পণ্য সংরক্ষিত।`
            : `Daraz scraping stopped. Preserved ${resultCount} collected products.`
        );
        setActiveTab("analysis");
      } else {
        toast.error(
          lang === "bn"
            ? "দারাজ স্ক্র্যাপার জব সম্পন্ন হয়েছে (০ টি রেকর্ড বা ত্রুটি)।"
            : "Daraz job ended with 0 items or encountered error."
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
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-md">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                {lang === "bn" ? "দারাজ মার্কেট এনালাইসিস ইঞ্জিন" : "Daraz E-Commerce Intelligence Engine"}
                <Badge className="bg-orange-500 text-white font-bold text-[10px] px-2">
                  Daraz.com.bd
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "bn"
                  ? "দারাজ থেকে সরাসরি পণ্য ডাটা, মূল্য বিশ্লেষণ, বিক্রেতার তথ্য ও স্টক স্ট্যাটাস সংগ্রহ ও পর্যালোচনা করুন"
                  : "Automated search, multi-page pagination crawler, price tracking, seller intel, and stock analysis"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.daraz.com.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-orange-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card/40 transition-colors"
          >
            <span>Visit Daraz</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/60 border border-border/40 p-1">
          <TabsTrigger value="console" className="gap-2 text-xs font-semibold">
            <Search className="h-3.5 w-3.5 text-orange-400" />
            {lang === "bn" ? "দারাজ কনসোল ও লাইভ স্ক্রিন" : "Daraz Scraper Console"}
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
            {lang === "bn" ? "জব হিস্ট্রি" : "Daraz History"}
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
              <DarazScraperForm
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
          <DarazAnalysisView
            jobId={activeJobId || recentJobs[0]?.id || null}
            query={activeJobQuery || recentJobs[0]?.query || ""}
            isJobRunning={isJobRunning}
          />
        </TabsContent>

        {/* ── TAB 3: DARAZ JOB HISTORY ── */}
        <TabsContent value="history" className="space-y-6 pt-4">
          <DarazJobHistory
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
