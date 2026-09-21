"use client";

import { useState, type FormEvent } from "react";
import { Search, ShoppingBag, Zap, Coins, Sparkles, AlertCircle, Layers } from "lucide-react";
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
import { darazApi } from "@/lib/api/daraz";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";

interface DarazScraperFormProps {
  onJobCreated: (jobId: number) => void;
  cooldownRemaining: number;
}

const SUGGESTED_QUERIES = [
  "Wireless Mouse",
  "Mechanical Keyboard",
  "Smart Watch",
  "TWS Earbuds",
  "Gaming Headphone",
  "Power Bank 20000mAh",
  "Bluetooth Speaker",
];

export function DarazScraperForm({
  onJobCreated,
  cooldownRemaining,
}: DarazScraperFormProps) {
  const { lang } = useLanguage();
  const { user, isAdmin } = useAuth();

  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<number>(1);
  const [maxItems, setMaxItems] = useState<string>("all");
  const [headless, setHeadless] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 20 credits per 10 pages
  const calculatedCost = Math.ceil(Math.max(1, pages) / 10) * 20;
  const userCredits = user?.credits ?? 0;
  const hasEnoughCredits = isAdmin || userCredits >= calculatedCost;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      toast.error(
        lang === "bn"
          ? "অনুগ্রহ করে একটি প্রোডাক্টের সার্চ নাম লিখুন।"
          : "Please enter a product search query."
      );
      return;
    }

    if (!hasEnoughCredits) {
      toast.error(
        lang === "bn"
          ? `অপর্যাপ্ত ক্রেডিট! আপনার প্রয়োজন ${calculatedCost} ক্রেডিট কিন্তু রয়েছে ${userCredits} ক্রেডিট।`
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
      const res = await darazApi.startScrape({
        query: query.trim(),
        pages: Number(pages) || 1,
        max_items: parsedMaxItems,
        headless,
      });

      if (res.data?.success && res.data?.job_id) {
        toast.success(
          lang === "bn"
            ? `দারাজ স্ক্র্যাপার শুরু হয়েছে! জব #${res.data.job_id}`
            : `Daraz Scraper started! Job #${res.data.job_id}`
        );
        onJobCreated(res.data.job_id);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to start Daraz scraper.";
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
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  {lang === "bn" ? "দারাজ পণ্য ডাটা কনফিগারেশন" : "Daraz Product Scraper"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {lang === "bn"
                    ? "দারাজ বাংলাদেশ থেকে সরাসরি পণ্য ডাটা ও এনালাইসিস সংগ্রহ করুন"
                    : "Automated real-time search & product market intelligence"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-semibold bg-orange-500/10 text-orange-400 border-orange-500/30">
              Daraz.com.bd
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search Query Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>{lang === "bn" ? "সার্চ কুয়েরি / পণ্যের নাম" : "Search Query / Product"}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {lang === "bn" ? "যেমন: Wireless Mouse" : "e.g. Mechanical Keyboard"}
                </span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    lang === "bn"
                      ? "দারাজে সার্চ করার জন্য পণ্যের নাম লিখুন..."
                      : "Enter product keywords to search in Daraz..."
                  }
                  className="pl-9 text-xs bg-background/50 border-border/50 focus-visible:ring-orange-500/40"
                />
              </div>

              {/* Suggestion Chips */}
              <div className="pt-1">
                <div className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                  <Sparkles className="h-3 w-3 text-orange-400" />
                  {lang === "bn" ? "জনপ্রিয় সার্চ আইডিয়া:" : "Quick Ideas:"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUERIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-accent/60 hover:bg-orange-500/20 hover:text-orange-300 border border-border/40 text-muted-foreground transition-all"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagination & Limit Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Pagination Travel Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    {lang === "bn" ? "পেজ সংখ্যা (Pagination)" : "Pagination Travel"}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    ~{pages * 40} {lang === "bn" ? "টি পণ্য" : "items"}
                  </span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={pages}
                    onChange={(e) => setPages(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                    className="text-xs bg-background/50 border-border/50 font-mono"
                  />
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {lang === "bn" ? "পেজ (১-১০)" : "pages (1-10)"}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {lang === "bn"
                    ? "প্রতি পেজে প্রায় ৪০টি করে পণ্য রয়েছে।"
                    : "~40 products per page will be scanned."}
                </p>
              </div>

              {/* Max Items Limit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {lang === "bn" ? "আইটেম লিমিট (ঐচ্ছিক)" : "Max Items Limit"}
                </Label>
                <Select value={maxItems} onValueChange={(val) => setMaxItems(val || "all")}>
                  <SelectTrigger className="text-xs bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {lang === "bn" ? "সমস্ত পণ্য (সবগুলো পেজ)" : "All products on pages"}
                    </SelectItem>
                    <SelectItem value="10">10 products</SelectItem>
                    <SelectItem value="20">20 products</SelectItem>
                    <SelectItem value="40">40 products</SelectItem>
                    <SelectItem value="80">80 products</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {lang === "bn" ? "নির্দিষ্ট সংখ্যা পর্যন্ত স্ক্র্যাপ করে থামবে।" : "Stop early once limit is collected."}
                </p>
              </div>
            </div>

            {/* Headless Mode & Economics */}
            <div className="pt-2 border-t border-border/30 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border/40">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="daraz-headless"
                    checked={headless}
                    onCheckedChange={(checked) => setHeadless(Boolean(checked))}
                  />
                  <label
                    htmlFor="daraz-headless"
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {lang === "bn" ? "ব্যাকগ্রাউন্ড মোড (Headless Engine)" : "Background Mode (Headless Engine)"}
                  </label>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {headless ? (lang === "bn" ? "সুপারফাস্ট" : "Superfast") : (lang === "bn" ? "ভিজ্যুয়াল" : "Visual")}
                </Badge>
              </div>

              {/* Credit Pricing Info */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Coins className="h-4 w-4" />
                  <span>{lang === "bn" ? "প্রয়োজনীয় ক্রেডিট:" : "Required Credits:"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {isAdmin ? (lang === "bn" ? "ফ্রি (এডমিন)" : "0 (Admin)") : `${calculatedCost} Credits`}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    (20 credits / 10 pages)
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || cooldownRemaining > 0 || !hasEnoughCredits}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs py-2.5 shadow-lg shadow-orange-500/20"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isSubmitting
                ? (lang === "bn" ? "শুরু হচ্ছে..." : "Initializing Scraper...")
                : cooldownRemaining > 0
                ? (lang === "bn" ? `অপেক্ষা করুন (${cooldownRemaining}s)` : `Cooldown (${cooldownRemaining}s)`)
                : (lang === "bn" ? `দারাজ স্ক্র্যাপিং চালু করুন (${calculatedCost} ক্রেডিট)` : `Run Daraz Scraper (${calculatedCost} Credits)`)}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              {lang === "bn" ? "দারাজ স্ক্র্যাপিং শুরু নিশ্চিতকরণ" : "Confirm Daraz Scrape Run"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lang === "bn"
                ? "দারাজে সার্চ করে স্বয়ংক্রিয়ভাবে পণ্য ডাটা সংগ্রহ শুরু হবে।"
                : "The background engine will navigate to Daraz.com.bd and extract product intelligence."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-accent/40 border border-border/40 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "bn" ? "সার্চ কুয়েরি:" : "Query:"}</span>
                <span className="font-semibold text-foreground">{query}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "bn" ? "পেজ সংখ্যা:" : "Pagination:"}</span>
                <span className="font-semibold text-cyan-400">{pages} page(s) (~{pages * 40} products)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{lang === "bn" ? "আইটেম লিমিট:" : "Item Limit:"}</span>
                <span className="font-semibold">{maxItems === "all" ? "All" : `${maxItems} items`}</span>
              </div>
              <div className="flex justify-between border-t border-border/30 pt-1.5">
                <span className="text-muted-foreground">{lang === "bn" ? "খরচ:" : "Cost:"}</span>
                <span className="font-bold text-orange-400">
                  {isAdmin ? "0 Credits (Admin Free)" : `${calculatedCost} Credits`}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {lang === "bn"
                  ? "ফলাফল স্বয়ংক্রিয়ভাবে আপনার প্রাইভেট ক্যাটালগে সেভ হবে। আপনি যে কোনো সময় স্ক্র্যাপিং থামাতে পারেন।"
                  : "Results will be saved to your Private Catalogue. You can pause or stop scraping at any moment."}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              className="text-xs"
            >
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmScrape}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
            >
              {lang === "bn" ? "নিশ্চিত ও শুরু করুন" : "Confirm & Launch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
