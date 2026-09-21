"use client";

import {
  Eye,
  Lock,
  Trash2,
  Play,
  Send,
  Clock,
  CheckCircle2,
  Download,
  Cloud,
  CloudOff,
  FileSpreadsheet,
  Globe,
  MapPin,
  Database,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/providers/language-provider";
import { datasetsApi } from "@/lib/api/datasets";
import { toast } from "sonner";
import type { Dataset, User } from "@/lib/types";

interface CustomDatasetCardProps {
  dataset: Dataset;
  token: string;
  onView: (id: number) => void;
  onUseLeads: (id: number) => void;
  onDelete: (dataset: Dataset) => void;
  onPromote: (dataset: Dataset) => void;
  onSync?: (dataset: Dataset) => void;
  onDesync?: (dataset: Dataset) => void;
  isAdmin: boolean;
  user?: User | null;
  isSyncing?: boolean;
  isDesyncing?: boolean;
}

export function CustomDatasetCard({
  dataset,
  token,
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
}: CustomDatasetCardProps) {
  const { lang, t } = useLanguage();
  const ct = t.catalog || {};

  const canSync =
    isAdmin ||
    user?.allow_sync === 1 ||
    user?.plan_tier === "pro" ||
    user?.plan_tier === "enterprise";

  const isDaraz =
    (dataset.name || "").toLowerCase().includes("daraz") ||
    (dataset.category || "").toLowerCase().includes("daraz");

  const canDownload =
    isAdmin ||
    (user?.effective_permissions
      ? (isDaraz ? !!user.effective_permissions.allow_daraz_download : !!user.effective_permissions.allow_dataset_download)
      : (user?.allow_download !== undefined && user?.allow_download !== null
          ? user.allow_download === 1
          : ["pro", "enterprise"].includes((user?.plan_tier || "").toLowerCase())));

  const locationText =
    dataset.area || dataset.district || dataset.division || "Bangladesh";

  return (
    <Card className="glass-panel border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 flex flex-col justify-between">
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 gap-1 text-[10px] font-bold">
              <FileSpreadsheet className="h-3 w-3" /> CUSTOM EXCEL
            </Badge>
            {dataset.is_synced === 1 && (
              <Badge
                variant="outline"
                className="text-[10px] font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1"
              >
                <Cloud className="h-3 w-3" /> SYNCED
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground border-border/50">
              {dataset.category}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {canDownload ? (
              <a
                href={datasetsApi.exportUrl(dataset.id, "excel", token)}
                download
                className="h-6 w-6 inline-flex items-center justify-center rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Download Formatted Excel File"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  toast.warning(
                    isDaraz
                      ? (lang === "bn"
                          ? "দারাজ এক্সেল ফাইল ডাউনলোড সুবিধা আপনার টিয়ার পলিসিতে বন্ধ আছে।"
                          : "Daraz raw Excel download is restricted for your subscription tier.")
                      : (lang === "bn"
                          ? "ক্যাটালগ ফাইল ডাউনলোড আপনার একাউন্ট বা সাবস্ক্রিপশন টিয়ারে বন্ধ রয়েছে।"
                          : "Dataset file downloads are disabled for your subscription tier or account policy.")
                  );
                }}
                className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-not-allowed"
                title={isDaraz ? "Daraz download locked by tier policy" : "Download locked by policy"}
              >
                <Lock className="h-3.5 w-3.5 text-amber-400/80" />
              </button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(dataset)}
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              title="Delete Dataset"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <h3 className="font-bold text-base text-foreground line-clamp-1">{dataset.name}</h3>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{ct.covering || "Location"}: {locationText}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-400 font-bold font-mono">
              {ct.leadsParsed || "Records"}: {dataset.row_count}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 py-3 border-t border-border/40 flex flex-col gap-2 bg-card/40">
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(dataset.id)}
            className="flex-1 gap-1 text-xs h-8"
          >
            <Eye className="h-3.5 w-3.5" /> {ct.btnView || "View"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onUseLeads(dataset.id)}
            className="flex-1 gap-1 text-xs h-8 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Play className="h-3.5 w-3.5" /> {ct.btnUseLeads || "Use Leads"}
          </Button>
        </div>

        {/* CLOUD SYNC BUTTON / STATUS */}
        {dataset.is_synced === 1 ? (
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
                onClick={() => onDesync(dataset)}
                className="h-6 text-[10px] px-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 gap-1 font-medium"
                title="Desync from cloud (frees cloud bucket quota, keeps local dataset)"
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
            onClick={() => onSync?.(dataset)}
            disabled={isSyncing}
            className="w-full text-xs h-8 gap-1.5 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 font-semibold"
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
        {dataset.promotion_status === "pending" ? (
          <Button size="sm" variant="outline" disabled className="w-full text-xs h-8 text-amber-500 border-amber-500/30 gap-1">
            <Clock className="h-3.5 w-3.5" /> Promotion Pending Review
          </Button>
        ) : dataset.promotion_status === "approved" ? (
          <Button size="sm" variant="outline" disabled className="w-full text-xs h-8 text-emerald-400 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Published to Public Catalog
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onPromote(dataset)}
            className="w-full text-xs h-8 gap-1 font-semibold bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Send className="h-3.5 w-3.5" />
            {isAdmin
              ? ct.btnPromoteAdmin || "Promote to Public Catalog"
              : ct.btnPromote || "Request Catalog Promotion"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
