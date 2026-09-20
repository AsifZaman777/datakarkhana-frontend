"use client";

import { useMemo, useState } from "react";
import { Shield, Plus, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import type { SecurityViolation } from "@/lib/types";

interface SecurityViolationsProps {
  violations: SecurityViolation[];
  onRefresh: () => void;
}

export function SecurityViolations({ violations, onRefresh }: SecurityViolationsProps) {
  const { lang } = useLanguage();
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSeed = async () => {
    try {
      await adminApi.seedTestViolations();
      toast.success(
        lang === "bn"
          ? "নমুনা সিকিউরিটি ভায়োলেশন লগ সফলভাবে যুক্ত হয়েছে।"
          : "Sample security violation logs inserted."
      );
      onRefresh();
    } catch {
      toast.error(
        lang === "bn"
          ? "টেস্ট লগ তৈরি করতে ব্যর্থ হয়েছে।"
          : "Failed to seed test logs."
      );
    }
  };

  const columns = useMemo<ColumnDef<SecurityViolation>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "লগ #" : "Log #"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.original.id}
          </span>
        ),
      },
      {
        id: "user",
        header: lang === "bn" ? "ব্যবহারকারীর ইমেইল / আইডি" : "User Email / ID",
        accessorFn: (v) => v.user_email || `User #${v.user_id || "Guest"}`,
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "violation_type",
        header: lang === "bn" ? "লঙ্ঘনের ধরণ" : "Intercepted Violation Type",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="border-destructive/40 text-destructive text-[10px]"
          >
            {row.original.violation_type}
          </Badge>
        ),
      },
      {
        accessorKey: "ip_address",
        header: lang === "bn" ? "আইপি ঠিকানা" : "IP Address",
        cell: ({ row }) => (
          <span className="text-xs font-mono text-cyan-400">
            {row.original.ip_address || "127.0.0.1"}
          </span>
        ),
      },
      {
        accessorKey: "timestamp",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "সময়" : "Timestamp"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.timestamp}
          </span>
        ),
      },
    ],
    [lang]
  );

  const table = useReactTable({
    data: violations,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="glass-panel p-6 border-destructive/30">
      <CardContent className="p-0 space-y-4">
        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <h3 className="text-sm font-bold text-foreground">
              {lang === "bn"
                ? "অ্যান্টি-লিক ও সিকিউরিটি সেন্সর লঙ্ঘন লগ"
                : "Anti-Leak & Security Sensor Violation Logs"}
            </h3>
          </div>

          <Button size="sm" variant="outline" onClick={handleSeed} className="gap-1 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />{" "}
            {lang === "bn" ? "টেস্ট লগ তৈরি করুন" : "Seed Test Logs"}
          </Button>
        </div>

        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-border/40 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold py-2.5">
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
                <TableRow key={row.id} className="border-b border-border/20 hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {violations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground">
                    {lang === "bn" ? "এখনো কোনো সিকিউরিটি লঙ্ঘন পাওয়া যায়নি।" : "No security violations logged yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

