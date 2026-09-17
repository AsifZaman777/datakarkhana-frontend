"use client";

import { Eye, Lock, Trash2, Play, Send, Clock, CheckCircle2, Download, Cloud, CloudOff } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/providers/language-provider";
import { scraperApi } from "@/lib/api/scraper";
import type { ScraperJob, User } from "@/lib/types";

interface PrivateDatasetCardProps {
  job: ScraperJob;
  onView: (jobId: number) => void;
  onUseLeads: (jobId: number) => void;
  onDelete: (jobId: number, query: string) => void;
  onPromote: (jobId: number, query: string) => void;
  onSync?: (job: ScraperJob) => void;
  onDesync?: (job: ScraperJob) => void;
  isAdmin: boolean;
  user?: User | null;
  isSyncing?: boolean;
  isDesyncing?: boolean;
}

export function PrivateDatasetCard({
  job,
  onView,
  onUseLeads,
  onDelete,
  onPromote,
  onSync,
  onDesync,
  isAdmin,
  user,
  isSyncing = false,
  isDesyncing = false,
}: PrivateDatasetCardProps) {
  const { t } = useLanguage();
  const ct = t.catalog || {};

  // Cloud sync eligibility check:
  // Allowed if admin, user has custom allow_sync permission, or has pro/enterprise tier
  const canSync =
    isAdmin ||
    user?.allow_sync === 1 ||
    user?.plan_tier === "pro" ||
    user?.plan_tier === "enterprise";

  return (
    <Card className="glass-panel border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 flex flex-col justify-between">
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 gap-1 text-[10px] font-bold">
              <Lock className="h-3 w-3" /> PRIVATE LOCAL LEAD
            </Badge>
            {job.is_synced === 1 && (
              <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1">
                <Cloud className="h-3 w-3" /> SYNCED
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {(job.status === "done" || job.status === "stopped") && (
              <a
                href={scraperApi.downloadJobUrl(job.id)}
                download
                className="h-6 w-6 inline-flex items-center justify-center rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Download Excel Spreadsheet"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(job.id, job.query)}
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              title="Delete Scrape Job"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <h3 className="font-bold text-base text-foreground line-clamp-1">{job.query}</h3>

        <div className="space-y-1 text-xs text-muted-foreground font-mono">
          <div>Location: {job.area || job.district || "BD"}</div>
          <div className="text-emerald-400 font-bold">
            {ct.leadsParsed || "Leads parsed"}: {job.result_count || 0}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border/40 flex flex-col gap-2 bg-card/40">
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(job.id)}
            className="flex-1 gap-1 text-xs h-8"
          >
            <Eye className="h-3.5 w-3.5" /> {ct.btnView || "View"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onUseLeads(job.id)}
            className="flex-1 gap-1 text-xs h-8 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Play className="h-3.5 w-3.5" /> {ct.btnUseLeads || "Use Leads"}
          </Button>
        </div>

        {/* CLOUD SYNC BUTTON / STATUS */}
        {job.is_synced === 1 ? (
          <div className="w-full flex items-center justify-between gap-1.5 py-1 px-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5" />
              <span>Synced to Cloud</span>
            </div>
            {onDesync && (
              <Button
                size="sm"
                variant="ghost"
                disabled={isDesyncing}
                onClick={() => onDesync(job)}
                className="h-6 text-[10px] px-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 gap-1 font-medium"
                title="Desync from cloud (removes from Supabase bucket & cloud DB, keeps local file)"
              >
                <CloudOff className="h-3 w-3" />
                {isDesyncing ? "Desyncing..." : "Desync"}
              </Button>
            )}
          </div>
        ) : canSync ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSync?.(job)}
            disabled={isSyncing}
            className="w-full text-xs h-8 gap-1.5 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-semibold"
          >
            <Cloud className="h-3.5 w-3.5" />
            {isSyncing ? "Syncing..." : "Sync to Cloud (PostgreSQL)"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="w-full text-xs h-8 gap-1.5 opacity-60 text-muted-foreground border-border/40 cursor-not-allowed"
            title="Cloud sync is exclusive to Pro Growth Pack and Enterprise Mega Pack users, or requires Admin permission."
          >
            <Lock className="h-3.5 w-3.5 text-amber-500/70" />
            <span>Sync to Cloud (Pro / Enterprise)</span>
          </Button>
        )}

        {/* PROMOTION STATUS & ACTION */}
        {job.promotion_status === "pending" ? (
          <Button size="sm" variant="outline" disabled className="w-full text-xs h-8 text-amber-500 border-amber-500/30 gap-1">
            <Clock className="h-3.5 w-3.5" /> Promotion Pending Review
          </Button>
        ) : job.promotion_status === "approved" ? (
          <Button size="sm" variant="outline" disabled className="w-full text-xs h-8 text-emerald-400 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Published to Public Catalog
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onPromote(job.id, job.query)}
            className="w-full text-xs h-8 gap-1 font-semibold"
          >
            <Send className="h-3.5 w-3.5" />
            {job.promotion_status === "rejected"
              ? "Re-request Promotion"
              : isAdmin
              ? ct.btnPromoteAdmin || "Promote to Public Catalog"
              : ct.btnPromote || "Request Catalog Promotion"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
