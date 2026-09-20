"use client";

import { useState, useMemo } from "react";
import { User, Search, CheckCircle2, XCircle, Phone, Mail, MapPin, Filter, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import type { RecipientContact } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

interface ContactSelectorModalProps {
  open: boolean;
  onClose: () => void;
  contacts: RecipientContact[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
}

export function ContactSelectorModal({
  open,
  onClose,
  contacts,
  selectedIds,
  onSelectionChange,
}: ContactSelectorModalProps) {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "phone" | "email">("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const validPhoneCount = useMemo(
    () => contacts.filter((c) => Boolean(c.phone && c.phone.trim())).length,
    [contacts]
  );
  const invalidPhoneCount = contacts.length - validPhoneCount;

  const validEmailCount = useMemo(
    () => contacts.filter((c) => Boolean(c.email && c.email.trim())).length,
    [contacts]
  );
  const invalidEmailCount = contacts.length - validEmailCount;

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.area.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === "phone") return Boolean(c.phone && c.phone.trim());
      if (filterType === "email") return Boolean(c.email && c.email.trim());

      return true;
    });
  }, [contacts, search, filterType]);

  const handleToggle = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedIds);
    filtered.forEach((c) => next.add(c.id));
    onSelectionChange(next);
  };

  const handleDeselectAllFiltered = () => {
    const next = new Set(selectedIds);
    filtered.forEach((c) => next.delete(c.id));
    onSelectionChange(next);
  };

  const isAllFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const columns = useMemo<ColumnDef<RecipientContact>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <div className="w-12 text-center">
            <Checkbox
              checked={isAllFilteredSelected}
              onCheckedChange={(c) => (c ? handleSelectAllFiltered() : handleDeselectAllFiltered())}
            />
          </div>
        ),
        cell: ({ row }) => {
          const isChecked = selectedIds.has(row.original.id);
          return (
            <div onClick={(e) => e.stopPropagation()} className="w-12 text-center">
              <Checkbox checked={isChecked} onCheckedChange={() => handleToggle(row.original.id)} />
            </div>
          );
        },
      },
      {
        accessorKey: "id",
        header: () => <span className="font-mono text-[11px]">{lang === "bn" ? "আইডি" : "ID"}</span>,
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            #{row.original.id + 1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-foreground hover:bg-transparent"
          >
            {lang === "bn" ? "লিড / প্রতিষ্ঠানের নাম" : "Lead / Business Name"}
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold text-xs text-foreground block max-w-[200px] truncate">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-foreground hover:bg-transparent"
          >
            {lang === "bn" ? "ফোন নম্বর" : "Phone Number"}
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const phone = row.original.phone;
          return (
            <div className="text-xs font-mono text-cyan-400">
              {phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-emerald-400 shrink-0" />
                  {phone}
                </span>
              ) : (
                <span className="text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">
                  {lang === "bn" ? "ফোন নেই" : "Missing Phone"}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: lang === "bn" ? "ইমেইল ঠিকানা" : "Email Address",
        cell: ({ row }) => {
          const email = row.original.email;
          return (
            <div className="text-xs font-mono text-purple-300">
              {email ? (
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <Mail className="h-3 w-3 text-purple-400 shrink-0" />
                  {email}
                </span>
              ) : (
                <span className="text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                  {lang === "bn" ? "ইমেইল নেই" : "Missing Email"}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "area",
        header: lang === "bn" ? "অবস্থান / এলাকা" : "Location / Area",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
            {row.original.area || (lang === "bn" ? "বাংলাদেশ" : "Bangladesh")}
          </span>
        ),
      },
      {
        id: "target_status",
        header: () => <div className="text-center">{lang === "bn" ? "টার্গেট স্ট্যাটাস" : "Target Status"}</div>,
        cell: ({ row }) => {
          const isChecked = selectedIds.has(row.original.id);
          return (
            <div className="text-center">
              {isChecked ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 text-[10px] py-0.5">
                  {lang === "bn" ? "✓ অন্তর্ভুক্ত" : "✓ INCLUDE"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground py-0.5">
                  {lang === "bn" ? "বাদ" : "EXCLUDE"}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "action",
        header: () => <div className="text-right pr-6">{lang === "bn" ? "অ্যাকশন" : "Action"}</div>,
        cell: ({ row }) => {
          const isChecked = selectedIds.has(row.original.id);
          return (
            <div className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant={isChecked ? "outline" : "default"}
                onClick={() => handleToggle(row.original.id)}
                className={`text-[11px] h-7 px-3 font-semibold ${
                  isChecked
                    ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                    : "bg-cyan-500 text-black hover:bg-cyan-400"
                }`}
              >
                {isChecked ? (lang === "bn" ? "বাদ দিন" : "Remove") : (lang === "bn" ? "+ যোগ" : "+ Target")}
              </Button>
            </div>
          );
        },
      },
    ],
    [lang, selectedIds, isAllFilteredSelected]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = selectedIds.size;
  const totalCount = contacts.length;
  const percentage = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-panel max-w-6xl w-[95vw] max-h-[92vh] overflow-hidden p-6 flex flex-col sm:max-w-6xl border border-cyan-500/20 shadow-2xl">
        <DialogHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <span>{lang === "bn" ? "টার্গেট লিড নির্বাচক ও পরিদর্শক" : "Granular Target Lead Selector & Inspector"}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  {lang === "bn" 
                    ? "লিডের বিবরণ দেখুন এবং ক্যাম্পেইন রূপান্তরের জন্য প্রাপকের তালিকা কাস্টমাইজ করুন" 
                    : "Inspect lead attributes and customize recipient target list for maximum campaign conversion"}
                </p>
              </div>
            </DialogTitle>

            <Badge variant="outline" className="font-mono text-xs py-1 px-3 border-cyan-500/40 text-cyan-400 bg-cyan-500/5">
              {totalCount} {lang === "bn" ? "টি লিড লোড করা হয়েছে" : "Leads Loaded"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 flex flex-col overflow-hidden">
          {/* Search & Selection Controls Toolbar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-card/40 p-3 rounded-xl border border-border/40">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "bn" ? "নাম, ফোন, ইমেইল, এলাকা ইত্যাদি দিয়ে অনুসন্ধান করুন..." : "Search leads by name, phone, email, location..."}
                className="pl-9 text-xs h-9 bg-background/80"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Quick Filter Pills with Valid & Invalid Counters */}
            <div className="flex items-center gap-1.5 bg-background/60 p-1 rounded-lg border border-border/40">
              <Button
                size="sm"
                variant={filterType === "all" ? "secondary" : "ghost"}
                onClick={() => setFilterType("all")}
                className="text-xs h-7 px-2.5 font-medium"
              >
                {lang === "bn" ? "সব" : "All"} ({contacts.length})
              </Button>
              <Button
                size="sm"
                variant={filterType === "phone" ? "secondary" : "ghost"}
                onClick={() => setFilterType("phone")}
                className="text-xs h-7 px-2.5 gap-1.5 font-medium"
              >
                <Phone className="h-3 w-3 text-emerald-400" /> {lang === "bn" ? "ফোন নম্বর আছে" : "Phone Valid"} ({validPhoneCount})
                {invalidPhoneCount > 0 && (
                  <span className="text-[11px] text-rose-400 font-mono font-semibold ml-0.5">
                    (-{invalidPhoneCount})
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                variant={filterType === "email" ? "secondary" : "ghost"}
                onClick={() => setFilterType("email")}
                className="text-xs h-7 px-2.5 gap-1.5 font-medium"
              >
                <Mail className="h-3 w-3 text-purple-400" /> {lang === "bn" ? "ইমেইল আছে" : "Email Valid"} ({validEmailCount})
                {invalidEmailCount > 0 && (
                  <span className="text-[11px] text-rose-400 font-mono font-semibold ml-0.5">
                    (-{invalidEmailCount})
                  </span>
                )}
              </Button>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAllFiltered}
                className="text-xs h-8 gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> {lang === "bn" ? "সব নির্বাচন" : "Select All"} ({filtered.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeselectAllFiltered}
                className="text-xs h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-3.5 w-3.5" /> {lang === "bn" ? "সব বাতিল" : "Unselect All"}
              </Button>
            </div>
          </div>

          {/* Dynamic Selection Dashboard Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-background to-cyan-950/20 border border-cyan-500/30 flex flex-wrap gap-4 justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <div className="font-mono text-sm font-semibold">
                <span className="text-cyan-400 text-base">{selectedCount}</span> / {totalCount} {lang === "bn" ? "টি সক্রিয় লিড টার্গেট" : "Leads Target Active"}
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-mono">
                {percentage}% {lang === "bn" ? "টার্গেট নির্বাচিত" : "Target Selected"}
              </Badge>
            </div>

            {/* Selection Progress Bar */}
            <div className="flex-1 max-w-xs h-2 bg-secondary/80 rounded-full overflow-hidden border border-border/40">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Granular Contacts Table (TanStack Table) */}
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background/60 flex-1 flex flex-col min-h-[320px]">
            <div className="overflow-y-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
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
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Filter className="h-8 w-8 text-muted-foreground/40" />
                          <p className="font-semibold text-sm">
                            {lang === "bn" ? "আপনার ফিল্টারের সাথে কোনো লিড মিলছে না" : "No lead contacts match your active filter query"}
                          </p>
                          <p className="text-xs">
                            {lang === "bn" ? "অন্য একটি ডেটাসেট নির্বাচন করুন বা সার্চ ফিল্টার মুছুন" : "Select a different dataset or clear search parameters"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => {
                      const c = row.original;
                      const isChecked = selectedIds.has(c.id);
                      return (
                        <TableRow
                          key={row.id}
                          onClick={() => handleToggle(c.id)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? "bg-cyan-500/10 hover:bg-cyan-500/15" : "hover:bg-muted/30"
                          }`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/40 pt-4 gap-3">
          <Button variant="outline" onClick={onClose} size="sm" className="text-xs h-9">
            {lang === "bn" ? "বাতিল" : "Cancel"}
          </Button>
          <Button onClick={onClose} size="sm" className="gap-2 font-bold text-xs h-9 bg-cyan-500 hover:bg-cyan-400 text-black px-5">
            <CheckCircle2 className="h-4 w-4" /> {lang === "bn" ? `বাছাই নিশ্চিত করুন (${selectedCount} জন প্রাপক)` : `Confirm Selection (${selectedCount} Contacts)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
