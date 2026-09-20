"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Key, Copy, Check, Plus, RefreshCw, Calendar, AlertTriangle, ShieldCheck, ShieldAlert, Clock, Coins, UserCheck, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import type { LicenseRecord, User } from "@/lib/types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

export function LicenseManagement() {
  const { t, lang } = useLanguage();
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual generation modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [creditsAmount, setCreditsAmount] = useState<number>(500);
  const [customKey, setCustomKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Extend modal
  const [extendTarget, setExtendTarget] = useState<LicenseRecord | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [isExtending, setIsExtending] = useState(false);

  const loadLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const [licRes, usersRes] = await Promise.allSettled([
        adminApi.listLicenses(),
        adminApi.listUsers(),
      ]);
      if (licRes.status === "fulfilled") {
        setLicenses(licRes.value.data || []);
      } else {
        toast.error("Failed to load licenses.");
      }
      if (usersRes.status === "fulfilled") {
        setRegisteredUsers(usersRes.value.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSelectUser = (email: string) => {
    setCustomerEmail(email);
    const found = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found && found.full_name) {
      setCustomerName(found.full_name);
    }
  };

  const handleGenerate = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await adminApi.generateLicense({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || undefined,
        expiry_days: expiryDays,
        custom_key: customKey.trim() || undefined,
        credits_amount: creditsAmount || 0,
      });
      toast.success(`Production key generated: ${res.data.license.production_key}`);
      setShowGenerateModal(false);
      setCustomerName("");
      setCustomerEmail("");
      setCustomKey("");
      setCreditsAmount(500);
      loadLicenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to generate license.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    setIsExtending(true);
    try {
      await adminApi.extendLicense(extendTarget.id, extendDays);
      toast.success(`License extended by ${extendDays} days!`);
      setExtendTarget(null);
      loadLicenses();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to extend license.");
    } finally {
      setIsExtending(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm("Are you sure you want to revoke this license? The customer desktop app will be locked.")) return;
    try {
      await adminApi.revokeLicense(id);
      toast.info("License revoked.");
      loadLicenses();
    } catch {
      toast.error("Failed to revoke license.");
    }
  };

  return (
    <Card className="glass-panel p-6">
      <CardContent className="p-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              {lang === "bn"
                ? "ডেস্কটপ প্রোডাকশন কি ব্যবস্থাপনা ও মেয়াদ"
                : "Desktop Production Key Management & Expirations"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "bn"
                ? "ডেস্কটপ গ্রাহকদের জন্য প্রোডাকশন কি তৈরি, মেয়াদ নির্ধারণ এবং বিতরণ নিয়ন্ত্রণ করুন।"
                : "Control, assign expiration dates, and distribute production keys to local desktop customers."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadLicenses}
              disabled={loading}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {lang === "bn" ? "রিফ্রেশ" : "Refresh"}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowGenerateModal(true)}
              className="h-8 text-xs bg-primary text-primary-foreground font-bold hover:bg-primary/90 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {lang === "bn" ? "প্রোডাকশন কি তৈরি করুন" : "Generate Production Key"}
            </Button>
          </div>
        </div>

        {/* License Table (TanStack Table) */}
        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <LicenseTanStackTable
            licenses={licenses}
            copiedId={copiedId}
            copyToClipboard={copyToClipboard}
            onExtend={(lic) => {
              setExtendTarget(lic);
              setExtendDays(30);
            }}
            onRevoke={handleRevoke}
            lang={lang}
          />
        </div>
      </CardContent>

      {/* ── GENERATE KEY MODAL ── */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Key className="h-5 w-5 text-primary" />
              {lang === "bn" ? "প্রোডাকশন কি তৈরি করুন" : "Generate Production Key"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "আপনার গ্রাহকের জন্য ক্রেডিট এবং মেয়াদসহ একটি সাইন করা লাইসেন্স কি তৈরি করুন।"
                : "Create a signed license key with credits and an expiration date for your customer."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Quick user selection */}
            {registeredUsers.length > 0 && (
              <div className="space-y-1.5 p-2 rounded-lg bg-background/80 border border-border/50">
                <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <UserCheck className="h-3 w-3 text-primary" />
                  {lang === "bn" ? "নিবন্ধিত ব্যবহারকারীকে দ্রুত বরাদ্দ:" : "Quick Assign to Registered User:"}
                </Label>
                <select
                  aria-label="Quick Assign to Registered User"
                  className="w-full h-8 text-xs rounded-md bg-card border border-border px-2 text-foreground"
                  onChange={(e) => {
                    if (e.target.value) handleSelectUser(e.target.value);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {lang === "bn"
                      ? "-- একজন ব্যবহারকারী নির্বাচন করুন বা নিচে লিখুন --"
                      : "-- Select a registered user or enter details below --"}
                  </option>
                  {registeredUsers.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.full_name} ({u.email}) — {lang === "bn" ? "বর্তমান ক্রেডিট" : "Current Credits"}: {u.credits}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "গ্রাহক / কোম্পানির নাম:" : "Customer / Company Name:"}
              </Label>
              <Input
                placeholder={lang === "bn" ? "যেমন: একমি এজেন্সি লিমিটেড" : "e.g. Acme Agency Ltd."}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "গ্রাহকের ইমেইল (ঐচ্ছিক, অ্যাকাউন্ট লিঙ্ক হবে):" : "Customer Email (Optional, auto-links account):"}
              </Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Credits Amount */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                {lang === "bn" ? "অ্যাক্টিভেশনের সাথে যুক্ত হওয়ার ক্রেডিট:" : "Credits to Add Upon Activation:"}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={creditsAmount === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreditsAmount(c)}
                    className={`text-xs h-8 ${creditsAmount === c ? "bg-amber-500 text-black font-bold" : "border-border/60"}`}
                  >
                    +{c}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground">
                  {lang === "bn" ? "অথবা কাস্টম ক্রেডিট:" : "Or custom credits:"}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                  className="h-8 w-28 text-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground">{lang === "bn" ? "ক্রেডিট" : "credits"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {lang === "bn" ? "লাইসেন্স মেয়াদের সময়কাল:" : "License Validity Duration:"}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: lang === "bn" ? "৩০ দিন" : "30 Days", days: 30 },
                  { label: lang === "bn" ? "৬০ দিন" : "60 Days", days: 60 },
                  { label: lang === "bn" ? "৯০ দিন" : "90 Days", days: 90 },
                  { label: lang === "bn" ? "১ বছর" : "1 Year", days: 365 },
                ].map((p) => (
                  <Button
                    key={p.days}
                    type="button"
                    variant={expiryDays === p.days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpiryDays(p.days)}
                    className={`text-xs h-8 ${expiryDays === p.days ? "bg-primary text-primary-foreground font-bold" : "border-border/60"}`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground">
                  {lang === "bn" ? "অথবা নির্দিষ্ট দিন:" : "Or custom days:"}
                </span>
                <Input
                  type="number"
                  min={1}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                  className="h-8 w-24 text-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground">{lang === "bn" ? "দিন" : "days"}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "কাস্টম কি ফরম্যাট (ঐচ্ছিক):" : "Custom Key Format (Optional):"}
              </Label>
              <Input
                placeholder={lang === "bn" ? "খালি রাখলে স্বয়ংক্রিয় (যেমন: DK-PROD-2026-XXXX)" : "Auto-generated if blank (e.g. DK-PROD-2026-XXXX)"}
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowGenerateModal(false)} className="h-8 text-xs">
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-8 text-xs bg-primary text-primary-foreground font-bold"
            >
              {isGenerating
                ? (lang === "bn" ? "তৈরি হচ্ছে..." : "Generating...")
                : (lang === "bn" ? "কি তৈরি করুন" : "Generate Key")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EXTEND KEY MODAL ── */}
      <Dialog open={!!extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Calendar className="h-5 w-5 text-primary" />
              {lang === "bn" ? "লাইসেন্স মেয়াদ বৃদ্ধি" : "Extend License Expiration"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lang === "bn"
                ? `${extendTarget?.customer_name}-এর লাইসেন্সে অতিরিক্ত মেয়াদ যুক্ত করুন।`
                : `Add more validity days to ${extendTarget?.customer_name}’s license.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 rounded bg-background/60 border border-border/50">
              <div className="font-semibold">{extendTarget?.production_key}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {lang === "bn" ? "বর্তমান মেয়াদ শেষ: " : "Currently expires: "}
                {extendTarget ? new Date(extendTarget.expires_at).toLocaleDateString() : ""}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{lang === "bn" ? "দিন যোগ করুন:" : "Add Days:"}</Label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 180].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={extendDays === d ? "default" : "outline"}
                    onClick={() => setExtendDays(d)}
                    className="h-8 text-xs"
                  >
                    +{d} {lang === "bn" ? "দিন" : "Days"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExtendTarget(null)} className="h-8 text-xs">
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleExtend}
              disabled={isExtending}
              className="h-8 text-xs bg-primary text-primary-foreground font-bold"
            >
              {isExtending
                ? (lang === "bn" ? "বৃদ্ধি করা হচ্ছে..." : "Extending...")
                : (lang === "bn" ? "মেয়াদ বৃদ্ধি নিশ্চিত করুন" : "Confirm Extension")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface LicenseTanStackTableProps {
  licenses: LicenseRecord[];
  copiedId: string | null;
  copyToClipboard: (text: string, id: string) => void;
  onExtend: (lic: LicenseRecord) => void;
  onRevoke: (id: number) => void;
  lang: string;
}

function LicenseTanStackTable({
  licenses,
  copiedId,
  copyToClipboard,
  onExtend,
  onRevoke,
  lang,
}: LicenseTanStackTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<LicenseRecord>[]>(
    () => [
      {
        accessorKey: "customer_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "গ্রাহক" : "Customer"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const lic = row.original;
          return (
            <div>
              <div className="font-semibold text-foreground">{lic.customer_name}</div>
              {(lic.customer_email || lic.user_email_ref) && (
                <div className="text-[11px] text-muted-foreground">
                  {lic.customer_email || lic.user_email_ref}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "production_key",
        header: lang === "bn" ? "প্রোডাকশন কি" : "Production Key",
        cell: ({ row }) => {
          const lic = row.original;
          const isCopied = copiedId === lic.production_key;
          return (
            <div className="flex items-center gap-1.5">
              <code className="text-[11px] font-mono font-semibold bg-muted/60 px-2 py-0.5 rounded border border-border/40 text-foreground">
                {lic.production_key}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-primary/10"
                onClick={() => copyToClipboard(lic.production_key, lic.production_key)}
                title="Copy Key"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "credits_amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "ক্রেডিট" : "Credits"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const creds = row.original.credits_amount;
          return (
            <Badge
              variant="outline"
              className="font-mono text-xs border-amber-500/40 text-amber-500 bg-amber-500/10"
            >
              +{creds.toLocaleString()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "plan_tier",
        header: lang === "bn" ? "টিয়ার" : "Tier",
        cell: ({ row }) => {
          const tier = row.original.plan_tier;
          return (
            <Badge
              variant="secondary"
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              {tier}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: lang === "bn" ? "অবস্থা ও মেয়াদ" : "Status & Expiry",
        cell: ({ row }) => {
          const lic = row.original;
          const isRevoked = lic.status === "revoked";
          const isExpired = lic.is_expired || lic.days_remaining <= 0;

          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                {isRevoked ? (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <ShieldAlert className="h-2.5 w-2.5" />
                    {lang === "bn" ? "বাতিল" : "Revoked"}
                  </Badge>
                ) : isExpired ? (
                  <Badge variant="outline" className="text-[10px] gap-1 border-rose-500/40 text-rose-400 bg-rose-500/10">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {lang === "bn" ? "মেয়াদ উত্তীর্ণ" : "Expired"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {lang === "bn" ? "সক্রিয়" : "Active"}
                  </Badge>
                )}

                {!isRevoked && !isExpired && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({lic.days_remaining} {lang === "bn" ? "দিন বাকি" : "d left"})
                  </span>
                )}
              </div>

              <div className="text-[10px] text-muted-foreground">
                {new Date(lic.expires_at).toLocaleDateString()}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "তৈরি হয়েছে" : "Created"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: lang === "bn" ? "অ্যাকশন" : "Actions",
        cell: ({ row }) => {
          const lic = row.original;
          return (
            <div className="flex items-center gap-1.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px] gap-1"
                onClick={() => onExtend(lic)}
              >
                <Clock className="h-3 w-3" />
                {lang === "bn" ? "মেয়াদ বাড়ান" : "Extend"}
              </Button>
              {lic.status !== "revoked" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                  onClick={() => onRevoke(lic.id)}
                >
                  {lang === "bn" ? "বাতিল" : "Revoke"}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [copiedId, copyToClipboard, onExtend, onRevoke, lang]
  );

  const table = useReactTable({
    data: licenses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (licenses.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        {lang === "bn"
          ? "কোনো প্রোডাকশন লাইসেন্স কি পাওয়া যায়নি।"
          : "No production license keys found."}
      </div>
    );
  }

  return (
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
      </TableBody>
    </Table>
  );
}

