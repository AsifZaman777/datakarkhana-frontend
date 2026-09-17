"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import {
  Eye,
  Send,
  Download,
  Trash2,
  Square,
  Clock,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Radio,
} from "lucide-react";
import { scraperApi } from "@/lib/api/scraper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ScraperJob } from "@/lib/types";
import { ScrapedDataModal } from "./scraped-data-modal";
import { useLanguage } from "@/providers/language-provider";

interface JobHistoryProps {
  jobs: ScraperJob[];
  onRefresh: () => void;
  activeJobId?: number | null;
  onViewLogs?: (jobId: number) => void;
}

export function JobHistory({ jobs, onRefresh, activeJobId, onViewLogs }: JobHistoryProps) {
  const router = useRouter();
  const { lang } = useLanguage();

  // Modal State for Data Preview
  const [previewJobId, setPreviewJobId] = useState<number | null>(null);

  // Modal State for Delete Confirm
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stopping state
  const [stoppingJobId, setStoppingJobId] = useState<number | null>(null);

  const handleStopJob = async (jobId: number) => {
    setStoppingJobId(jobId);
    try {
      await scraperApi.stopJob(jobId);
      toast.info(lang === "bn" ? `কাজ #${jobId}-এর বন্ধের অনুরোধ পাঠানো হয়েছে। আংশিক ডেটা সংরক্ষণ করা হচ্ছে...` : `Stop request sent for Job #${jobId}. Saving partial scraped records...`);
      setTimeout(onRefresh, 1500);
    } catch {
      toast.error(lang === "bn" ? "বন্ধের সিগন্যাল পাঠানো ব্যর্থ হয়েছে।" : "Failed to send stop signal.");
    } finally {
      setStoppingJobId(null);
    }
  };

  const confirmDeleteJob = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await scraperApi.deleteJob(deleteTargetId);
      toast.success(lang === "bn" ? `কাজ #${deleteTargetId} মুছে ফেলা হয়েছে।` : `Job #${deleteTargetId} deleted.`);
      setDeleteTargetId(null);
      onRefresh();
    } catch {
      toast.error(lang === "bn" ? "স্ক্র্যাপ কাজ মুছে ফেলা ব্যর্থ হয়েছে।" : "Failed to delete scrape job.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewData = (jobId: number) => {
    router.push(`/catalog?tab=private&job=${jobId}`);
  };

  const handleUseInCampaign = (jobId: number) => {
    router.push(`/marketing?tab=whatsapp&group=job_${jobId}`);
  };

  const handleDownloadExcel = (jobId: number) => {
    const url = scraperApi.downloadJobUrl(jobId);
    window.open(url, "_blank");
  };

  return (
    <Card className="glass-panel p-6 border-cyan-500/30">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-foreground font-mono">
              {lang === "bn" ? "স্ক্র্যাপিং হিস্ট্রি ও নিজস্ব ডেটাসেটসমূহ" : "Scraping Job History & Private Datasets"} ({jobs.length})
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-xs text-muted-foreground">
            {lang === "bn" ? "তালিকা রিফ্রেশ" : "Refresh List"}
          </Button>
        </div>

        <div className="border border-border/40 rounded-lg overflow-x-auto bg-black/30">
          {jobs.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-foreground w-[90px]">
                    {lang === "bn" ? "কাজের আইডি" : "Job ID"}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    {lang === "bn" ? "অনুসন্ধান কুয়েরি / অবস্থান" : "Search Query / Location"}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    {lang === "bn" ? "স্ট্যাটাস" : "Status"}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    {lang === "bn" ? "সংগৃহীত লিড" : "Items Parsed"}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground">
                    {lang === "bn" ? "তৈরির সময়" : "Created At"}
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right min-w-[280px]">
                    {lang === "bn" ? "অ্যাকশন (দেখুন / ক্যাম্পেইন / ডাউনলোড / মুছুন)" : "Actions (View / Campaign / Download / Delete)"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const isRunning = job.status === "running";
                  const isDone = job.status === "done" || job.status === "stopped";
                  const itemCount = job.result_count || 0;

                  return (
                    <TableRow
                      key={job.id}
                      className={`border-border/20 text-xs transition-colors ${
                        activeJobId === job.id
                          ? "bg-cyan-500/10 border-l-2 border-l-cyan-400"
                          : "hover:bg-cyan-500/5"
                      }`}
                    >
                      <TableCell className="font-mono font-bold text-cyan-400">
                        #{job.id}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Search className="h-3 w-3 text-cyan-400 shrink-0" />
                            <span>{job.query}</span>
                          </div>
                          {(job.division || job.district || job.area) && (
                            <div className="text-[11px] text-muted-foreground">
                              {[job.division, job.district, job.area].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {isRunning && (
                          <Badge variant="outline" className="border-cyan-400/50 text-cyan-400 gap-1 text-[10px] animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                            {lang === "bn" ? "স্ক্র্যাপিং চলছে" : "Scraping Active"}
                          </Badge>
                        )}
                        {job.status === "done" && (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> {lang === "bn" ? "সম্পন্ন" : "Completed"}
                          </Badge>
                        )}
                        {job.status === "stopped" && (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-400 gap-1 text-[10px]">
                            <Square className="h-3 w-3" /> {lang === "bn" ? "স্থগিত (সংরক্ষিত)" : "Stopped (Saved)"}
                          </Badge>
                        )}
                        {job.status === "failed" && (
                          <Badge variant="outline" className="border-destructive/40 text-destructive gap-1 text-[10px]">
                            <XCircle className="h-3 w-3" /> {lang === "bn" ? "ব্যর্থ" : "Failed"}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="font-mono font-semibold text-foreground">
                        {itemCount > 0 ? (
                          <span className="text-emerald-400 font-bold">{itemCount} {lang === "bn" ? "টি লিড" : "leads"}</span>
                        ) : (
                          <span className="text-muted-foreground/60">0</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {job.created_at ? job.created_at.split(".")[0] : "-"}
                      </TableCell>

                      {/* ACTION BUTTONS PER JOB */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WATCH LIVE STREAM IF RUNNING */}
                          {isRunning && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewLogs?.(job.id)}
                              className={`h-7 px-2 text-[11px] font-bold gap-1 ${
                                activeJobId === job.id
                                  ? "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400"
                                  : "border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/20"
                              }`}
                              title={lang === "bn" ? "গুগল ম্যাপস ও লাইভ লগ দেখুন" : "Stream Google Maps and live logs"}
                            >
                              <Radio className="h-3 w-3 animate-pulse text-cyan-400" />
                              {activeJobId === job.id ? (lang === "bn" ? "লাইভ দেখা হচ্ছে" : "Watching Live") : (lang === "bn" ? "লাইভ দেখুন" : "Watch Live")}
                            </Button>
                          )}

                          {/* VIEW LOGS & MAP FOR COMPLETED/STOPPED JOBS */}
                          {!isRunning && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewLogs?.(job.id)}
                              className={`h-7 px-2 text-[11px] gap-1 ${
                                activeJobId === job.id
                                  ? "text-cyan-400 font-bold bg-cyan-500/10"
                                  : "text-muted-foreground hover:text-cyan-300"
                              }`}
                              title={lang === "bn" ? "লগ এবং গুগল ম্যাপস ক্যাপচার দেখুন" : "Inspect logs and Google Maps capture"}
                            >
                              <Eye className="h-3 w-3 text-cyan-400" /> {lang === "bn" ? "লগ ও ম্যাপ" : "Logs & Map"}
                            </Button>
                          )}

                          {/* STOP BUTTON IF RUNNING */}
                          {isRunning && (
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={stoppingJobId === job.id}
                              onClick={() => handleStopJob(job.id)}
                              className="h-7 px-2 text-[11px] font-bold gap-1"
                              title={lang === "bn" ? "অবিলম্বে স্ক্র্যাপিং বন্ধ করুন এবং সংগৃহীত ডেটা রাখুন" : "Stop scraping immediately & keep partial data"}
                            >
                              <Square className="h-3 w-3" /> {lang === "bn" ? "থামান" : "Stop"}
                            </Button>
                          )}

                          {/* 1. VIEW DATA BUTTON */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isDone || itemCount === 0}
                            onClick={() => handleViewData(job.id)}
                            className="h-7 px-2 text-[11px] gap-1 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                            title={lang === "bn" ? "প্রাইভেট ক্যাটালগে সংগৃহীত ডেটাসেট দেখুন" : "View collected dataset in private catalogue"}
                          >
                            <Eye className="h-3 w-3" /> {lang === "bn" ? "ডেটা দেখুন" : "View Data"}
                          </Button>

                          {/* 2. USE IN CAMPAIGN BUTTON */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isDone || itemCount === 0}
                            onClick={() => handleUseInCampaign(job.id)}
                            className="h-7 px-2 text-[11px] gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            title={lang === "bn" ? "হোয়াটসঅ্যাপ মার্কেটিং ক্যাম্পেইনে এই ডেটাসেট ব্যবহার করুন" : "Use dataset for WhatsApp marketing campaign"}
                          >
                            <Send className="h-3 w-3" /> {lang === "bn" ? "ব্যবহার" : "Use"}
                          </Button>

                          {/* 3. DOWNLOAD EXCEL BUTTON */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isDone || itemCount === 0}
                            onClick={() => handleDownloadExcel(job.id)}
                            className="h-7 px-2 text-[11px] gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                            title={lang === "bn" ? "এক্সেল স্প্রেডশিট ডাউনলোড করুন" : "Download Excel spreadsheet"}
                          >
                            <Download className="h-3 w-3" /> {lang === "bn" ? "ডাউনলোড" : "Download"}
                          </Button>

                          {/* 4. DELETE BUTTON */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTargetId(job.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title={lang === "bn" ? "স্ক্র্যাপ কাজ মুছে ফেলুন" : "Delete scrape job"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-xs text-muted-foreground">
              {lang === "bn" 
                ? "এখনো কোনো স্ক্র্যাপ শুরু করা হয়নি। উপরে ফর্ম পূরণ করে গুগল ম্যাপস স্ক্র্যাপিং শুরু করুন।" 
                : "No scrape jobs launched yet. Use the form above to start Google Maps scraping."}
            </div>
          )}
        </div>
      </CardContent>

      {/* Scraped Data Preview Modal */}
      <ScrapedDataModal
        jobId={previewJobId}
        open={previewJobId !== null}
        onClose={() => setPreviewJobId(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteJob}
        title={lang === "bn" ? `স্ক্র্যাপ কাজ #${deleteTargetId} মুছে ফেলবেন?` : `Delete Scrape Job #${deleteTargetId}?`}
        description={lang === "bn" 
          ? "এই কাজটি স্থায়ীভাবে মুছে ফেলা হবে, যার মধ্যে এর আউটপুট এক্সেল ফাইল এবং সমস্ত সংশ্লিষ্ট লগ অন্তর্ভুক্ত।" 
          : "This action will permanently delete this scrape job, its output Excel file, and all associated execution logs."}
        confirmText={isDeleting ? (lang === "bn" ? "মুছে ফেলা হচ্ছে..." : "Deleting...") : (lang === "bn" ? "কাজ মুছে ফেলুন" : "Delete Job")}
        isDanger
      />
    </Card>
  );
}
