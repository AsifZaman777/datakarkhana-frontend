"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Send, Phone, MapPin, ArrowUpDown, Lock } from "lucide-react";
import { scraperApi, type ScrapedDataItem } from "@/lib/api/scraper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { LoadingBackdrop } from "@/components/ui/loading-backdrop";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

interface ScrapedDataModalProps {
  jobId: number | null;
  open: boolean;
  onClose: () => void;
}

export function ScrapedDataModal({ jobId, open, onClose }: ScrapedDataModalProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScrapedDataItem[]>([]);
  const [query, setQuery] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const canDownload =
    isAdmin ||
    (user?.effective_permissions
      ? !!user.effective_permissions.allow_dataset_download
      : (user?.allow_download !== undefined && user?.allow_download !== null
          ? user.allow_download === 1
          : ["pro", "enterprise"].includes((user?.plan_tier || "").toLowerCase())));

  useEffect(() => {
    if (!open || !jobId) return;

    setLoading(true);
    scraperApi
      .jobData(jobId)
      .then((res) => {
        setData(res.data.data || []);
        setQuery(res.data.query || "Scraped Dataset");
      })
      .catch(() => {
        toast.error("Failed to load scraped data records.");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [open, jobId]);

  const columns = useMemo<ColumnDef<ScrapedDataItem>[]>(
    () => [
      {
        accessorKey: "Name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-bold text-foreground hover:bg-transparent"
          >
            Business Name
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-foreground max-w-[200px] truncate block">
            {row.original.Name || "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "Phone",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-bold text-foreground hover:bg-transparent"
          >
            Phone Number
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const phone = row.original.Phone;
          return (
            <span className="font-mono">
              {phone ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {phone}
                </span>
              ) : (
                <span className="text-muted-foreground/60 italic text-[11px]">No Phone</span>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "Category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.Category || "N/A"}</span>
        ),
      },
      {
        accessorKey: "Rating",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-bold text-foreground hover:bg-transparent"
          >
            Rating
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-amber-400 font-mono">{row.original.Rating || "-"}</span>
        ),
      },
      {
        accessorKey: "Address",
        header: "Address",
        cell: ({ row }) => {
          const addr = row.original.Address;
          return (
            <span className="text-muted-foreground max-w-[220px] truncate block">
              {addr ? (
                <span className="flex items-center gap-1" title={addr}>
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{addr}</span>
                </span>
              ) : (
                "-"
              )}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const withPhoneCount = useMemo(
    () => data.filter((d) => d.Phone && d.Phone.trim().length > 3).length,
    [data]
  );

  const handleUseInCampaign = () => {
    if (!jobId) return;
    onClose();
    router.push(`/marketing?tab=whatsapp&group=job_${jobId}`);
  };

  const handleDownloadExcel = () => {
    if (!jobId) return;
    if (!canDownload) {
      toast.warning("Dataset file downloads are disabled for your subscription tier or account policy.");
      return;
    }
    const url = scraperApi.downloadJobUrl(jobId);
    window.open(url, "_blank");
  };

  const totalFilteredRows = table.getRowModel().rows.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col glass-panel border-cyan-500/30 p-6 overflow-hidden">
        <DialogHeader className="space-y-1 pb-3 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Private Scraped Catalogue Data</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Search query: <span className="text-foreground font-semibold">"{query}"</span> — Previewing scraped business lead entries stored in your dataset.
          </DialogDescription>
        </DialogHeader>

        {/* Top Controls / Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all fields..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0 w-full sm:w-auto justify-end">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 gap-1">
              <Phone className="h-3 w-3" /> {withPhoneCount} / {data.length} Leads with Phone
            </Badge>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto border border-border/40 rounded-lg bg-black/40">
          {loading ? (
            <LoadingBackdrop variant="inline" label="Loading scraped dataset records..." color="cyan" size="sm" />
          ) : totalFilteredRows > 0 ? (
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
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-border/20 hover:bg-cyan-500/5 text-xs">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-xs text-muted-foreground">
              {globalFilter ? "No matching records found for search filter." : "No records found in this dataset."}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground font-mono">
            Total Displayed: <span className="text-foreground font-bold">{totalFilteredRows}</span> items
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={data.length === 0}
              className={`gap-1.5 text-xs ${!canDownload ? "opacity-60 cursor-not-allowed" : ""}`}
              title={canDownload ? "Download Excel Spreadsheet" : "Download locked by policy"}
            >
              {canDownload ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-amber-400" />}
              {canDownload ? "Download Excel" : "Download Locked"}
            </Button>

            <Button
              size="sm"
              onClick={handleUseInCampaign}
              disabled={data.length === 0}
              className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Send className="h-3.5 w-3.5" /> Use in Campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
