"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScraperForm } from "@/components/scraper/scraper-form";
import { ScraperTerminal } from "@/components/scraper/scraper-terminal";
import { DatasetRequestForm } from "@/components/scraper/dataset-request-form";
import { JobHistory } from "@/components/scraper/job-history";
import { configApi } from "@/lib/api/config";
import { scraperApi } from "@/lib/api/scraper";
import { requestsApi } from "@/lib/api/requests";
import { toast } from "sonner";
import type { RegionsConfig, DatasetRequest, ScraperJob } from "@/lib/types";

import { useLanguage } from "@/providers/language-provider";

export default function ScraperPage() {
  const { t, lang } = useLanguage();
  const sc = t.scraper || {};
  const [regionsConfig, setRegionsConfig] = useState<RegionsConfig | null>(null);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);

  const [myRequests, setMyRequests] = useState<DatasetRequest[]>([]);
  const [recentJobs, setRecentJobs] = useState<ScraperJob[]>([]);

  const refreshJobs = useCallback(() => {
    scraperApi
      .listJobs()
      .then((res) => {
        setRecentJobs(res.data);
      })
      .catch(() => { });
  }, []);

  // Load Config & Requests
  useEffect(() => {
    configApi
      .regions()
      .then((res) => setRegionsConfig(res.data.regions))
      .catch(() => { });

    requestsApi
      .myRequests()
      .then((res) => setMyRequests(res.data))
      .catch(() => { });

    refreshJobs();
  }, [refreshJobs]);

  const loadRequests = useCallback(() => {
    requestsApi
      .myRequests()
      .then((res) => setMyRequests(res.data))
      .catch(() => { });
  }, []);

  // Job lifecycle handlers via WebSocket
  const handleJobCreated = (jobId: number) => {
    setCooldown(120);
    setActiveJobId(jobId);
    setIsJobRunning(true);
    setActiveLogs([]);
  };

  const handleJobFinished = useCallback(
    (status: string, resultCount: number) => {
      setIsJobRunning(false);
      refreshJobs();
      if (status === "done") {
        toast.success(lang === "bn" ? `স্ক্র্যাপিং সম্পন্ন! ${resultCount} টি লিড সংগৃহীত হয়েছে।` : `Scraping completed! Collected ${resultCount} business leads.`);
      } else if (status === "stopped") {
        toast.info(lang === "bn" ? `স্ক্র্যাপিং বন্ধ করা হয়েছে। ${resultCount} টি লিড সংরক্ষিত।` : `Scraping stopped. Preserved ${resultCount} collected leads.`);
      } else {
        toast.error(lang === "bn" ? "স্ক্র্যাপার জব সম্পন্ন হয়েছে (০ টি রেকর্ড বা ত্রুটি)।" : "Scraper job finished with 0 records or errors.");
      }
    },
    [refreshJobs, lang]
  );

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          {sc.pageTitle || "Live Google Maps Scraper & Request Console"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {sc.pageSubtitle || "Execute real-time web scraping across Google Maps for Bangladesh business leads or submit custom dataset requests"}
        </p>
      </div>

      <Tabs defaultValue="scraper" className="w-full">
        <TabsList data-tour="scraper-tabs" className="bg-card/60 border border-border/40 p-1">
          <TabsTrigger value="scraper" className="gap-2 text-xs font-semibold">
            <Search className="h-4 w-4 text-cyan-400" />
            {sc.tabConsole || "Live Scraper Console"}
          </TabsTrigger>
          <TabsTrigger value="request" className="gap-2 text-xs font-semibold">
            <Inbox className="h-4 w-4 text-amber-500" />
            {sc.tabRequest || "Submit Custom Dataset Request"}
          </TabsTrigger>
        </TabsList>

        {/* TAB: SCRAPER CONSOLE */}
        <TabsContent value="scraper" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <ScraperForm
                regionsConfig={regionsConfig}
                onJobCreated={handleJobCreated}
                cooldownRemaining={cooldown}
              />
            </div>

            <div data-tour="scraper-terminal" className="lg:col-span-7">
              <ScraperTerminal
                logs={activeLogs}
                activeJobId={activeJobId}
                isJobRunning={isJobRunning}
                onJobFinished={handleJobFinished}
              />
            </div>
          </div>

          {/* Scraper Job History & Private Datasets */}
          <div data-tour="scraper-history">
            <JobHistory
              jobs={recentJobs}
              onRefresh={refreshJobs}
              activeJobId={activeJobId}
              onViewLogs={(jobId) => {
                const targetJob = recentJobs.find((j) => j.id === jobId);
                const isRunning = targetJob?.status === "running";
                setActiveJobId(jobId);
                setIsJobRunning(isRunning);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </TabsContent>

        {/* TAB: DATASET REQUEST PORTAL */}
        <TabsContent value="request" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6">
              <DatasetRequestForm
                regionsConfig={regionsConfig}
                onRequestSubmitted={loadRequests}
              />
            </div>

            {/* Requests History List */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">
                {sc.submittedRequestsTitle || "Your Submitted Dataset Requests"}
              </h3>
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <Card key={req.id} className="p-4 glass-panel space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-foreground">{req.category_query}</div>
                        <div className="text-xs text-muted-foreground">
                          {sc.locationPrefix || "Location:"} {[req.division, req.district, req.area].filter(Boolean).join(", ") || (lang === "bn" ? "বাংলাদেশ" : "Bangladesh")}
                        </div>
                      </div>

                      {req.status === "pending" && (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-500 gap-1 text-[10px]">
                          <Clock className="h-3 w-3" /> {sc.pendingScrapeBadge || "Pending Scrape"}
                        </Badge>
                      )}
                      {req.status === "fulfilled" && (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> {sc.fulfilledBadge || "Fulfilled in Catalog"}
                        </Badge>
                      )}
                      {req.status === "rejected" && (
                        <Badge variant="outline" className="border-destructive/40 text-destructive gap-1 text-[10px]">
                          <XCircle className="h-3 w-3" /> {sc.rejectedBadge || "Unable to Fulfill"}
                        </Badge>
                      )}
                    </div>

                    {req.additional_notes && (
                      <div className="text-xs text-muted-foreground italic pt-1 border-t border-border/40">
                        {sc.notesPrefix || "Notes:"} &quot;{req.additional_notes}&quot;
                      </div>
                    )}
                  </Card>
                ))}

                {myRequests.length === 0 && (
                  <div className="text-center py-12 text-xs text-muted-foreground glass-panel">
                    {sc.noRequestsSubmitted || "No custom dataset requests submitted yet. Use the form on the left to request custom lead scraping."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
