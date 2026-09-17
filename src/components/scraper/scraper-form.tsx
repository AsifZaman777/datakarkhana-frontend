"use client";

import { useState, type FormEvent } from "react";
import { Search, Plus, Trash2, Zap, Coins, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scraperApi } from "@/lib/api/scraper";
import { toast } from "sonner";
import type { RegionsConfig } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";

interface ScraperFormProps {
  regionsConfig: RegionsConfig | null;
  onJobCreated: (jobId: number) => void;
  cooldownRemaining: number;
}

export function ScraperForm({
  regionsConfig,
  onJobCreated,
  cooldownRemaining,
}: ScraperFormProps) {
  const { t, lang } = useLanguage();
  const sc = t.scraper || {};
  const [queries, setQueries] = useState<string[]>([""]);
  const [division, setDivision] = useState("");
  const [customDivision, setCustomDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [customDistrict, setCustomDistrict] = useState("");
  const [area, setArea] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [showLiveDebug, setShowLiveDebug] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingScrapeData, setPendingScrapeData] = useState<{
    queries: string[];
    division: string;
    district: string;
    area: string;
  } | null>(null);

  const divisions = regionsConfig ? Object.keys(regionsConfig) : [];
  const districts =
    regionsConfig && division && division !== "Other" && regionsConfig[division]
      ? Object.keys(regionsConfig[division])
      : regionsConfig
        ? Array.from(new Set(Object.values(regionsConfig).flatMap((d) => Object.keys(d))))
        : [];
  const areas =
    regionsConfig && division && division !== "Other" && district && district !== "Other" && regionsConfig[division]?.[district]
      ? regionsConfig[division][district]
      : regionsConfig
        ? Array.from(new Set(Object.values(regionsConfig).flatMap((d) => Object.values(d).flat())))
        : [];

  const handleDivisionChange = (val: string) => {
    setDivision(val || "");
    setCustomDivision("");
    setDistrict("");
    setCustomDistrict("");
    setArea("");
    setCustomArea("");
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val || "");
    setCustomDistrict("");
    setArea("");
    setCustomArea("");
  };

  const handleAreaChange = (val: string) => {
    setArea(val || "");
    setCustomArea("");
  };

  const handleAddQuery = () => {
    setQueries([...queries, ""]);
  };

  const handleRemoveQuery = (index: number) => {
    setQueries(queries.filter((_, i) => i !== index));
  };

  const handleQueryChange = (index: number, val: string) => {
    const next = [...queries];
    next[index] = val;
    setQueries(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (cooldownRemaining > 0) {
      toast.warning(`Rate limit cooldown active (${cooldownRemaining}s remaining).`);
      return;
    }

    const validQueries = queries.map((q) => q.trim()).filter(Boolean);
    if (validQueries.length === 0) {
      toast.warning("Please enter at least one search query.");
      return;
    }

    const finalDivision = division === "Other" ? customDivision.trim() : division;
    const finalDistrict = district === "Other" ? customDistrict.trim() : district;
    const finalArea = area === "Other" ? customArea.trim() : area;

    setPendingScrapeData({
      queries: validQueries,
      division: finalDivision,
      district: finalDistrict,
      area: finalArea,
    });
    setShowConfirmModal(true);
  };

  const executeLaunchScrape = async () => {
    if (!pendingScrapeData) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try {
      const res = await scraperApi.startScrape({
        queries: pendingScrapeData.queries,
        query: pendingScrapeData.queries[0],
        division: pendingScrapeData.division,
        district: pendingScrapeData.district,
        area: pendingScrapeData.area,
        headless: true, // Always run in silent background mode (No Chrome GUI window)
      });

      toast.success(`Scrape job launched for ${pendingScrapeData.queries.length} query(s)!`);
      onJobCreated(res.data.job_id);
      setQueries([""]);
      setPendingScrapeData(null);
    } catch (err: any) {
      // ── Verbose Error Diagnostics ──────────────────────────────────────
      // Collect every available detail from the axios error for debugging
      const httpStatus   = err?.response?.status;
      const httpDetail   = err?.response?.data?.detail;
      const httpMessage  = err?.response?.data?.message || err?.response?.data?.error;
      const axiosCode    = err?.code;                          // e.g. ERR_NETWORK, ECONNREFUSED, ETIMEDOUT
      const axiosMessage = err?.message;                       // e.g. "Network Error"
      const targetUrl    = err?.config?.baseURL
        ? `${err.config.baseURL}${err.config.url ?? ""}`
        : err?.config?.url ?? "unknown URL";

      // Build a single readable summary for the toast
      const parts: string[] = [];
      if (httpStatus)  parts.push(`HTTP ${httpStatus}`);
      if (axiosCode)   parts.push(`Code: ${axiosCode}`);
      if (httpDetail)  parts.push(`Detail: ${httpDetail}`);
      else if (httpMessage) parts.push(`Msg: ${httpMessage}`);
      else if (axiosMessage) parts.push(axiosMessage);
      parts.push(`URL: ${targetUrl}`);

      const verboseError = parts.join(" · ");

      console.error("[SCRAPER ERROR]", {
        httpStatus,
        httpDetail,
        httpMessage,
        axiosCode,
        axiosMessage,
        targetUrl,
        fullError: err,
      });

      toast.error("Failed to launch scraper", {
        description: verboseError || "Unknown error — check browser console for details.",
        duration: 12000, // Keep visible long enough to read/screenshot
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-panel p-6">
      <CardContent className="p-0 space-y-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-foreground">
            {sc.titleAdmin || (lang === "bn" ? "লাইভ গুগল ম্যাপস স্ক্র্যাপার কনসোল" : "Google Maps Live Scraper Console")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Queries Inputs */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              {sc.searchQueriesLabel || (lang === "bn" ? "সার্চ কিওয়ার্ডসমূহ *" : "Search Queries *")}
            </Label>
            {queries.map((q, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={q}
                  onChange={(e) => handleQueryChange(i, e.target.value)}
                  placeholder={sc.queryPlaceholder || (lang === "bn" ? "যেমন: Pharmacy in Dhanmondi, Dhaka" : "e.g. Pharmacy in Dhanmondi, Dhaka")}
                  className="text-xs h-9"
                  required={i === 0}
                />
                {queries.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveQuery(i)}
                    className="h-9 w-9 text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuery}
              className="gap-1 text-xs mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> {sc.addTagBtn || (lang === "bn" ? "নতুন সার্চ ট্যাগ যোগ করুন" : "Add Search Query Tag")}
            </Button>
          </div>

          {/* Region Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Division */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {sc.divisionLabel || (lang === "bn" ? "বিভাগ" : "Division")}
              </Label>
              <Select value={division} onValueChange={(val) => handleDivisionChange(val || "")}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder={sc.allDivisions || (lang === "bn" ? "সকল বিভাগ" : "All Divisions")} />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">{lang === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
              {division === "Other" && (
                <Input
                  value={customDivision}
                  onChange={(e) => setCustomDivision(e.target.value)}
                  placeholder={lang === "bn" ? "কাস্টম বিভাগ লিখুন..." : "Type custom division..."}
                  className="text-xs h-9 mt-1.5 border-primary/50"
                />
              )}
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {sc.districtLabel || (lang === "bn" ? "জেলা" : "District")}
              </Label>
              <Select value={district} disabled={!division} onValueChange={(val) => handleDistrictChange(val || "")}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder={sc.allDistricts || (lang === "bn" ? "সকল জেলা" : "All Districts")} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">{lang === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
              {district === "Other" && (
                <Input
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  placeholder={lang === "bn" ? "কাস্টম জেলা লিখুন..." : "Type custom district..."}
                  className="text-xs h-9 mt-1.5 border-primary/50"
                />
              )}
            </div>

            {/* Area / City */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {sc.areaLabel || (lang === "bn" ? "এলাকা / শহর" : "Area / City")}
              </Label>
              <Select value={area} disabled={!district} onValueChange={(val) => handleAreaChange(val || "")}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder={sc.allAreas || (lang === "bn" ? "সকল এলাকা" : "All Areas")} />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">{lang === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
              {area === "Other" && (
                <Input
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder={lang === "bn" ? "কাস্টম এলাকা লিখুন..." : "Type custom area..."}
                  className="text-xs h-9 mt-1.5 border-primary/50"
                />
              )}
            </div>
          </div>

          {/* Stream option */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="live-debug"
              checked={showLiveDebug}
              onCheckedChange={(c) => setShowLiveDebug(!!c)}
            />
            <label htmlFor="live-debug" className="text-xs text-muted-foreground cursor-pointer">
              {sc.debugCheckbox || (lang === "bn" ? "ব্যাকগ্রাউন্ড হেডলেস মোড — কনসোলে লাইভ ফ্রেম স্ট্রিমিং হবে" : "Background Headless Mode Active — Live WebSocket frames streamed in Console (No Chrome GUI window)")}
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || cooldownRemaining > 0}
            className="w-full font-bold gap-2 py-5"
          >
            <Search className="h-4 w-4" />
            {cooldownRemaining > 0
              ? `${sc.cooldown || (lang === "bn" ? "কুলডাউন সক্রিয়" : "Cooldown Active")} (${cooldownRemaining}s)`
              : isSubmitting
                ? (sc.launchingBtn || (lang === "bn" ? "স্ক্র্যাপার চালু হচ্ছে..." : "Launching Scraper Job..."))
                : (sc.launchBtn || (lang === "bn" ? "স্ক্র্যাপার চালু করুন" : "Launch Scraper Job"))}
          </Button>
        </form>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmModal} onOpenChange={(open) => !open && setShowConfirmModal(false)}>
          <DialogContent className="glass-panel border-border/40 sm:max-w-md">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <div className="p-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Coins className="h-5 w-5" />
                </div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {lang === "bn" ? "স্ক্র্যাপার চালু ও ক্রেডিট কর্তন নিশ্চিত করুন" : "Confirm Scraper Launch & Credit Deduction"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {lang === "bn"
                  ? "এই লাইভ স্ক্র্যাপিং জব চালু করলে আপনার অ্যাকাউন্ট থেকে ক্রেডিট কর্তন করা হবে।"
                  : "Starting this live web scraping job will deduct credits from your account balance."}
              </DialogDescription>
            </DialogHeader>

            {pendingScrapeData && (
              <div className="space-y-3 py-3 border-y border-border/40 my-1">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {lang === "bn" ? `টার্গেট সার্চ কুয়েরি (${pendingScrapeData.queries.length}):` : `Target Queries (${pendingScrapeData.queries.length}):`}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                    {pendingScrapeData.queries.map((q, idx) => (
                      <span key={idx} className="text-[11px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>

                {(pendingScrapeData.division || pendingScrapeData.district || pendingScrapeData.area) && (
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span className="font-semibold">{lang === "bn" ? "এলাকা ফিল্টার:" : "Region Filter:"}</span>
                    <span>
                      {[pendingScrapeData.division, pendingScrapeData.district, pendingScrapeData.area].filter(Boolean).join(" → ")}
                    </span>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold text-foreground">
                      {lang === "bn" ? "মোট কর্তন:" : "Total Deduction:"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-amber-500">
                      {pendingScrapeData.queries.length * 20} {lang === "bn" ? "ক্রেডিট" : "Credits"}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      ({pendingScrapeData.queries.length} {lang === "bn" ? "কুয়েরি × ২০ ক্রেডিট/কুয়েরি" : "queries × 20 credits/query"})
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 border-t-0 bg-transparent">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                className="text-xs"
              >
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={executeLaunchScrape}
                disabled={isSubmitting}
                className="text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                <Coins className="h-3.5 w-3.5" />
                {lang === "bn" ? "নিশ্চিত ও চালু করুন" : "Confirm & Launch"} ({((pendingScrapeData?.queries.length || 0) * 20)} {lang === "bn" ? "ক্রেডিট" : "Credits"})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
