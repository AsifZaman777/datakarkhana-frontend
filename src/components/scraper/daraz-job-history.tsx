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
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { scraperApi } from "@/lib/api/scraper";
import { darazApi } from "@/lib/api/daraz";
import type { ScraperJob } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";

interface DarazJobHistoryProps {
  jobs: ScraperJob[];
  onRefresh: () => void;
  activeJobId?: number | null;
  onSelectJob: (jobId: number, query: string) => void;
  onOpenPaymentModal?: () => void;
}

export function DarazJobHistory({
  jobs,
  onRefresh,
  activeJobId,
  onSelectJob,
  onOpenPaymentModal,
}: DarazJobHistoryProps) {
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
          ? "দারাজ এক্সেল ফাইল ডাউনলোড সুবিধা শুধু প্রো ও এন্টারপ্রাইজ গ্রাহকদের জন্য। সম্পূর্ণ ডাটা প্রাইভেট ক্যাটালগে দেখতে পাচ্ছেন।"
          : "Raw Excel download is available exclusively for Pro and Enterprise plans.",
        {
          action: onOpenPaymentModal
            ? {
                label: lang === "bn" ? "আপগ্রেড করুন" : "Upgrade Plan",
                onClick: onOpenPaymentModal,
              }
            : undefined,
        }
      );
      return;
    }
    window.open(darazApi.downloadJobUrl(jobId), "_blank");
  };

  if (jobs.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl p-12 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-bold text-sm text-foreground">
          {lang === "bn" ? "কোন পূর্ববর্তী দারাজ স্ক্র্যাপিং জব নেই" : "No Daraz Scraping Jobs Yet"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          {lang === "bn"
            ? "আপনার প্রথম দারাজ প্রোডাক্ট সার্চ শুরু করুন এবং পণ্য ডাটা বিশ্লেষণ তৈরি করুন।"
            : "Launch your first Daraz product intelligence search from the console tab."}
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-accent/40 text-muted-foreground border-b border-border/40 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 text-left">ID</th>
                  <th className="py-2.5 px-4 text-left">{lang === "bn" ? "সার্চ কুয়েরি" : "Search Query"}</th>
                  <th className="py-2.5 px-4 text-left">{lang === "bn" ? "স্ট্যাটাস" : "Status"}</th>
                  <th className="py-2.5 px-4 text-left">{lang === "bn" ? "সংগৃহীত পণ্য" : "Items Scraped"}</th>
                  <th className="py-2.5 px-4 text-left">{lang === "bn" ? "তারিখ" : "Date"}</th>
                  <th className="py-2.5 px-4 text-right">{lang === "bn" ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {jobs.map((job) => {
                  const isRunning = job.status === "running";
                  const isDone = job.status === "done";
                  const isStopped = job.status === "stopped";
                  const isActive = job.id === activeJobId;

                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-accent/20 transition-colors ${
                        isActive ? "bg-orange-500/5 font-medium" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        #{job.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{job.query}</div>
                        <div className="text-[10px] text-muted-foreground">Daraz Bangladesh</div>
                      </td>
                      <td className="py-3 px-4">
                        {isRunning && (
                          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 gap-1 text-[10px] py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Running
                          </Badge>
                        )}
                        {isDone && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1 text-[10px] py-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                        {isStopped && (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1 text-[10px] py-0.5">
                            <Clock className="h-3 w-3" />
                            Stopped ({job.result_count || 0})
                          </Badge>
                        )}
                        {!isRunning && !isDone && !isStopped && (
                          <Badge variant="destructive" className="gap-1 text-[10px] py-0.5">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-orange-400 text-sm">
                          {job.result_count || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">products</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                        {job.created_at ? new Date(job.created_at).toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isRunning ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={stoppingJobId === job.id}
                              onClick={() => handleStopJob(job.id)}
                              className="h-7 text-xs px-2 gap-1"
                            >
                              <Square className="h-3 w-3" />
                              {lang === "bn" ? "থামুন" : "Stop"}
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSelectJob(job.id, job.query)}
                                className="h-7 text-xs px-2.5 gap-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                              >
                                <Eye className="h-3 w-3" />
                                {lang === "bn" ? "এনালাইসিস" : "Analysis"}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(job.id)}
                                className={`h-7 text-xs px-2 gap-1 ${
                                  canDownload
                                    ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    : "border-border/40 text-muted-foreground"
                                }`}
                              >
                                {canDownload ? (
                                  <Download className="h-3 w-3" />
                                ) : (
                                  <Lock className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTargetId(job.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteJob}
        title={lang === "bn" ? "জব মুছে ফেলবেন?" : "Delete Scraper Job?"}
        description={
          lang === "bn"
            ? "এই স্ক্র্যাপিং জব এবং এর ফলাফল ডাটা স্থায়ীভাবে মুছে ফেলা হবে।"
            : "This will permanently remove this Daraz scraping job and its collected product records."
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        isDanger={true}
      />
    </>
  );
}
