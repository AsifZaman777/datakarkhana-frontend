"use client";

import { useState, useMemo, Fragment } from "react";
import { ChevronDown, ChevronUp, StopCircle, Clock, CheckCircle2, XCircle, Trash2, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { marketingApi } from "@/lib/api/marketing";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignLog } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

interface CampaignHistoryProps {
  campaigns: Campaign[];
  onRefresh: () => void;
}

export function CampaignHistory({ campaigns, onRefresh }: CampaignHistoryProps) {
  const { t, lang } = useLanguage();
  const m = t.marketing || {};
  const { isAdmin } = useAuth();
  const [expandedId, setExpandedId] = useState<number | string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<CampaignLog[]>([]);
  const [stopTargetId, setStopTargetId] = useState<number | string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleToggleExpand = async (id: number | string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedLogs([]);
      return;
    }
    setExpandedId(id);
    try {
      const res = await marketingApi.campaignStatus(id);
      setExpandedLogs(res.data.logs || []);
    } catch {
      toast.error("Failed to load campaign logs.");
    }
  };

  const confirmStopCampaign = async () => {
    if (!stopTargetId) return;
    try {
      await marketingApi.stopCampaign(stopTargetId);
      toast.success("Campaign stop signal dispatched.");
      onRefresh();
    } catch {
      toast.error("Failed to stop campaign.");
    } finally {
      setStopTargetId(null);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!deleteTargetId) return;
    try {
      await marketingApi.deleteCampaign(deleteTargetId);
      toast.success("Campaign and audit logs deleted.");
      if (expandedId === deleteTargetId) {
        setExpandedId(null);
        setExpandedLogs([]);
      }
      onRefresh();
    } catch {
      toast.error("Failed to delete campaign.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleClearAuditLogs = async (campaignId: number | string) => {
    try {
      await marketingApi.clearCampaignLogs(campaignId);
      toast.success("Audit trail logs cleared.");
      setExpandedLogs([]);
    } catch {
      toast.error("Failed to clear audit logs.");
    }
  };

  const columns = useMemo<ColumnDef<Campaign>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-bold text-foreground hover:bg-transparent"
          >
            {lang === "bn" ? "আইডি" : "ID"}
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.original.id}
          </span>
        ),
      },
      {
        id: "channel",
        header: m.thChannel || (lang === "bn" ? "চ্যানেল / ধরন" : "Channel / Type"),
        cell: ({ row }) => (
          <span className="font-semibold text-xs uppercase">
            {row.original.campaign_type || row.original.type || "whatsapp"}
          </span>
        ),
      },
      {
        accessorKey: "recipient_group",
        header: m.thCampaign || (lang === "bn" ? "টার্গেট প্রাপক গ্রুপ" : "Target Recipient Group"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.recipient_group}
          </span>
        ),
      },
      {
        id: "progress",
        header: lang === "bn" ? "অগ্রগতি (প্রেরিত/মোট)" : "Progress (Sent/Total)",
        cell: ({ row }) => {
          const c = row.original;
          const sent = c.sent_count ?? c.sent ?? 0;
          const total = c.total_count ?? c.total ?? 0;
          const percent = c.progress_percent ?? (total > 0 ? Math.round((sent / total) * 100) : 0);
          const failed = c.failed_count ?? 0;

          return (
            <div className="font-mono text-xs flex items-center gap-2">
              <span className="text-cyan-400 font-bold">
                {sent} / {total}
              </span>
              <span className="text-muted-foreground text-[11px]">
                ({percent}%)
              </span>
              {failed > 0 && (
                <span className="text-rose-400 text-[11px]">
                  ({failed} {lang === "bn" ? "ব্যর্থ" : "failed"})
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: m.thStatus || (lang === "bn" ? "স্ট্যাটাস" : "Status"),
        cell: ({ row }) => {
          const c = row.original;
          return (
            <>
              {(c.status === "running" || c.status === "stopping") && (
                <div className="space-y-1">
                  <Badge variant="outline" className="border-rose-500/40 text-rose-300 bg-rose-500/10 gap-1.5 text-[10px] animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    {c.status === "stopping" ? (lang === "bn" ? "থামানো হচ্ছে..." : "Stopping...") : (lang === "bn" ? "সরাসরি প্রেরিত হচ্ছে" : "Dispatching Live")}
                  </Badge>
                  {c.est_human && (
                    <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="h-2.5 w-2.5 shrink-0" /> {c.est_human}
                    </div>
                  )}
                </div>
              )}
              {c.status === "done" && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> {lang === "bn" ? "সম্পন্ন" : "Complete"}
                </Badge>
              )}
              {(c.status === "stopped" || c.status === "failed") && (
                <Badge variant="outline" className="border-destructive/40 text-destructive gap-1 text-[10px]">
                  <XCircle className="h-3 w-3" /> {c.status === "stopped" ? (lang === "bn" ? "স্থগিত" : "STOPPED") : (lang === "bn" ? "ব্যর্থ" : "FAILED")}
                </Badge>
              )}
            </>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{lang === "bn" ? "অ্যাকশন" : "Actions"}</div>,
        cell: ({ row }) => {
          const c = row.original;
          const isExpanded = expandedId === c.id;

          return (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {c.status === "running" && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setStopTargetId(c.id)}
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  title={lang === "bn" ? "প্রেরণ থামান" : "Stop Dispatch"}
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              )}
              {isAdmin && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteTargetId(c.id)}
                  className="h-7 w-7 text-rose-400 hover:bg-rose-500/10"
                  title={lang === "bn" ? "ক্যাম্পেইন ও অডিট লগ মুছুন" : "Delete Campaign & Audit Logs"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleToggleExpand(c.id)}
                className="h-7 w-7"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          );
        },
      },
    ],
    [lang, m, isAdmin, expandedId]
  );

  const table = useReactTable({
    data: campaigns,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="glass-panel p-6">
      <CardContent className="p-0 space-y-4">
        <h3 className="text-sm font-bold text-foreground">
          {m.historyTitle || (lang === "bn" ? "ক্যাম্পেইন হিস্ট্রি ও অডিট ট্রেইল" : "Campaign Dispatch History & Audit Trail")}
        </h3>

        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 backdrop-blur z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border/40 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-bold text-foreground py-2.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12 text-xs text-muted-foreground">
                    {lang === "bn" ? "কোনো ক্যাম্পেইন পাওয়া যায়নি" : "No campaigns dispatched yet"}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const c = row.original;
                  const isExpanded = expandedId === c.id;

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className="cursor-pointer border-border/20 text-xs hover:bg-muted/30 transition-colors"
                        onClick={() => handleToggleExpand(c.id)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Expandable Logs Sub-Table */}
                      {isExpanded && (
                        <TableRow className="bg-card/40 hover:bg-card/40">
                          <TableCell colSpan={columns.length} className="p-4">
                            <div className="rounded-lg border border-border/40 p-4 bg-black/80 space-y-2 max-h-[200px] overflow-y-auto font-mono text-xs">
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold text-cyan-400">
                                  {lang === "bn" ? `ক্যাম্পেইন #${c.id} অডিট ট্রেইল ও কন্টাক্ট লগ:` : `Campaign #${c.id} Audit Trail & Contact Logs:`}
                                </div>
                                {isAdmin && expandedLogs.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleClearAuditLogs(c.id)}
                                    className="h-6 px-2 text-[10px] text-rose-400 hover:bg-rose-500/10 gap-1 font-sans"
                                  >
                                    <Trash2 className="h-3 w-3" /> {lang === "bn" ? "লগ মুছুন" : "Clear Audit Logs"}
                                  </Button>
                                )}
                              </div>
                              {expandedLogs.length > 0 ? (
                                expandedLogs.map((log, idx) => {
                                  let logText = "";
                                  let isSuccess = false;
                                  let isError = false;
                                  let isInfo = false;

                                  if (typeof log === "string") {
                                    logText = log;
                                    const lower = log.toLowerCase();
                                    isSuccess = lower.includes("sent") || lower.includes("success") || lower.includes("done");
                                    isError = lower.includes("fail") || lower.includes("error") || lower.includes("aborted") || lower.includes("timeout");
                                    isInfo = !isSuccess && !isError;
                                  } else if (log && typeof log === "object") {
                                    if (log.message) {
                                      logText = log.message;
                                    } else if (log.phone || log.email || log.name) {
                                      logText = `${log.name || "Contact"} (${log.phone || log.email || ""})`;
                                    } else {
                                      logText = JSON.stringify(log);
                                    }

                                    const statusStr = String(log.status || log.message || "").toLowerCase();
                                    isSuccess = statusStr.includes("success") || statusStr.includes("sent") || statusStr.includes("done");
                                    isError = statusStr.includes("fail") || statusStr.includes("error");
                                    isInfo = !isSuccess && !isError;
                                  } else {
                                    logText = String(log);
                                  }

                                  return (
                                    <div key={idx} className="flex items-center justify-between text-muted-foreground border-b border-border/20 py-1.5 gap-2 text-xs">
                                      <span className="font-mono text-[11px] truncate flex-1">{logText}</span>
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded text-[10px] shrink-0 font-bold",
                                          isSuccess && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                                          isError && "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                                          isInfo && "bg-secondary text-muted-foreground"
                                        )}
                                      >
                                        {isSuccess ? "DELIVERED" : isError ? "FAILED" : "INFO"}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-6 text-muted-foreground text-[11px]">
                                  {lang === "bn" ? "কোনো বিস্তারিত লগ পাওয়া যায়নি" : "No granular dispatch logs available"}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Stop Confirmation Modal */}
      <ConfirmModal
        open={stopTargetId !== null}
        onClose={() => setStopTargetId(null)}
        onConfirm={confirmStopCampaign}
        title={lang === "bn" ? "ক্যাম্পেইন প্রেরণ থামাবেন?" : "Stop Campaign Dispatch?"}
        description={lang === "bn" 
          ? "সরাসরি প্রেরণ বন্ধ হয়ে যাবে। ইতিমধ্যে প্রেরিত বার্তা সংরক্ষিত থাকবে।" 
          : "Active messaging will halt immediately. Already dispatched messages are safely retained in history."}
        confirmText={lang === "bn" ? "থামান" : "Stop Campaign"}
        isDanger
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteCampaign}
        title={lang === "bn" ? "ক্যাম্পেইন ও অডিট লগ মুছে ফেলবেন?" : "Delete Campaign & Audit Logs?"}
        description={lang === "bn" 
          ? "এই ক্যাম্পেইনের সমস্ত রেকর্ড ও অডিট ট্রেইল স্থায়ীভাবে মুছে ফেলা হবে।" 
          : "This action will permanently purge this campaign and all associated contact audit records."}
        confirmText={lang === "bn" ? "মুছে ফেলুন" : "Delete Campaign"}
        isDanger
      />
    </Card>
  );
}
