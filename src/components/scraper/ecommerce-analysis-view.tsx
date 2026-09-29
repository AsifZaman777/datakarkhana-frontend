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
  Globe,
  Star,
  LayoutGrid,
  Table as TableIcon
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
import { ecommerceApi } from "@/lib/api/ecommerce";
import type { EcommerceProductItem } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { toast } from "sonner";

interface EcommerceAnalysisViewProps {
  jobId: number | null;
  query?: string;
  isJobRunning?: boolean;
}

export function EcommerceAnalysisView({
  jobId,
  query,
  isJobRunning = false,
}: EcommerceAnalysisViewProps) {
  const { lang } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<EcommerceProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "rating" | "reviews">("default");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Check if user has permission to download raw dataset
  const canDownload =
    isAdmin ||
    (user?.effective_permissions
      ? !!user.effective_permissions.allow_daraz_download
      : (user?.allow_download !== undefined && user?.allow_download !== null
          ? user.allow_download === 1
          : ["pro", "enterprise"].includes((user?.plan_tier || "").toLowerCase())));

  // Fetch job records
  useEffect(() => {
    if (!jobId) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    ecommerceApi
      .jobData(jobId)
      .then((res) => {
        if (res.data?.data) {
          setProducts(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [jobId, isJobRunning]);

  // Helper to extract clean integer/float price
  const parsePrice = (priceStr?: string): number => {
    if (!priceStr) return 0;
    const clean = String(priceStr).replace(/[^0-9.]/g, "");
    return parseFloat(clean) || 0;
  };

  const parseRating = (val?: string | number): number => {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const parseReviews = (val?: string | number): number => {
    if (!val) return 0;
    const num = parseInt(String(val).replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
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

    const prices = products
      .map((p) => parsePrice(p["Sale Price"] || p["Sale Price (BDT)"]))
      .filter((p) => p > 0);

    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const inStockItems = products.filter((p) => {
      const s = String(p["Stock Status"] || "").toLowerCase();
      return s.includes("in stock") || s.includes("available");
    });
    const inStockRate = Math.round((inStockItems.length / products.length) * 100);

    // Brand and Seller frequency
    const brandCounts: Record<string, number> = {};
    const sellerCounts: Record<string, number> = {};

    products.forEach((p) => {
      const b = String(p["Brand"] || "").trim();
      if (b && b.toLowerCase() !== "no brand") {
        brandCounts[b] = (brandCounts[b] || 0) + 1;
      }
      const s = String(p["Shop Name"] || p["Platform"] || "").trim();
      if (s) {
        sellerCounts[s] = (sellerCounts[s] || 0) + 1;
      }
    });

    const topBrand = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a])[0] || "N/A";
    const topSeller = Object.keys(sellerCounts).sort((a, b) => sellerCounts[b] - sellerCounts[a])[0] || "N/A";

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

  // ── Filter and Sort Pipeline ──
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!filterText) return true;
        const search = filterText.toLowerCase();
        const title = String(p["Product Name"] || "").toLowerCase();
        const seller = String(p["Shop Name"] || "").toLowerCase();
        const brand = String(p["Brand"] || "").toLowerCase();
        return title.includes(search) || seller.includes(search) || brand.includes(search);
      })
      .filter((p) => {
        if (stockFilter === "all") return true;
        const s = String(p["Stock Status"] || "").toLowerCase();
        if (stockFilter === "instock") return s.includes("in stock") || s.includes("available");
        if (stockFilter === "outofstock") return s.includes("out of stock") || s.includes("sold out");
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") {
          return parsePrice(a["Sale Price"] || a["Sale Price (BDT)"]) - parsePrice(b["Sale Price"] || b["Sale Price (BDT)"]);
        }
        if (sortBy === "price-high") {
          return parsePrice(b["Sale Price"] || b["Sale Price (BDT)"]) - parsePrice(a["Sale Price"] || a["Sale Price (BDT)"]);
        }
        if (sortBy === "rating") {
          return parseRating(b["Rating"]) - parseRating(a["Rating"]);
        }
        if (sortBy === "reviews") {
          return parseReviews(b["Review Count"]) - parseReviews(a["Review Count"]);
        }
        return 0;
      });
  }, [products, filterText, stockFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleDownloadExcel = () => {
    if (!jobId) return;
    if (!canDownload) {
      toast.error(
        lang === "bn"
          ? "এক্সেল ডাটা ডাউনলোডের সুবিধা প্রো এবং এন্টারপ্রাইজ প্ল্যানে উপলব্ধ।"
          : "Raw Excel download is available exclusively for Pro & Enterprise tiers."
      );
      return;
    }
    const url = ecommerceApi.downloadJobUrl(jobId);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* ── Header & Action Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-400" />
            <span>{lang === "bn" ? "ই-কমার্স প্রোডাক্ট ইন্টেলিজেন্স" : "E-Commerce Product Intelligence"}</span>
            {jobId && (
              <Badge variant="outline" className="font-mono text-xs border-indigo-500/40 text-indigo-400">
                Job #{jobId}
              </Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {query ? `Scraped target: ${query}` : "Deep product catalog analysis, pricing, and availability records"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-lg border border-border/40 bg-card/60">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table" ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleDownloadExcel}
            disabled={!jobId || products.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold gap-1.5 shadow-md shadow-indigo-600/20"
          >
            {canDownload ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            <span>{lang === "bn" ? "এক্সেল ডাউনলোড" : "Export Excel (.xlsx)"}</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-indigo-400" />
              <span>{lang === "bn" ? "মোট পণ্য" : "Total Products"}</span>
            </div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">
              {metrics.total}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {filteredProducts.length !== metrics.total ? `Filtered: ${filteredProducts.length}` : "From current crawl"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>{lang === "bn" ? "গড় মূল্য" : "Average Price"}</span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {metrics.avgPrice > 0 ? metrics.avgPrice.toLocaleString() : "N/A"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Calculated across parsed
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              <span>{lang === "bn" ? "সর্বনিম্ন / সর্বোচ্চ" : "Min / Max"}</span>
            </div>
            <div className="text-xs font-bold font-mono text-foreground mt-1.5">
              <span className="text-emerald-400">{metrics.minPrice.toLocaleString()}</span>
              {" - "}
              <span className="text-amber-400">{metrics.maxPrice.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Price spectrum
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{lang === "bn" ? "ইন-স্টক হার" : "In-Stock Rate"}</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {metrics.inStockRate}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {metrics.inStockCount} of {metrics.total} available
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-xl col-span-2 sm:col-span-1">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-purple-400" />
              <span>{lang === "bn" ? "শীর্ষ বিক্রেতা" : "Top Source"}</span>
            </div>
            <div className="text-xs font-bold text-foreground mt-1 truncate" title={metrics.topSeller}>
              {metrics.topSeller}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 truncate" title={metrics.topBrand}>
              Brand: {metrics.topBrand}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters & Search Bar ── */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardContent className="p-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={lang === "bn" ? "প্রোডাক্টের নাম বা বিক্রেতা দিয়ে খুঁজুন..." : "Filter by title, brand, or store..."}
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-xs bg-background/50 border-border/40"
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={stockFilter}
                onValueChange={(val) => {
                  setStockFilter(val || "all");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] text-xs bg-background/50 border-border/40">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "bn" ? "সকল স্টক" : "All Stock"}</SelectItem>
                  <SelectItem value="instock">{lang === "bn" ? "ইন-স্টক মাত্র" : "In Stock Only"}</SelectItem>
                  <SelectItem value="outofstock">{lang === "bn" ? "স্টক আউট" : "Out of Stock"}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(val) => {
                  if (val) setSortBy(val as any);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] text-xs bg-background/50 border-border/40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{lang === "bn" ? "ডিফল্ট ক্রমানুসার" : "Default Order"}</SelectItem>
                  <SelectItem value="price-low">{lang === "bn" ? "মূল্য: কম থেকে বেশি" : "Price: Low to High"}</SelectItem>
                  <SelectItem value="price-high">{lang === "bn" ? "মূল্য: বেশি থেকে কম" : "Price: High to Low"}</SelectItem>
                  <SelectItem value="rating">{lang === "bn" ? "রেটিং: সর্বোচ্চ" : "Rating: High to Low"}</SelectItem>
                  <SelectItem value="reviews">{lang === "bn" ? "রিভিউ: সর্বাধিক" : "Most Reviews"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Content View: Grid or Table ── */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">
            {lang === "bn" ? "প্রোডাক্ট ডাটা লোড হচ্ছে..." : "Loading extracted catalog items..."}
          </p>
        </div>
      ) : products.length === 0 ? (
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl py-16 text-center">
          <CardContent className="space-y-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit mx-auto border border-indigo-500/20">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {lang === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No Product Records Yet"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isJobRunning
                ? "The crawler engine is currently running. Products will stream in automatically once parsed."
                : "Select an e-commerce job from history or launch a new scrape from the Console tab."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedProducts.map((p, idx) => {
            const salePrice = p["Sale Price"] || p["Sale Price (BDT)"] || "Check Store";
            const origPrice = p["Original Price"] || p["Original Price (BDT)"];
            const discount = p["Discount"];
            const rating = p["Rating"];
            const reviews = p["Review Count"];
            const stock = String(p["Stock Status"] || "In Stock");
            const isInStock = stock.toLowerCase().includes("in stock") || stock.toLowerCase().includes("available");
            const imgUrl = p["Image URL"];
            const link = p["Product URL"] || "#";
            const platform = p["Platform"] || p["Shop Name"] || "Store";

            return (
              <Card
                key={idx}
                className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden flex flex-col hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
              >
                {/* Image header */}
                <div className="relative h-44 w-full bg-muted/40 flex items-center justify-center overflow-hidden border-b border-border/30">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={String(p["Product Name"] || "Product")}
                      className="object-contain h-full w-full p-2 group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                  )}

                  {/* Stock status badge */}
                  <Badge
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 ${
                      isInStock ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"
                    }`}
                  >
                    {stock}
                  </Badge>

                  {/* Discount badge */}
                  {discount && (
                    <Badge className="absolute top-2 right-2 bg-indigo-600 text-white font-bold text-[10px] px-1.5 py-0.5">
                      {discount}
                    </Badge>
                  )}
                </div>

                {/* Card Body */}
                <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1.5">
                    {/* Platform / Shop tag */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-indigo-400 truncate max-w-[140px]">
                        {platform}
                      </span>
                      {rating && (
                        <div className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{rating}</span>
                          {reviews && reviews !== "0" && (
                            <span className="text-muted-foreground font-normal text-[10px]">
                              ({reviews})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h4
                      className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors"
                      title={String(p["Product Name"] || "")}
                    >
                      {String(p["Product Name"] || "Untitled Product")}
                    </h4>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-foreground font-mono">
                        {salePrice}
                      </div>
                      {origPrice && (
                        <div className="text-[10px] text-muted-foreground line-through font-mono">
                          {origPrice}
                        </div>
                      )}
                    </div>

                    {link && link !== "#" && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
                        title="Open on Store"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3 w-12">#</th>
                  <th className="p-3">{lang === "bn" ? "পণ্য" : "Product"}</th>
                  <th className="p-3">{lang === "bn" ? "বিক্রয় মূল্য" : "Sale Price"}</th>
                  <th className="p-3">{lang === "bn" ? "আসল মূল্য" : "Original"}</th>
                  <th className="p-3">{lang === "bn" ? "রেটিং / রিভিউ" : "Rating / Reviews"}</th>
                  <th className="p-3">{lang === "bn" ? "স্টক" : "Stock"}</th>
                  <th className="p-3">{lang === "bn" ? "স্টোর" : "Store / Brand"}</th>
                  <th className="p-3 text-right">{lang === "bn" ? "লিংক" : "Link"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginatedProducts.map((p, idx) => {
                  const salePrice = p["Sale Price"] || p["Sale Price (BDT)"] || "";
                  const origPrice = p["Original Price"] || p["Original Price (BDT)"] || "-";
                  const stock = String(p["Stock Status"] || "In Stock");
                  const isInStock = stock.toLowerCase().includes("in stock") || stock.toLowerCase().includes("available");
                  const link = p["Product URL"] || "";
                  const num = (currentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground">{num}</td>
                      <td className="p-3 font-medium text-foreground max-w-xs truncate" title={String(p["Product Name"] || "")}>
                        {String(p["Product Name"] || "Product")}
                      </td>
                      <td className="p-3 font-bold font-mono text-indigo-400">{salePrice}</td>
                      <td className="p-3 text-muted-foreground font-mono">{origPrice}</td>
                      <td className="p-3">
                        {p["Rating"] ? (
                          <span className="text-amber-400 font-semibold font-mono">
                            ⭐ {p["Rating"]} ({p["Review Count"] || 0})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isInStock
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                              : "border-rose-500/40 text-rose-400 bg-rose-500/5"
                          }`}
                        >
                          {stock}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{p["Shop Name"] || p["Platform"] || "-"}</td>
                      <td className="p-3 text-right">
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex p-1 rounded hover:bg-muted text-indigo-400"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Pagination Bar ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground font-mono">
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs h-7 px-2.5"
            >
              Prev
            </Button>
            <span className="text-xs font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs h-7 px-2.5"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
