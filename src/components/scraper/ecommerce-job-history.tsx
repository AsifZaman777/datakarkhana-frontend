"use client";

import { useState } from "react";
import {
  Package,
  Eye,
  Download,
  Trash2,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Globe,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { scraperApi } from "@/lib/api/scraper";
import { ecommerceApi } from "@/lib/api/ecommerce";
import type { ScraperJob } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";

interface EcommerceJobHistoryProps {
  jobs: ScraperJob[];
  onRefresh: () => void;
  activeJobId?: number | null;
  onSelectJob: (jobId: number, query: string) => void;
}

export function EcommerceJobHistory({
  jobs,
  onRefresh,
  activeJobId,
  onSelectJob,
}: EcommerceJobHistoryProps) {
  const { lang } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stoppingJobId, setStoppingJobId] = useState<number | null>(null);

  const canDownload =
    isAdmin ||
    (user?.effective_permissions
      ? !!user.effective_permissions.allow_daraz_download
      : (user?.allow_download !== undefined && user?.allow_download !== null
          ? user.allow_download === 1
          : ["pro", "enterprise"].includes((user?.plan_tier || "").toLowerCase())));

  const handleStopJob = async (jobId: number) => {
    setStoppingJobId(jobId);
    try {
      await scraperApi.stopJob(jobId);
      toast.info(lang === "bn" ? "কাজ বন্ধের অনুরোধ পাঠানো হয়েছে।" : "Stop request sent.");
      setTimeout(onRefresh, 1500);
    } catch {
      toast.error(lang === "bn" ? "বন্ধের সিগন্যাল পাঠানো ব্যর্থ হয়েছে।" : "Failed to stop job.");
    } finally {
      setStoppingJobId(null);
    }
  };

  const confirmDeleteJob = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await scraperApi.deleteJob(deleteTargetId);
      toast.success(lang === "bn" ? "জব সফলভাবে মুছে ফেলা হয়েছে।" : "Job deleted successfully.");
      setDeleteTargetId(null);
      onRefresh();
    } catch {
      toast.error(lang === "bn" ? "জব মুছতে ব্যর্থ হয়েছে।" : "Failed to delete job.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = (jobId: number) => {
    if (!canDownload) {
      toast.warning(
        lang === "bn"
          ? "ই-কমার্স এক্সেল ফাইল ডাউনলোড সুবিধা শুধু প্রো ও এন্টারপ্রাইজ গ্রাহকদের জন্য। সম্পূর্ণ ডাটা প্রাইভেট ক্যাটালগে দেখতে পাচ্ছেন।"
          : "Raw Excel download is available exclusively for Pro and Enterprise plans."
      );
      return;
    }
    const url = ecommerceApi.downloadJobUrl(jobId);
    window.open(url, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse text-[11px]">
            <Clock className="h-3 w-3 mr-1 animate-spin" />
            {lang === "bn" ? "চলমান" : "Running"}
          </Badge>
        );
      case "done":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {lang === "bn" ? "সম্পন্ন" : "Done"}
          </Badge>
        );
      case "stopped":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px]">
            <Square className="h-3 w-3 mr-1" />
            {lang === "bn" ? "স্থগিত" : "Stopped"}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px]">
            <XCircle className="h-3 w-3 mr-1" />
            {lang === "bn" ? "ব্যর্থ" : "Failed"}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              <span>{lang === "bn" ? "ই-কমার্স জব ইতিহাস" : "Universal E-Commerce Job History"}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "bn"
                ? "আপনার পূর্ববর্তী সকল ই-কমার্স স্ক্র্যাপিং জব এবং ডাটা কালেকশন"
                : "Historical record of past crawl jobs across all supported platforms"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs border-border/40 hover:bg-muted"
          >
            {lang === "bn" ? "রিফ্রেশ" : "Refresh List"}
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl py-12 text-center">
            <CardContent className="space-y-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit mx-auto border border-indigo-500/20">
                <Package className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                {lang === "bn" ? "কোনো ইতিহাস নেই" : "No Past Jobs Found"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {lang === "bn"
                  ? "কনসোল ট্যাবে গিয়ে যেকোনো সাইটের লিংক দিন এবং স্ক্র্যাপিং শুরু করুন।"
                  : "Paste any product link or search query in the Console tab to run your first crawl."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {jobs.map((job) => {
              const isSelected = activeJobId === job.id;
              const isRunning = job.status === "running";

              return (
                <Card
                  key={job.id}
                  className={`border transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5"
                      : "border-border/40 bg-card/60 hover:border-border/70"
                  }`}
                >
                  <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          #{job.id}
                        </span>
                        {getStatusBadge(job.status)}
                        <span className="text-xs font-bold text-foreground truncate max-w-xs md:max-w-md" title={job.query}>
                          {job.query}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3 text-indigo-400" />
                          <strong className="text-foreground">{job.result_count || 0}</strong> products
                        </span>
                        <span>•</span>
                        <span>{job.created_at ? new Date(job.created_at).toLocaleString() : ""}</span>
                        {job.cost_credits ? (
                          <>
                            <span>•</span>
                            <span className="font-mono">{job.cost_credits} credits</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {isRunning && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={stoppingJobId === job.id}
                          onClick={() => handleStopJob(job.id)}
                          className="h-7 text-xs px-2.5 gap-1"
                        >
                          <Square className="h-3 w-3" />
                          <span>{lang === "bn" ? "থামান" : "Stop"}</span>
                        </Button>
                      )}

                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectJob(job.id, job.query)}
                        className={`h-7 text-xs px-2.5 gap-1 ${
                          isSelected ? "bg-indigo-600 hover:bg-indigo-500 text-white" : ""
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        <span>{lang === "bn" ? "বিশ্লেষণ" : "Inspect"}</span>
                      </Button>

                      {job.result_path && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(job.id)}
                          className="h-7 text-xs px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          title="Download Excel"
                        >
                          {canDownload ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTargetId(job.id)}
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Job"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteJob}
        title={lang === "bn" ? "জব মুছে ফেলবেন?" : "Delete Scraper Job?"}
        description={
          lang === "bn"
            ? "এই স্ক্র্যাপিং জব এবং এর সংগৃহীত ডাটা সম্পূর্ণরূপে মুছে ফেলা হবে।"
            : "This will permanently remove the scrape job and its cached records."
        }
        confirmText={isDeleting ? "Deleting..." : (lang === "bn" ? "মুছে ফেলুন" : "Delete")}
        cancelText={lang === "bn" ? "বাতিল" : "Cancel"}
        isDanger={true}
      />
    </>
  );
}
