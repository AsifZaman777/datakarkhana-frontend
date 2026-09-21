"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Download,
  Search,
  Lock,
  Tag,
  Store,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { darazApi } from "@/lib/api/daraz";
import type { DarazProductItem } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";

interface DarazAnalysisViewProps {
  jobId: number | null;
  query?: string;
  isJobRunning?: boolean;
  onOpenPaymentModal?: () => void;
}

export function DarazAnalysisView({
  jobId,
  query,
  isJobRunning = false,
  onOpenPaymentModal,
}: DarazAnalysisViewProps) {
  const { lang } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<DarazProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "rating">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Check if user has permission to download raw dataset
  const canDownload = isAdmin || ["pro", "enterprise"].includes(user?.plan_tier?.toLowerCase() || "");

  // Fetch job records
  useEffect(() => {
    if (!jobId) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    darazApi
      .jobData(jobId)
      .then((res) => {
        if (res.data?.data) {
          setProducts(res.data.data);
        }
      })
      .catch(() => {
        // Job might still be parsing or empty
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [jobId, isJobRunning]);

  // Helper to extract clean integer price
  const parsePrice = (priceStr?: string): number => {
    if (!priceStr) return 0;
    const num = String(priceStr).replace(/[^0-9.]/g, "");
    return parseFloat(num) || 0;
  };

  // ── Metrics Calculation ──
  const metrics = useMemo(() => {
    if (products.length === 0) {
      return {
        total: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        inStockCount: 0,
        inStockRate: 0,
        topBrand: "N/A",
        topSeller: "N/A",
      };
    }

    const prices = products.map((p) => parsePrice(p["Sale Price (BDT)"])).filter((p) => p > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const inStockItems = products.filter(
      (p) => String(p["Stock Status"] || "").toLowerCase().includes("in stock")
    );
    const inStockRate = Math.round((inStockItems.length / products.length) * 100);

    // Frequency counts for brands and sellers
    const brandCounts: Record<string, number> = {};
    const sellerCounts: Record<string, number> = {};

    products.forEach((p) => {
      const b = String(p["Brand"] || "No Brand").trim();
      if (b && b !== "No Brand") {
        brandCounts[b] = (brandCounts[b] || 0) + 1;
      }
      const s = String(p["Shop Name"] || "").trim();
      if (s) {
        sellerCounts[s] = (sellerCounts[s] || 0) + 1;
      }
    });

    const topBrand =
      Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Various Brands";
    const topSeller =
      Object.entries(sellerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Various Shops";

    return {
      total: products.length,
      avgPrice,
      minPrice,
      maxPrice,
      inStockCount: inStockItems.length,
      inStockRate,
      topBrand,
      topSeller,
    };
  }, [products]);

  // ── Filter & Sort Products ──
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const text = filterText.toLowerCase();
        const matchesText =
          !text ||
          String(p["Product Name"] || "").toLowerCase().includes(text) ||
          String(p["Shop Name"] || "").toLowerCase().includes(text) ||
          String(p["Brand"] || "").toLowerCase().includes(text) ||
          String(p["Category"] || "").toLowerCase().includes(text);

        const status = String(p["Stock Status"] || "").toLowerCase();
        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in-stock" && status.includes("in stock")) ||
          (stockFilter === "out-of-stock" && status.includes("out of stock"));

        return matchesText && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") {
          return parsePrice(a["Sale Price (BDT)"]) - parsePrice(b["Sale Price (BDT)"]);
        }
        if (sortBy === "price-high") {
          return parsePrice(b["Sale Price (BDT)"]) - parsePrice(a["Sale Price (BDT)"]);
        }
        if (sortBy === "rating") {
          return (
            parseFloat(String(b["Rating"] || "0")) - parseFloat(String(a["Rating"] || "0"))
          );
        }
        return 0;
      });
  }, [products, filterText, stockFilter, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedItems = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownload = () => {
    if (!jobId) return;

    if (!canDownload) {
      toast.warning(
        lang === "bn"
          ? "দারাজ এক্সেল ফাইল ডাউনলোড সুবিধা শুধু প্রো ও এন্টারপ্রাইজ গ্রাহকদের জন্য। সম্পূর্ণ ডাটা প্রাইভেট ক্যাটালগে দেখতে পাচ্ছেন।"
          : "Raw Excel spreadsheet export is available on Pro & Enterprise plans. You can view and analyze all data directly in this Private Catalogue.",
        {
          action: onOpenPaymentModal
            ? {
                label: lang === "bn" ? "আপগ্রেড করুন" : "Upgrade Plan",
                onClick: onOpenPaymentModal,
              }
            : undefined,
        }
      );
      return;
    }

    const url = darazApi.downloadJobUrl(jobId);
    window.open(url, "_blank");
  };

  if (!jobId) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl p-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="font-bold text-sm text-foreground">
          {lang === "bn" ? "কোন স্ক্র্যাপার জব নির্বাচন করা হয়নি" : "No Daraz Job Selected"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          {lang === "bn"
            ? "নতুন স্ক্র্যাপিং শুরু করুন বা পূর্ববর্তী জব হিস্ট্রি থেকে একটি জব নির্বাচন করে এনালাইসিস দেখুন।"
            : "Start a new scraping query or select a previous job from the history tab to view market insights."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border/40 bg-card/50 backdrop-blur-md p-3">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <Package className="h-3 w-3 text-orange-400" />
            {lang === "bn" ? "মোট পণ্য" : "Total Products"}
          </div>
          <div className="text-xl font-extrabold text-foreground mt-1 font-mono">
            {metrics.total}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {query ? `"${query}"` : "Scraped"}
          </div>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-md p-3">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            {lang === "bn" ? "গড় মূল্য" : "Avg Price"}
          </div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">
            ৳ {metrics.avgPrice.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">BDT per unit</div>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-md p-3">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <Tag className="h-3 w-3 text-cyan-400" />
            {lang === "bn" ? "মূল্য সীমা" : "Price Range"}
          </div>
          <div className="text-xs font-bold text-foreground mt-1 font-mono">
            ৳{metrics.minPrice} - ৳{metrics.maxPrice}
          </div>
          <div className="text-[10px] text-muted-foreground">Min / Max BDT</div>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-md p-3">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-teal-400" />
            {lang === "bn" ? "স্টক রেট" : "In Stock Rate"}
          </div>
          <div className="text-xl font-extrabold text-teal-400 mt-1 font-mono">
            {metrics.inStockRate}%
          </div>
          <div className="text-[10px] text-muted-foreground">
            {metrics.inStockCount} of {metrics.total} items
          </div>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-md p-3">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            {lang === "bn" ? "শীর্ষ ব্র্যান্ড" : "Top Brand"}
          </div>
          <div className="text-xs font-bold text-foreground mt-1 truncate">
            {metrics.topBrand}
          </div>
          <div className="text-[10px] text-muted-foreground">Most common brand</div>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-md p-3">
          <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <Store className="h-3 w-3 text-amber-400" />
            {lang === "bn" ? "শীর্ষ বিক্রেতা" : "Top Seller"}
          </div>
          <div className="text-xs font-bold text-foreground mt-1 truncate">
            {metrics.topSeller}
          </div>
          <div className="text-[10px] text-muted-foreground">Most active shop</div>
        </Card>
      </div>

      {/* ── Filter Bar & Actions ── */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-400" />
              {lang === "bn" ? "প্রাইভেট ক্যাটালগ ও পণ্য তালিকা" : "Private Catalogue & Market List"}
            </CardTitle>
            <CardDescription className="text-xs">
              {lang === "bn"
                ? `${filteredProducts.length} টি পণ্য পাওয়া গেছে`
                : `Showing ${filteredProducts.length} filtered items from Job #${jobId}`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              size="sm"
              variant={canDownload ? "default" : "outline"}
              className={`text-xs font-bold gap-1.5 ${
                canDownload
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              {canDownload ? (
                <>
                  <Download className="h-3.5 w-3.5" />
                  {lang === "bn" ? "এক্সেল ডাউনলোড (.xlsx)" : "Download Excel (.xlsx)"}
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  {lang === "bn" ? "এক্সেল ডাউনলোড (প্রো সুবিধা)" : "Download Excel (Pro Only)"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  lang === "bn" ? "নাম, বিক্রেতা বা ব্র্যান্ড দিয়ে ফিল্টার করুন..." : "Filter by name, seller, brand..."
                }
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-xs bg-background/50 h-9"
              />
            </div>

            <Select
              value={stockFilter}
              onValueChange={(val) => {
                setStockFilter(val || "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] text-xs h-9 bg-background/50">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "bn" ? "সকল স্টক" : "All Stock"}</SelectItem>
                <SelectItem value="in-stock">{lang === "bn" ? "ইন স্টক" : "In Stock Only"}</SelectItem>
                <SelectItem value="out-of-stock">{lang === "bn" ? "আউট অব স্টক" : "Out of Stock"}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy((val as any) || "default");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] text-xs h-9 bg-background/50">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{lang === "bn" ? "ডিফল্ট ক্রম" : "Default Order"}</SelectItem>
                <SelectItem value="price-low">{lang === "bn" ? "দাম: কম থেকে বেশি" : "Price: Low to High"}</SelectItem>
                <SelectItem value="price-high">{lang === "bn" ? "দাম: বেশি থেকে কম" : "Price: High to Low"}</SelectItem>
                <SelectItem value="rating">{lang === "bn" ? "রেটিং অনুযায়ী" : "Highest Rating"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Product Table ── */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {lang === "bn" ? "ডাটা লোড হচ্ছে..." : "Loading products from private catalogue..."}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {lang === "bn" ? "কোন পণ্য পাওয়া যায়নি।" : "No products matching your search filter."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <table className="w-full text-xs">
                <thead className="bg-accent/40 text-muted-foreground border-b border-border/40 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 text-left w-12">#</th>
                    <th className="py-2.5 px-3 text-left">{lang === "bn" ? "পণ্য ও ব্র্যান্ড" : "Product & Brand"}</th>
                    <th className="py-2.5 px-3 text-left">{lang === "bn" ? "বিক্রয় মূল্য" : "Sale Price"}</th>
                    <th className="py-2.5 px-3 text-left">{lang === "bn" ? "মূল দাম / ছাড়" : "Original / Disc"}</th>
                    <th className="py-2.5 px-3 text-left">{lang === "bn" ? "বিক্রেতা ও রেটিং" : "Seller & Rating"}</th>
                    <th className="py-2.5 px-3 text-left">{lang === "bn" ? "স্টক স্ট্যাটাস" : "Stock Status"}</th>
                    <th className="py-2.5 px-3 text-right">{lang === "bn" ? "অ্যাকশন" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedItems.map((item, idx) => {
                    const absIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                    const stock = String(item["Stock Status"] || "");
                    const isInStock = stock.toLowerCase().includes("in stock");
                    const imgUrl = item["Image URL"] ? String(item["Image URL"]) : "";

                    return (
                      <tr key={idx} className="hover:bg-accent/20 transition-colors">
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {absIndex}
                        </td>
                        <td className="py-2.5 px-3 max-w-sm">
                          <div className="flex items-start gap-2.5">
                            {imgUrl ? (
                              <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden border border-border/40 bg-accent/20">
                                <img
                                  src={imgUrl}
                                  alt={String(item["Product Name"] || "")}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded border border-border/40 bg-accent/20 flex items-center justify-center text-muted-foreground">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                            <div className="space-y-0.5 min-w-0">
                              <a
                                href={String(item["Product URL"] || "#")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-foreground hover:text-orange-400 line-clamp-2 transition-colors"
                              >
                                {String(item["Product Name"] || "Untitled Product")}
                              </a>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Badge variant="outline" className="text-[9px] py-0 px-1 border-border/40">
                                  {String(item["Brand"] || "No Brand")}
                                </Badge>
                                {item["Rating"] && (
                                  <span className="text-amber-400 font-mono">
                                    ★ {String(item["Rating"])}
                                    {item["Review Count"] ? ` (${item["Review Count"]})` : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-bold text-orange-400 text-sm font-mono">
                            {String(item["Sale Price (BDT)"] || "-")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground text-[11px]">
                          <div className="line-through font-mono">
                            {String(item["Original Price (BDT)"] || "")}
                          </div>
                          {item["Discount"] && (
                            <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] py-0 px-1">
                              {String(item["Discount"])}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground truncate max-w-[140px]">
                              {String(item["Shop Name"] || "-")}
                            </div>
                            {item["Shop Rating"] && (
                              <div className="text-[10px] text-emerald-400 font-medium">
                                {String(item["Shop Rating"])} positive
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge
                            className={`text-[10px] py-0.5 px-1.5 ${
                              isInStock
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {stock || (isInStock ? "In Stock" : "Out of Stock")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <a
                            href={String(item["Product URL"] || "#")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-medium transition-colors"
                          >
                            <span>Daraz</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Table Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredProducts.length} items)
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs px-2.5"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 text-xs px-2.5"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
