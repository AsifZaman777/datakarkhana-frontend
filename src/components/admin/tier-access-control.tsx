"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  Cloud,
  CloudOff,
  Download,
  Database,
  Users,
  Save,
  RotateCcw,
  Sparkles,
  Zap,
  ShoppingBag,
  SlidersHorizontal,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { TierPermission } from "@/lib/types";

interface TierAccessControlProps {
  onRefreshUsers?: () => void;
}

export function TierAccessControl({ onRefreshUsers }: TierAccessControlProps) {
  const { lang } = useLanguage();
  const [tiers, setTiers] = useState<TierPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyToExisting, setApplyToExisting] = useState(true);

  const loadTierPermissions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTierPermissions();
      setTiers(res.data || []);
    } catch (err: any) {
      console.error("[TIER_PERMISSIONS_LOAD_ERROR]", err);
      const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "";
      toast.error(detail ? `Failed to load tier permissions: ${detail}` : "Failed to load tier permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTierPermissions();
  }, []);

  const handleToggle = (
    tierId: string,
    field: keyof Omit<TierPermission, "tier_id" | "tier_name" | "max_sync_files" | "user_count" | "updated_at">,
    val: boolean
  ) => {
    setTiers((prev) =>
      prev.map((t) => (t.tier_id === tierId ? { ...t, [field]: val } : t))
    );
  };

  const handleQuotaChange = (tierId: string, val: number) => {
    const clean = Math.max(0, val);
    setTiers((prev) =>
      prev.map((t) => (t.tier_id === tierId ? { ...t, max_sync_files: clean } : t))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.saveTierPermissions(tiers, applyToExisting);
      toast.success(res.data.message || "Tier access policies saved successfully!");
      if (onRefreshUsers) {
        onRefreshUsers();
      }
      loadTierPermissions();
    } catch (err: any) {
      console.error("[TIER_PERMISSIONS_SAVE_ERROR]", err);
      const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "";
      toast.error(detail ? `Failed to save tier access policies: ${detail}` : "Failed to save tier access policies.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setTiers((prev) =>
      prev.map((t) => {
        const norm = t.tier_id.toLowerCase();
        if (norm.includes("enterprise")) {
          return {
            ...t,
            allow_sync: true,
            max_sync_files: 25,
            allow_dataset_download: true,
            allow_daraz_download: true,
            can_use_scraper: true,
            can_use_marketing: true,
          };
        }
        if (norm.includes("pro")) {
          return {
            ...t,
            allow_sync: true,
            max_sync_files: 5,
            allow_dataset_download: true,
            allow_daraz_download: true,
            can_use_scraper: true,
            can_use_marketing: true,
          };
        }
        return {
          ...t,
          allow_sync: false,
          max_sync_files: 0,
          allow_dataset_download: false,
          allow_daraz_download: false,
          can_use_scraper: true,
          can_use_marketing: false,
        };
      })
    );
    toast.info("Policies reset to standard tier recommendations. Click 'Save' to apply.");
  };

  const totalSubscribers = tiers.reduce((acc, t) => acc + (t.user_count || 0), 0);

  return (
    <Card className="glass-panel p-6 border-border/50">
      <CardContent className="p-0 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {lang === "bn"
                    ? "সুপার এডমিন: টিয়ার অ্যাক্সেস ও পলিসি কন্ট্রোল"
                    : "Super Admin: Tier Access & Policy Control"}
                  <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">
                    Live RBAC Matrix
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {lang === "bn"
                    ? "স্টার্টার, প্রো, এন্টারপ্রাইজ ও ভবিষ্যতের যেকোনো নতুন প্যাকেজের ডিফল্ট সুবিধা ও ক্লাউড কোটা নির্ধারণ করুন।"
                    : "Configure automated permission policies for Starter, Pro, Enterprise, and future packages. Automatically applies to all subscribers."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              disabled={loading || saving}
              className="h-8 text-xs gap-1.5"
              title="Reset matrix to standard recommended policies"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{lang === "bn" ? "ডিফল্ট রিকমেন্ডেশন" : "Recommended Defaults"}</span>
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || saving}
              className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? (lang === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (lang === "bn" ? "পলিসি সংরক্ষণ করুন" : "Save Tier Policies")}</span>
            </Button>
          </div>
        </div>

        {/* Global Propagation Option */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <Checkbox
              id="applyToExisting"
              checked={applyToExisting}
              onCheckedChange={(c) => setApplyToExisting(!!c)}
            />
            <Label htmlFor="applyToExisting" className="cursor-pointer font-medium">
              {lang === "bn"
                ? "বিদ্যমান সকল গ্রাহকদের ক্ষেত্রেও এই টিয়ার পলিসি অবিলম্বে কার্যকর করুন (স্বয়ংক্রিয় সিঙ্ক ও লিমিট আপডেট)"
                : "Automatically synchronize existing subscribers to match updated tier defaults (Cloud sync & quotas)"}
            </Label>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {lang === "bn" ? `মোট সক্রিয় গ্রাহক: ${totalSubscribers}` : `Active accounts covered: ${totalSubscribers}`}
          </span>
        </div>

        {/* Matrix Table */}
        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-semibold py-3 w-[200px]">
                  {lang === "bn" ? "টিয়ার / প্যাকেজ" : "Tier / Package"}
                </TableHead>
                <TableHead className="text-xs font-semibold py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{lang === "bn" ? "ক্লাউড সিঙ্ক" : "Cloud Sync"}</span>
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                    <span>{lang === "bn" ? "ডিফল্ট ফাইল কোটা" : "Max Cloud Datasets"}</span>
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === "bn" ? "ক্যাটালগ ডাউনলোড" : "Catalog Download"}</span>
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-orange-400" />
                    <span>{lang === "bn" ? "দারাজ এক্সেল ডাউনলোড" : "Daraz Excel Download"}</span>
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Database className="h-3.5 w-3.5 text-blue-400" />
                    <span>{lang === "bn" ? "স্ক্র্যাপার ইঞ্জিন" : "Scraper Engines"}</span>
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-purple-400" />
                    <span>{lang === "bn" ? "ক্যাম্পেইন ডিসপ্যাচ" : "Marketing Campaigns"}</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    {lang === "bn" ? "টিয়ার পলিসি লোড হচ্ছে..." : "Loading tier policies..."}
                  </TableCell>
                </TableRow>
              ) : tiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    {lang === "bn" ? "কোনো টিয়ার কনফিগারেশন পাওয়া যায়নি।" : "No tier configurations found."}
                  </TableCell>
                </TableRow>
              ) : (
                tiers.map((t) => {
                  const norm = t.tier_id.toLowerCase();
                  const isEnterprise = norm.includes("enterprise");
                  const isPro = norm.includes("pro") && !isEnterprise;
                  const isStarter = norm.includes("starter");

                  return (
                    <TableRow key={t.tier_id} className="border-b border-border/20 hover:bg-muted/20">
                      {/* Tier ID & Name */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-mono font-bold tracking-wider ${
                              isEnterprise
                                ? "border-purple-500/40 text-purple-400 bg-purple-500/10 shadow-sm"
                                : isPro
                                ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-sm"
                                : isStarter
                                ? "border-border/60 text-muted-foreground bg-card/40"
                                : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                            }`}
                          >
                            {isEnterprise && <Sparkles className="h-3 w-3 mr-1 text-purple-400" />}
                            {isPro && <Zap className="h-3 w-3 mr-1 text-cyan-400" />}
                            {t.tier_name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>
                            {lang === "bn"
                              ? `${t.user_count || 0} জন গ্রাহক`
                              : `${t.user_count || 0} subscribers`}
                          </span>
                        </div>
                      </TableCell>

                      {/* Cloud Sync Toggle */}
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={t.allow_sync}
                            onCheckedChange={(val) => handleToggle(t.tier_id, "allow_sync", val)}
                          />
                          <span className={`text-[10px] font-mono ${t.allow_sync ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {t.allow_sync ? (lang === "bn" ? "সক্রিয়" : "Allowed") : (lang === "bn" ? "বন্ধ" : "Off")}
                          </span>
                        </div>
                      </TableCell>

                      {/* Max Sync Datasets */}
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Input
                            type="number"
                            min={0}
                            max={500}
                            value={t.max_sync_files}
                            onChange={(e) => handleQuotaChange(t.tier_id, parseInt(e.target.value) || 0)}
                            className="h-7 w-16 text-center font-mono text-xs bg-background/50 border-border/50"
                          />
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {t.max_sync_files === 0 ? "Blocked" : `${t.max_sync_files} files`}
                          </span>
                        </div>
                      </TableCell>

                      {/* Allow Dataset Download */}
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={t.allow_dataset_download}
                            onCheckedChange={(val) => handleToggle(t.tier_id, "allow_dataset_download", val)}
                          />
                          <span className={`text-[10px] font-mono ${t.allow_dataset_download ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {t.allow_dataset_download ? (lang === "bn" ? "উন্মুক্ত" : "Enabled") : (lang === "bn" ? "লক" : "Locked")}
                          </span>
                        </div>
                      </TableCell>

                      {/* Allow Daraz E-Commerce Raw Download */}
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={t.allow_daraz_download}
                            onCheckedChange={(val) => handleToggle(t.tier_id, "allow_daraz_download", val)}
                          />
                          <span className={`text-[10px] font-mono ${t.allow_daraz_download ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {t.allow_daraz_download ? (lang === "bn" ? "উন্মুক্ত" : "Enabled") : (lang === "bn" ? "লক" : "Locked")}
                          </span>
                        </div>
                      </TableCell>

                      {/* Scraper Engine */}
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={t.can_use_scraper}
                            onCheckedChange={(val) => handleToggle(t.tier_id, "can_use_scraper", val)}
                          />
                          <span className={`text-[10px] font-mono ${t.can_use_scraper ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {t.can_use_scraper ? (lang === "bn" ? "অনুমোদিত" : "Allowed") : (lang === "bn" ? "বন্ধ" : "Off")}
                          </span>
                        </div>
                      </TableCell>

                      {/* Marketing Campaigns */}
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={t.can_use_marketing}
                            onCheckedChange={(val) => handleToggle(t.tier_id, "can_use_marketing", val)}
                          />
                          <span className={`text-[10px] font-mono ${t.can_use_marketing ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {t.can_use_marketing ? (lang === "bn" ? "অনুমোদিত" : "Allowed") : (lang === "bn" ? "বন্ধ" : "Off")}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Info Callout */}
        <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border/50 bg-card/30 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              {lang === "bn" ? "অ্যাক্সেস কন্ট্রোল ইনহেরিট্যান্স নীতি" : "Access Control Inheritance Model"}
            </div>
            <p>
              {lang === "bn"
                ? "গ্রাহকরা তাদের ক্রয়কৃত প্যাকেজের ভিত্তি অনুসারে স্বয়ংক্রিয়ভাবে উপরোক্ত সুবিধাগুলি গ্রহণ করবে। অ্যাডমিন / সুপারএডমিন চাইলে 'কাস্টমার অ্যাকাউন্টস' তালিকা থেকে যেকোনো নির্দিষ্ট ব্যবহারকারীর অনুমতি ম্যানুয়ালি কাস্টমাইজ বা ওভাররাইড করতে পারেন।"
                : "Subscribers automatically inherit the permissions set above when purchasing a tier. Superadmins can also override permissions per individual user in the Customer Accounts panel."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
