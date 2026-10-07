"use client";

import { useState, type FormEvent, useEffect } from "react";
import {
  Globe,
  Link as LinkIcon,
  Search,
  Zap,
  Coins,
  Sparkles,
  AlertCircle,
  Layers,
  Clipboard,
  Check,
  ShoppingBag,
  Store,
  Compass
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { ecommerceApi } from "@/lib/api/ecommerce";
import type { EcommercePlatform } from "@/lib/types";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import platformPresetsData from "@/data/ecommerce-platforms.json";

export interface PlatformPreset {
  id: string;
  name: string;
  domain: string;
  icon?: string;
  searchUrlPattern?: string;
  sampleUrl?: string;
  fallbackUrl?: string;
  defaultQuery?: string;
  quickTemplate?: {
    label: string;
    url: string;
  };
}

const PRESET_PLATFORMS: PlatformPreset[] = platformPresetsData as PlatformPreset[];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  "shopping-bag": ShoppingBag,
  store: Store,
  compass: Compass,
};

function getPlatformIcon(iconName?: string) {
  if (!iconName) return Store;
  const key = iconName.toLowerCase().trim();
  return ICON_MAP[key] || Store;
}

interface EcommerceScraperFormProps {
  onJobCreated: (jobId: number) => void;
  cooldownRemaining: number;
}

export function EcommerceScraperForm({
  onJobCreated,
  cooldownRemaining,
}: EcommerceScraperFormProps) {
  const { lang } = useLanguage();
  const { user, isAdmin } = useAuth();

  const [selectedPlatform, setSelectedPlatform] = useState<string>("generic");
  const [url, setUrl] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [pages, setPages] = useState<number>(1);
  const [maxItems, setMaxItems] = useState<string>("all");
  const [headless, setHeadless] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const getSearchUrlForPlatform = (platId: string, q: string): string => {
    const cleanQ = q.trim();
    const platform = PRESET_PLATFORMS.find((p) => p.id === platId);
    if (!platform) return "";

    if (cleanQ && platform.searchUrlPattern) {
      if (platform.searchUrlPattern.includes("{query}")) {
        return platform.searchUrlPattern.replace("{query}", encodeURIComponent(cleanQ));
      }
      return `${platform.searchUrlPattern}${encodeURIComponent(cleanQ)}`;
    }

    return platform.sampleUrl || platform.fallbackUrl || "";
  };

  const handlePlatformClick = (platId: string) => {
    setSelectedPlatform(platId);
    const platform = PRESET_PLATFORMS.find((p) => p.id === platId);
    if (platId !== "generic") {
      const targetQuery = query.trim() || platform?.defaultQuery || "";
      if (targetQuery && !query.trim() && platform?.defaultQuery) {
        setQuery(platform.defaultQuery);
      }
      const generatedUrl = getSearchUrlForPlatform(platId, targetQuery);
      setUrl(generatedUrl);
    } else {
      // If switching to generic from a preset, clear the preset URL so user can paste any link
      const isPresetUrl = PRESET_PLATFORMS.some(
        (p) =>
          p.id !== "generic" &&
          (url === p.sampleUrl ||
            url === p.fallbackUrl ||
            (p.domain && p.domain !== "Universal" && url.includes(p.domain)))
      );
      if (isPresetUrl) {
        setUrl("");
      }
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const lower = newUrl.toLowerCase();
    const matched = PRESET_PLATFORMS.find(
      (p) => p.id !== "generic" && p.domain && p.domain !== "Universal" && lower.includes(p.domain.toLowerCase())
    );
    if (matched) {
      setSelectedPlatform(matched.id);
    } else if (!newUrl.trim()) {
      setSelectedPlatform("generic");
    }
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (selectedPlatform !== "generic") {
      const updatedUrl = getSearchUrlForPlatform(selectedPlatform, newQuery);
      setUrl(updatedUrl);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleUrlChange(text.trim());
          toast.success(lang === "bn" ? "লিংক পেস্ট করা হয়েছে!" : "Link pasted from clipboard!");
        }
      }
    } catch {
      toast.error(lang === "bn" ? "ক্লিপবোর্ড পড়তে অনুমতি প্রয়োজন।" : "Permission needed to access clipboard.");
    }
  };

  const handleQuickSample = (sample: string, platId: string) => {
    setSelectedPlatform(platId);
    setUrl(sample);
    const platform = PRESET_PLATFORMS.find((p) => p.id === platId);
    if (platform?.defaultQuery) {
      setQuery(platform.defaultQuery);
    }
  };

  // 20 credits per 10 pages
  const calculatedCost = Math.ceil(Math.max(1, pages) / 10) * 20;
  const userCredits = user?.credits ?? 0;
  const hasEnoughCredits = isAdmin || userCredits >= calculatedCost;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanQuery = query.trim();

    if (!cleanUrl && !cleanQuery && selectedPlatform === "generic") {
      toast.error(
        lang === "bn"
          ? "অনুগ্রহ করে যেকোনো ই-কমার্স সাইটের লিংক পেস্ট করুন অথবা সার্চ কিওয়ার্ড দিন।"
          : "Please paste an e-commerce URL or enter a search query."
      );
      return;
    }

    if (!hasEnoughCredits) {
      toast.error(
        lang === "bn"
          ? `অপর্যাপ্ত ক্রেডিট! প্রয়োজন ${calculatedCost} ক্রেডিট কিন্তু রয়েছে ${userCredits} ক্রেডিট।`
          : `Insufficient credits! You need ${calculatedCost} credits but have ${userCredits}.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmScrape = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const parsedMaxItems = maxItems === "all" ? undefined : parseInt(maxItems, 10);
      const res = await ecommerceApi.startScrape({
        url: url.trim() || undefined,
        query: query.trim() || undefined,
        platform: selectedPlatform,
        pages: Number(pages) || 1,
        max_items: parsedMaxItems,
        headless,
      });

      if (res.data?.success && res.data?.job_id) {
        toast.success(
          lang === "bn"
            ? `ই-কমার্স স্ক্র্যাপার শুরু হয়েছে! জব #${res.data.job_id}`
            : `Universal E-Commerce Scraper started! Job #${res.data.job_id}`
        );
        onJobCreated(res.data.job_id);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to start E-Commerce scraper.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  {lang === "bn" ? "ইউনিভার্সাল ই-কমার্স স্ক্র্যাপার" : "Universal E-Commerce Scraper"}
                  <Badge className="bg-indigo-500 text-white font-bold text-[10px] px-1.5 py-0">
                    Plug & Play
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {lang === "bn"
                    ? "যেকোনো ই-কমার্স লিংক পেস্ট করুন (eBay, Pickaboo, Amazon ইত্যাদি) এবং প্রাইস, রিভিউ ও স্টক ডাটা সংগ্রহ করুন"
                    : "Paste any product, search, or catalog link to automatically extract prices, reviews, ratings, and stock status"}
                </CardDescription>
              </div>
            </div>
          </div>

          {/* ── Preset Platforms Bar ── */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {lang === "bn" ? "প্ল্যাটফর্ম প্রিসেট নির্বাচন:" : "Select Platform Preset / Engine:"}
              </Label>
              <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                Active: {selectedPlatform}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PRESET_PLATFORMS.map((p) => {
                const isSelected = selectedPlatform === p.id;
                const IconComponent = getPlatformIcon(p.icon);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePlatformClick(p.id)}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400 scale-[1.02]"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <IconComponent className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white" : "text-indigo-400"}`} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {isSelected && <Check className="h-3 w-3 shrink-0 text-white animate-in zoom-in-50 duration-200" />}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target URL Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ecom-url" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-indigo-400" />
                  {lang === "bn" ? "টার্গেট ই-কমার্স লিংক (URL)" : "Target E-Commerce Link (URL)"}
                  <span className="text-rose-500 font-bold">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  {url && (
                    <button
                      type="button"
                      onClick={() => handleUrlChange("")}
                      className="text-[11px] text-muted-foreground hover:text-rose-400 px-1 transition-colors"
                    >
                      {lang === "bn" ? "মুছে ফেলুন" : "Clear"}
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePasteClipboard}
                    className="h-6 text-[11px] px-2 text-indigo-400 hover:text-indigo-300 gap-1"
                  >
                    <Clipboard className="h-3 w-3" />
                    <span>{lang === "bn" ? "ক্লিপবোর্ড থেকে পেস্ট" : "Paste Link"}</span>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="ecom-url"
                  placeholder="https://www.ebay.com/sch/... or https://www.pickaboo.com/search/..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="pr-8 text-xs font-mono bg-background/50 border-border/40 focus:border-indigo-500 transition-colors"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => handleUrlChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                    title="Clear link"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {lang === "bn"
                  ? "যেকোনো সার্চ পেজ, ক্যাটাগরি পেজ বা সরাসরি প্রোডাক্টের লিংক এখানে পেস্ট করুন।"
                  : "Paste any search result, category catalog, or direct product URL from eBay, Pickaboo, etc."}
              </p>
            </div>

            {/* Optional Search Query */}
            <div className="space-y-1.5">
              <Label htmlFor="ecom-query" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-indigo-400" />
                {lang === "bn" ? "সার্চ কিওয়ার্ড (প্রিসেট লিংকে সরাসরি আপডেট হবে)" : "Search Query (Auto-syncs with selected platform)"}
              </Label>
              <Input
                id="ecom-query"
                placeholder="e.g. Wireless Headphone, Smart Watch, Gaming Mouse..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="text-xs bg-background/50 border-border/40 focus:border-indigo-500"
              />
            </div>

            {/* Quick Sample Links */}
            {(() => {
              const quickTemplates = PRESET_PLATFORMS.filter((p) => p.quickTemplate);
              if (quickTemplates.length === 0) return null;
              return (
                <div className="pt-0.5">
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    {lang === "bn" ? "দ্রুত টেস্ট করতে ক্লিক করুন:" : "Quick 1-Click Test Templates:"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTemplates.map((p) => (
                      <button
                        key={p.quickTemplate!.label}
                        type="button"
                        onClick={() => handleQuickSample(p.quickTemplate!.url, p.id)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/30 transition-colors cursor-pointer"
                      >
                        {p.quickTemplate!.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Crawl Settings Grid: Pages + Max Items */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="ecom-pages" className="text-xs font-semibold flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-indigo-400" />
                  {lang === "bn" ? "পেজিনেশন সংখ্যা" : "Pages to Crawl"}
                </Label>
                <Input
                  id="ecom-pages"
                  type="number"
                  min={1}
                  max={20}
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                  className="text-xs bg-background/50 border-border/40 font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ecom-max-items" className="text-xs font-semibold">
                  {lang === "bn" ? "আইটেম লিমিট" : "Max Products Limit"}
                </Label>
                <Select value={maxItems} onValueChange={(val) => setMaxItems(val || "all")}>
                  <SelectTrigger id="ecom-max-items" className="text-xs bg-background/50 border-border/40">
                    <SelectValue placeholder="All items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang === "bn" ? "সকল পণ্য (All)" : "All on pages"}</SelectItem>
                    <SelectItem value="15">15 {lang === "bn" ? "টি পণ্য" : "items"}</SelectItem>
                    <SelectItem value="30">30 {lang === "bn" ? "টি পণ্য" : "items"}</SelectItem>
                    <SelectItem value="60">60 {lang === "bn" ? "টি পণ্য" : "items"}</SelectItem>
                    <SelectItem value="100">100 {lang === "bn" ? "টি পণ্য" : "items"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Headless Checkbox */}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="ecom-headless"
                checked={headless}
                onCheckedChange={(c) => setHeadless(!!c)}
              />
              <label
                htmlFor="ecom-headless"
                className="text-xs font-medium text-muted-foreground leading-none cursor-pointer"
              >
                {lang === "bn"
                  ? "ব্যাকগ্রাউন্ড মোড (Headless) - দ্রুত ও লাইটওয়েট"
                  : "Run in Stealth Background Mode (Headless - Faster)"}
              </label>
            </div>

            {/* Credit Cost Indicator */}
            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {lang === "bn" ? "প্রয়োজনীয় ক্রেডিট:" : "Required Credits:"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {lang === "bn"
                      ? `${pages} পেজ এর জন্য খরচ`
                      : `20 credits per 10 pages (${pages} pages requested)`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={hasEnoughCredits ? "default" : "destructive"}
                  className="font-mono text-xs px-2.5 py-0.5"
                >
                  {calculatedCost} {lang === "bn" ? "ক্রেডিট" : "Credits"}
                </Badge>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {lang === "bn" ? `ব্যালেন্স: ${userCredits}` : `Balance: ${userCredits}`}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-2.5 shadow-lg shadow-indigo-500/20 transition-all gap-2"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>{lang === "bn" ? "ইঞ্জিন শুরু হচ্ছে..." : "Initializing Engine..."}</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <span>{lang === "bn" ? `অপেক্ষা করুন (${cooldownRemaining}s)` : `Cooldown (${cooldownRemaining}s)`}</span>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>{lang === "bn" ? "স্ক্র্যাপার শুরু করুন" : "Start E-Commerce Scraper"}</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <ShoppingBag className="h-5 w-5 text-indigo-400" />
              <span>{lang === "bn" ? "ই-কমার্স স্ক্র্যাপিং নিশ্চিত করুন" : "Confirm E-Commerce Scraping Run"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lang === "bn"
                ? "স্ক্র্যাপিং শুরু হলে স্বয়ংক্রিয় ব্রাউজার ইঞ্জিন লিংকটি ভিজিট করবে এবং প্রোডাক্ট ডাটা সংগ্রহ করবে।"
                : "The automated browser engine will navigate to the target portal, extract product specifications, prices, and reviews."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "bn" ? "প্ল্যাটফর্ম:" : "Platform:"}</span>
                <span className="font-semibold uppercase text-indigo-400">{selectedPlatform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "bn" ? "টার্গেট লিংক:" : "Target URL:"}</span>
                <span className="font-mono font-medium max-w-[240px] truncate text-foreground">{url || "(Search mode)"}</span>
              </div>
              {query && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang === "bn" ? "সার্চ কুয়েরি:" : "Search Query:"}</span>
                  <span className="font-medium text-foreground">{query}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "bn" ? "পেজ সংখ্যা:" : "Pages to Crawl:"}</span>
                <span className="font-mono font-medium text-foreground">{pages}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-1.5 mt-1.5">
                <span className="font-semibold text-foreground">{lang === "bn" ? "ক্রেডিট কর্তন:" : "Credit Cost:"}</span>
                <span className="font-bold text-indigo-400">{calculatedCost} Credits</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
            >
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmScrape}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{lang === "bn" ? "শুরু করুন" : "Launch Engine"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
