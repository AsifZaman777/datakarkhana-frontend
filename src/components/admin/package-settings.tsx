"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  Save,
  Plus,
  Trash2,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  ClipboardPaste,
  ArrowUp,
  ArrowDown,
  Copy,
  Rows3,
  AlignLeft,
  ListOrdered,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { paymentsApi } from "@/lib/api/payments";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import type { PaymentPackage } from "@/lib/types";
import { LoadingBackdrop } from "@/components/ui/loading-backdrop";
import { parseFeaturesList, formatFeaturesAsQuotedLines } from "@/lib/feature-parser";

export function PackageSettings() {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [customRate, setCustomRate] = useState(10);
  const [minCredits, setMinCredits] = useState(10);
  const [maxCredits, setMaxCredits] = useState(5000);
  const [customFeatures, setCustomFeatures] = useState<string[]>([
    "Custom Flexible Credit Top-up",
    "Instant Account Balance Unlocks",
    "Full Access to All Catalogs",
  ]);

  // View mode per package card: "rows" (interactive input list) or "bulk" (direct multiline textarea)
  const [viewModes, setViewModes] = useState<Record<number, "rows" | "bulk">>({});
  const [bulkTextInputs, setBulkTextInputs] = useState<Record<number, string>>({});

  // Bulk paste modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [modalPkgIndex, setModalPkgIndex] = useState<number | null>(null);
  const [modalRawText, setModalRawText] = useState("");
  const [modalImportMode, setModalImportMode] = useState<"replace" | "append">("replace");

  // Load current package configuration
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.publicPackagesConfig();
      setPackages(res.data.packages || []);
      if (res.data.custom_package) {
        setCustomRate(res.data.custom_package.price_per_credit_bdt || 10);
        setMinCredits(res.data.custom_package.min_credits || 10);
        setMaxCredits(res.data.custom_package.max_credits || 5000);
        if (Array.isArray(res.data.custom_package.features)) {
          setCustomFeatures(res.data.custom_package.features);
        }
      }
    } catch {
      toast.error("Failed to load package configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Update package fields
  const handleUpdatePackage = (index: number, key: keyof PaymentPackage, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [key]: value };
    setPackages(updated);
  };

  // Feature line management for a package
  const handleAddFeature = (pkgIndex: number) => {
    const updated = [...packages];
    const features = [...(updated[pkgIndex].features || []), ""];
    updated[pkgIndex] = { ...updated[pkgIndex], features };
    setPackages(updated);
  };

  const handleUpdateFeature = (pkgIndex: number, featIndex: number, text: string) => {
    const updated = [...packages];
    const features = [...(updated[pkgIndex].features || [])];
    features[featIndex] = text;
    updated[pkgIndex] = { ...updated[pkgIndex], features };
    setPackages(updated);
  };

  const handleRemoveFeature = (pkgIndex: number, featIndex: number) => {
    const updated = [...packages];
    const features = updated[pkgIndex].features.filter((_, i) => i !== featIndex);
    updated[pkgIndex] = { ...updated[pkgIndex], features };
    setPackages(updated);
  };

  // Move a feature up or down in serial order
  const handleMoveFeature = (pkgIndex: number, featIndex: number, direction: "up" | "down") => {
    const updated = [...packages];
    const features = [...(updated[pkgIndex].features || [])];
    const targetIndex = direction === "up" ? featIndex - 1 : featIndex + 1;

    if (targetIndex < 0 || targetIndex >= features.length) return;

    const temp = features[featIndex];
    features[featIndex] = features[targetIndex];
    features[targetIndex] = temp;

    updated[pkgIndex] = { ...updated[pkgIndex], features };
    setPackages(updated);
  };

  // Smart paste on any individual feature row input
  const handleInputPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    pkgIndex: number,
    featIndex: number
  ) => {
    const pasted = e.clipboardData?.getData("text");
    if (!pasted) return;

    const hasNewlines = pasted.includes("\n");
    const hasQuotes = /["'“`‘]/.test(pasted);
    const hasBullets = /^[-*•+>]\s+/m.test(pasted);
    const hasNumbered = /^\d+[\.\)]\s+/m.test(pasted);

    if (!hasNewlines && !hasQuotes && !hasBullets && !hasNumbered) {
      // Normal single text paste
      return;
    }

    const parsed = parseFeaturesList(pasted);
    if (parsed.length <= 1 && !hasNewlines) {
      if (parsed.length === 1 && hasQuotes) {
        e.preventDefault();
        handleUpdateFeature(pkgIndex, featIndex, parsed[0]);
        toast.success(
          lang === "bn"
            ? "উদ্ধৃতি চিহ্ন পরিষ্কার করে পেস্ট করা হয়েছে"
            : "Cleaned quotes and pasted feature"
        );
      }
      return;
    }

    // Multi-item or multi-line paste detected!
    e.preventDefault();
    const updated = [...packages];
    const currentFeatures = [...(updated[pkgIndex].features || [])];

    const currentVal = (currentFeatures[featIndex] || "").trim();
    if (currentVal === "") {
      currentFeatures.splice(featIndex, 1, ...parsed);
    } else {
      currentFeatures.splice(featIndex + 1, 0, ...parsed);
    }

    updated[pkgIndex] = { ...updated[pkgIndex], features: currentFeatures };
    setPackages(updated);

    toast.success(
      lang === "bn"
        ? `${parsed.length}টি ফিচার সফলভাবে সিরিয়াল অনুযায়ী যুক্ত করা হয়েছে!`
        : `Pasted ${parsed.length} features in exact serial order!`
    );
  };

  // Copy all features of a package formatted as quoted lines
  const handleCopyFeatures = (pkgIndex: number) => {
    const pkg = packages[pkgIndex];
    if (!pkg || !pkg.features || pkg.features.length === 0) {
      toast.info(lang === "bn" ? "কোনো ফিচার তালিকা নেই" : "No features to copy");
      return;
    }
    const formatted = formatFeaturesAsQuotedLines(pkg.features);
    navigator.clipboard.writeText(formatted).then(() => {
      toast.success(
        lang === "bn"
          ? "ফিচার তালিকা ক্লিপবোর্ডে কপি করা হয়েছে!"
          : "Features copied to clipboard formatted in serial order!"
      );
    });
  };

  // Switch card between interactive Rows and Bulk Textarea
  const toggleViewMode = (pkgIndex: number) => {
    const current = viewModes[pkgIndex] || "rows";
    const next = current === "rows" ? "bulk" : "rows";
    if (next === "bulk") {
      setBulkTextInputs((prev) => ({
        ...prev,
        [pkgIndex]: formatFeaturesAsQuotedLines(packages[pkgIndex]?.features || []),
      }));
    }
    setViewModes((prev) => ({ ...prev, [pkgIndex]: next }));
  };

  // Apply inline bulk textarea content
  const handleApplyInlineBulk = (pkgIndex: number) => {
    const raw = bulkTextInputs[pkgIndex] || "";
    const parsed = parseFeaturesList(raw);
    const updated = [...packages];
    updated[pkgIndex] = { ...updated[pkgIndex], features: parsed };
    setPackages(updated);
    setViewModes((prev) => ({ ...prev, [pkgIndex]: "rows" }));
    toast.success(
      lang === "bn"
        ? `${parsed.length}টি ফিচার সিরিয়াল অনুযায়ী তালিকাভুক্ত হয়েছে!`
        : `Updated ${parsed.length} features in exact serial order!`
    );
  };

  // Open Bulk Paste Modal for a package
  const handleOpenBulkModal = (pkgIndex: number) => {
    setModalPkgIndex(pkgIndex);
    const existing = packages[pkgIndex]?.features || [];
    setModalRawText(formatFeaturesAsQuotedLines(existing));
    setModalImportMode("replace");
    setBulkModalOpen(true);
  };

  // Paste from clipboard directly into modal
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setModalRawText(text);
        toast.success(
          lang === "bn"
            ? "ক্লিপবোর্ড থেকে পেস্ট করা হয়েছে!"
            : "Pasted from clipboard!"
        );
      } else {
        toast.info(lang === "bn" ? "ক্লিপবোর্ড খালি" : "Clipboard is empty");
      }
    } catch {
      toast.error(
        lang === "bn"
          ? "ক্লিপবোর্ড অ্যাক্সেস করা যায়নি। অনুগ্রহ করে Ctrl+V চাপুন।"
          : "Could not read clipboard. Please paste directly with Ctrl+V."
      );
    }
  };

  // Apply parsed features from modal
  const handleApplyBulkModal = () => {
    if (modalPkgIndex === null) return;
    const parsed = parseFeaturesList(modalRawText);
    if (parsed.length === 0) {
      toast.warning(
        lang === "bn"
          ? "কোনো বৈধ ফিচার লাইন শনাক্ত করা যায়নি"
          : "No valid feature lines detected"
      );
      return;
    }

    const updated = [...packages];
    const currentFeatures = updated[modalPkgIndex].features || [];

    const newFeatures =
      modalImportMode === "replace"
        ? parsed
        : [...currentFeatures, ...parsed];

    updated[modalPkgIndex] = { ...updated[modalPkgIndex], features: newFeatures };
    setPackages(updated);
    setBulkModalOpen(false);

    toast.success(
      lang === "bn"
        ? `${parsed.length}টি ফিচার সিরিয়াল অনুযায়ী সফলভাবে সংরক্ষণ করা হয়েছে!`
        : `Applied ${parsed.length} features in exact serial order!`
    );
  };

  // Add new package tier
  const handleAddPackage = () => {
    const newPkg: PaymentPackage = {
      id: `pkg_${Date.now()}`,
      name: "New Tier Package",
      credits: 100,
      price_bdt: 1000,
      popular: false,
      badge: "New Tier",
      description: "Package description & features summary.",
      features: [
        "100 Verified Lead Credits",
        "Full Contact Access",
        "CSV/Excel Download",
      ],
    };
    setPackages([...packages, newPkg]);
  };

  // Delete package tier
  const handleDeletePackage = (index: number) => {
    if (packages.length <= 1) {
      toast.warning("At least one package tier must remain.");
      return;
    }
    setPackages(packages.filter((_, i) => i !== index));
  };

  // Save all settings to backend packages.json
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        packages,
        custom_package: {
          name: "Custom Upgrade",
          price_per_credit_bdt: Number(customRate) || 10,
          min_credits: Number(minCredits) || 10,
          max_credits: Number(maxCredits) || 5000,
          step: 10,
          description: "Select the exact credit amount your team requires:",
          features: customFeatures,
        },
      };

      const res = await adminApi.savePackageSettings(payload);
      toast.success(res.data.message || "Package pricing & features updated!");
      loadConfig();
    } catch {
      toast.error("Failed to save package settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingBackdrop
        variant="inline"
        label={lang === "bn" ? "প্যাকেজ কনফিগারেশন লোড হচ্ছে..." : "Loading package configuration..."}
        color="amber"
        size="md"
        className="py-24"
      />
    );
  }

  // Real-time preview of parsed items in the modal
  const modalPreviewItems = parseFeaturesList(modalRawText);
  const activeModalPkg = modalPkgIndex !== null ? packages[modalPkgIndex] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            {lang === "bn" ? "প্যাকেজ সেটিংস ও মূল্য নিয়ন্ত্রণ" : "Package Settings & Pricing Control"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === "bn"
              ? "সাবস্ক্রিপশন প্যাকেজের মূল্য, ক্রেডিট বরাদ্দ এবং বৈশিষ্ট্য রিয়েল-টাইমে কনফিগার করুন (সিরিয়াল বজায় রেখে এক ক্লিকে পেস্ট করুন)"
              : "Configure subscription tier pricing, credit allocations, and feature lists per package in real-time (with bulk serial paste support)"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-purple-500/40 text-purple-400 gap-1.5 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            {lang === "bn" ? "সুপার অ্যাডমিন অ্যাক্সেস" : "Super Admin Access"}
          </Badge>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 font-bold bg-amber-500 text-black hover:bg-amber-600"
          >
            <Save className="h-4 w-4" />
            {saving
              ? (lang === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving Changes...")
              : (lang === "bn" ? "প্যাকেজ সেটিংস সংরক্ষণ করুন" : "Save Package Settings")}
          </Button>
        </div>
      </div>

      {/* Package Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {lang === "bn"
              ? `সক্রিয় সাবস্ক্রিপশন প্যাকেজ (${packages.length}টি)`
              : `Active Subscription Packages (${packages.length})`}
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddPackage}
            className="gap-1.5 text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
          >
            <Plus className="h-3.5 w-3.5" /> {lang === "bn" ? "নতুন প্যাকেজ যুক্ত করুন" : "Add New Package Tier"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {packages.map((pkg, pIdx) => {
            const currentView = viewModes[pIdx] || "rows";
            const inlineText = bulkTextInputs[pIdx] ?? formatFeaturesAsQuotedLines(pkg.features || []);
            const inlineDetected = parseFeaturesList(inlineText);

            return (
              <Card
                key={pkg.id || pIdx}
                className={`glass-panel p-5 border space-y-4 relative transition-all ${
                  pkg.popular
                    ? "border-amber-500/60 bg-amber-500/5 shadow-xl shadow-amber-500/5"
                    : "border-border/40 bg-card/60"
                }`}
              >
                {/* Header Badge & Delete */}
                <div className="flex items-center justify-between border-b border-border/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/40 text-primary">
                      ID: {pkg.id}
                    </Badge>
                    {pkg.popular && (
                      <Badge className="bg-amber-500 text-black text-[10px] font-bold">
                        {pkg.badge || (lang === "bn" ? "জনপ্রিয়" : "POPULAR")}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeletePackage(pIdx)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    title={lang === "bn" ? "প্যাকেজ মুছুন" : "Delete Package"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Package Details Form */}
                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-[11px]">{lang === "bn" ? "প্যাকেজের নাম *" : "Package Name *"}</Label>
                    <Input
                      value={pkg.name}
                      onChange={(e) => handleUpdatePackage(pIdx, "name", e.target.value)}
                      className="text-xs h-8 font-bold mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px]">{lang === "bn" ? "মূল্য (৳ বিডিটি) *" : "Price (৳ BDT) *"}</Label>
                      <Input
                        type="number"
                        value={pkg.price_bdt}
                        onChange={(e) => handleUpdatePackage(pIdx, "price_bdt", Number(e.target.value))}
                        className="text-xs h-8 font-mono font-bold text-amber-500 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">{lang === "bn" ? "প্রদত্ত ক্রেডিট *" : "Credits Provided *"}</Label>
                      <Input
                        type="number"
                        value={pkg.credits}
                        onChange={(e) => handleUpdatePackage(pIdx, "credits", Number(e.target.value))}
                        className="text-xs h-8 font-mono font-bold mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px]">{lang === "bn" ? "ব্যাজ টেক্সট" : "Badge Text"}</Label>
                      <Input
                        value={pkg.badge || ""}
                        onChange={(e) => handleUpdatePackage(pIdx, "badge", e.target.value)}
                        placeholder={lang === "bn" ? "যেমন: মোস্ট পপুলার" : "e.g. Most Popular"}
                        className="text-xs h-8 mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-5">
                      <Checkbox
                        id={`popular-${pIdx}`}
                        checked={pkg.popular || false}
                        onCheckedChange={(c) => handleUpdatePackage(pIdx, "popular", !!c)}
                      />
                      <label htmlFor={`popular-${pIdx}`} className="text-[11px] font-semibold text-foreground cursor-pointer">
                        {lang === "bn" ? "জনপ্রিয় হাইলাইট" : "Highlight Popular"}
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px]">{lang === "bn" ? "প্যাকেজের বিবরণ" : "Package Description"}</Label>
                    <Textarea
                      value={pkg.description || ""}
                      onChange={(e) => handleUpdatePackage(pIdx, "description", e.target.value)}
                      rows={2}
                      className="text-xs mt-1"
                    />
                  </div>

                  {/* Features List Section with Bulk Paste & Serial Maintenance */}
                  <div className="space-y-2.5 pt-3 border-t border-border/30">
                    {/* Features Toolbar Header */}
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <ListOrdered className="h-3.5 w-3.5 text-amber-500" />
                        <Label className="text-[11px] font-bold text-foreground">
                          {lang === "bn"
                            ? `ফিচারের তালিকা (${pkg.features?.length || 0})`
                            : `Features List (${pkg.features?.length || 0})`}
                        </Label>
                      </div>

                      {/* View & Bulk Action Controls */}
                      <div className="flex items-center gap-1">
                        {/* Switch View: Rows vs Bulk Textarea */}
                        <div className="inline-flex items-center rounded-md border border-border/40 p-0.5 bg-background/60">
                          <button
                            type="button"
                            onClick={() => toggleViewMode(pIdx)}
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${
                              currentView === "rows"
                                ? "bg-primary/20 text-primary font-bold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={lang === "bn" ? "প্রতিটি লাইনের ইনপুট ভিউ" : "Line-by-line input view"}
                          >
                            <Rows3 className="h-2.5 w-2.5" />
                            {lang === "bn" ? "লাইন" : "Rows"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleViewMode(pIdx)}
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${
                              currentView === "bulk"
                                ? "bg-amber-500/20 text-amber-500 font-bold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={lang === "bn" ? "একসাথে পেস্ট করার টেক্সটবক্স" : "Direct multiline bulk paste view"}
                          >
                            <AlignLeft className="h-2.5 w-2.5" />
                            {lang === "bn" ? "বাল্ক পেস্ট" : "Bulk"}
                          </button>
                        </div>

                        {/* Dedicated Bulk Paste Modal Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenBulkModal(pIdx)}
                          className="h-6 text-[10px] px-2 gap-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                          title={lang === "bn" ? "ক্লিপবোর্ড থেকে পেস্ট ও সিরিয়াল নিয়ন্ত্রণ" : "Bulk Paste & Serial Control Dialog"}
                        >
                          <ClipboardPaste className="h-3 w-3" />
                          {lang === "bn" ? "পেস্ট" : "Paste"}
                        </Button>

                        {/* Copy formatted features */}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopyFeatures(pIdx)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title={lang === "bn" ? "ফিচার তালিকা কোড আকারে কপি করুন" : "Copy features formatted as quoted list"}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        {/* Add single line */}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAddFeature(pIdx)}
                          className="h-6 w-6 text-primary hover:bg-primary/10"
                          title={lang === "bn" ? "নতুন লাইন যুক্ত করুন" : "Add Line"}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Mode A: Interactive Rows with Serial Numbers, Smart Paste & Move Up/Down */}
                    {currentView === "rows" ? (
                      <div className="space-y-1.5">
                        {(!pkg.features || pkg.features.length === 0) ? (
                          <div className="py-4 text-center rounded-lg border border-dashed border-border/40 bg-muted/10 text-muted-foreground text-[11px]">
                            {lang === "bn"
                              ? "কোনো ফিচার যুক্ত করা হয়নি। 'পেস্ট' বা 'নতুন লাইন' চাপুন।"
                              : "No features added yet. Click 'Paste' or '+' to add."}
                          </div>
                        ) : (
                          pkg.features.map((feat, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center gap-1.5 group bg-card/40 hover:bg-card/70 border border-border/20 hover:border-border/40 rounded-md px-2 py-1 transition-all"
                            >
                              {/* Serial Number Badge */}
                              <span className="text-[10px] font-mono font-bold text-muted-foreground w-4 text-center shrink-0">
                                {fIdx + 1}
                              </span>

                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />

                              {/* Input with Smart Multi-line / Quoted Paste detection */}
                              <Input
                                value={feat}
                                onChange={(e) => handleUpdateFeature(pIdx, fIdx, e.target.value)}
                                onPaste={(e) => handleInputPaste(e, pIdx, fIdx)}
                                placeholder={
                                  lang === "bn"
                                    ? "ফিচারের বিবরণ (মাল্টি-লাইন পেস্ট সমর্থিত)..."
                                    : "Feature description (bulk paste supported)..."
                                }
                                className="text-xs h-7 flex-1 border-0 focus-visible:ring-1 focus-visible:ring-amber-500/50 bg-transparent px-1.5 shadow-none"
                              />

                              {/* Move Up */}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={fIdx === 0}
                                onClick={() => handleMoveFeature(pIdx, fIdx, "up")}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20 shrink-0"
                                title={lang === "bn" ? "উপরে নিন (সিরিয়াল পরিবর্তন)" : "Move Up"}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>

                              {/* Move Down */}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={fIdx === (pkg.features?.length || 0) - 1}
                                onClick={() => handleMoveFeature(pIdx, fIdx, "down")}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-20 shrink-0"
                                title={lang === "bn" ? "নিচে নিন (সিরিয়াল পরিবর্তন)" : "Move Down"}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>

                              {/* Delete feature */}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveFeature(pIdx, fIdx)}
                                className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                                title={lang === "bn" ? "মুছুন" : "Delete feature"}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                        <p className="text-[10px] text-muted-foreground/70 italic pt-0.5">
                          💡 {lang === "bn"
                            ? "টিপ: যেকোনো টেক্সটবক্সে উদ্ধৃতিসহ কোড বা মাল্টি-লাইন সরাসরি পেস্ট করলে সিরিয়াল অক্ষুণ্ণ থাকবে।"
                            : "Tip: Paste quoted lines or multi-line text into any box to auto-insert in exact serial order."}
                        </p>
                      </div>
                    ) : (
                      /* Mode B: Direct Multiline Raw Textarea with Realtime Serial Detection */
                      <div className="space-y-2">
                        <Textarea
                          value={inlineText}
                          onChange={(e) => {
                            setBulkTextInputs((prev) => ({
                              ...prev,
                              [pIdx]: e.target.value,
                            }));
                          }}
                          placeholder={`"500 Verified Lead Credits",\n"Full Phone & Email Access",\n"Global Google map Scraping",`}
                          rows={8}
                          className="text-xs font-mono resize-y p-2.5 leading-relaxed bg-black/30 border-amber-500/20 focus:border-amber-500/60"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Check className="h-3 w-3" />
                            {lang === "bn"
                              ? `${inlineDetected.length}টি ফিচার সিরিয়ালে শনাক্ত`
                              : `${inlineDetected.length} features detected in serial`}
                          </span>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const cleaned = formatFeaturesAsQuotedLines(inlineDetected);
                                setBulkTextInputs((prev) => ({ ...prev, [pIdx]: cleaned }));
                                toast.success(lang === "bn" ? "ফরম্যাট ঠিক করা হয়েছে" : "Formatted & cleaned");
                              }}
                              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                            >
                              {lang === "bn" ? "ফরম্যাট ঠিক করুন" : "Format"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleApplyInlineBulk(pIdx)}
                              className="h-6 text-[10px] px-2.5 gap-1 bg-amber-500 text-black hover:bg-amber-600 font-bold"
                            >
                              <Check className="h-3 w-3" />
                              {lang === "bn" ? "প্রয়োগ করুন" : "Apply to Rows"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Credit Calculator Settings */}
      <Card className="glass-panel p-5 border border-cyan-500/30">
        <CardContent className="p-0 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            {lang === "bn"
              ? "কাস্টম ক্রেডিট ক্যালকুলেটর সেটিংস (স্লাইডার কনফিগারেশন)"
              : "Custom Credit Calculator Settings (Seek Bar Slider Configuration)"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <Label className="text-[11px] font-semibold">
                {lang === "bn" ? "কাস্টম রেট (প্রতি ক্রেডিট ৳ বিডিটি) *" : "Custom Rate (৳ BDT per Credit) *"}
              </Label>
              <Input
                type="number"
                step="0.5"
                value={customRate}
                onChange={(e) => setCustomRate(Number(e.target.value))}
                className="text-xs h-9 font-mono font-bold text-amber-500 mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold">
                {lang === "bn" ? "সর্বনিম্ন ক্রেডিট সীমা *" : "Minimum Credit Limit *"}
              </Label>
              <Input
                type="number"
                value={minCredits}
                onChange={(e) => setMinCredits(Number(e.target.value))}
                className="text-xs h-9 font-mono mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold">
                {lang === "bn" ? "সর্বোচ্চ ক্রেডিট সীমা *" : "Maximum Credit Limit *"}
              </Label>
              <Input
                type="number"
                value={maxCredits}
                onChange={(e) => setMaxCredits(Number(e.target.value))}
                className="text-xs h-9 font-mono mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dedicated Bulk Paste & Serial Maintenance Modal */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="glass-panel border-border/40 sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <ClipboardPaste className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  {lang === "bn"
                    ? "ফিচার তালিকা বাল্ক পেস্ট ও সিরিয়াল নিয়ন্ত্রণ"
                    : "Bulk Paste & Maintain Feature Serials"}
                  {activeModalPkg && (
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/40">
                      {activeModalPkg.name}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {lang === "bn"
                    ? "কোড, কোটেশন মার্ক বা কমাযুক্ত তালিকা সরাসরি এখানে পেস্ট করুন। সিরিয়াল অবিকল বজায় রাখা হবে।"
                    : "Paste quoted lines with commas, JSON arrays, bullet lists, or plain lines. Exact serial order is preserved."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteFromClipboard}
                className="gap-1.5 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                {lang === "bn" ? "ক্লিপবোর্ড থেকে পেস্ট করুন" : "Paste from Clipboard"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalRawText("")}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                {lang === "bn" ? "টেক্সট মুছুন" : "Clear"}
              </Button>
            </div>

            {/* Input Textarea */}
            <div>
              <Label className="text-[11px] font-semibold text-foreground">
                {lang === "bn" ? "এখানে টেক্সট পেস্ট করুন:" : "Paste Features Text Here:"}
              </Label>
              <Textarea
                value={modalRawText}
                onChange={(e) => setModalRawText(e.target.value)}
                placeholder={`"500 Verified Lead Credits",\n"Full Phone & Email Access",\n"Global Google map Scraping",\n"Instant Public Catalog Unlocks",\n...`}
                rows={7}
                className="font-mono text-xs mt-1.5 bg-black/40 border-border/50 leading-relaxed"
              />
            </div>

            {/* Live Serial Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ListOrdered className="h-3.5 w-3.5 text-amber-500" />
                  {lang === "bn"
                    ? `শনাক্তকৃত ফিচার প্রিভিউ (${modalPreviewItems.length}টি সিরিয়ালে)`
                    : `Live Serial Preview (${modalPreviewItems.length} items detected)`}
                </span>
                {modalPreviewItems.length > 0 && (
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                    {lang === "bn" ? "ক্রম ঠিক আছে" : "Serial Verified"}
                  </Badge>
                )}
              </div>

              {modalPreviewItems.length === 0 ? (
                <div className="p-3 text-center rounded-md border border-dashed border-border/30 bg-muted/10 text-muted-foreground text-[11px]">
                  {lang === "bn"
                    ? "উপরে টেক্সট পেস্ট করলে সিরিয়াল অনুযায়ী প্রিভিউ দেখতে পাবেন।"
                    : "Paste text above to see the real-time serial preview."}
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1 border border-border/30 rounded-md p-2.5 bg-background/50">
                  {modalPreviewItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs py-0.5">
                      <span className="font-mono font-bold text-amber-500/80 text-[11px] w-6 shrink-0 text-right">
                        #{idx + 1}
                      </span>
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-foreground leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Import Mode: Replace vs Append */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="importMode"
                  checked={modalImportMode === "replace"}
                  onChange={() => setModalImportMode("replace")}
                  className="accent-amber-500"
                />
                <span>
                  {lang === "bn"
                    ? "পূর্বের সব ফিচার প্রতিস্থাপন করুন (Replace All)"
                    : "Replace all existing features"}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="importMode"
                  checked={modalImportMode === "append"}
                  onChange={() => setModalImportMode("append")}
                  className="accent-amber-500"
                />
                <span>
                  {lang === "bn"
                    ? "বর্তমান তালিকার শেষে যোগ করুন (Append)"
                    : "Append to existing list"}
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkModalOpen(false)}
              className="text-xs"
            >
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={modalPreviewItems.length === 0}
              onClick={handleApplyBulkModal}
              className="gap-1.5 font-bold bg-amber-500 text-black hover:bg-amber-600 text-xs"
            >
              <Check className="h-4 w-4" />
              {lang === "bn"
                ? `প্রয়োগ করুন (${modalPreviewItems.length}টি)`
                : `Apply (${modalPreviewItems.length} Features)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
