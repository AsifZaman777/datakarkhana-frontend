"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Zap,
  Database,
  Send,
  Mail,
  Coins,
  Laptop,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/providers/language-provider";

export default function TutorialPage() {
  const { t, lang } = useLanguage();
  const tut = t.tutorial || {};
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    {
      id: "overview",
      title: tut.categories?.overview || (lang === "bn" ? "প্ল্যাটফর্ম ওভারভিউ" : "Overview & Quickstart"),
      icon: Sparkles,
      color: "text-primary",
      borderColor: "border-primary/40",
      data: tut.overview,
      actionHref: "/catalog",
      actionText: tut.openToolBtn || (lang === "bn" ? "ক্যাটালগ দেখুন" : "Browse Datasets"),
    },
    {
      id: "scraper",
      title: tut.categories?.scraper || (lang === "bn" ? "গুগল ম্যাপস স্ক্র্যাপার" : "Google Maps Scraper"),
      icon: Search,
      color: "text-cyan-400",
      borderColor: "border-cyan-500/40",
      data: tut.scraper,
      actionHref: "/scraper",
      actionText: tut.openToolBtn || (lang === "bn" ? "স্ক্র্যাপার চালান" : "Run Live Scraper"),
    },
    {
      id: "catalog",
      title: tut.categories?.catalog || (lang === "bn" ? "ডাটা ক্যাটালগ ও এক্সপোর্ট" : "Datasets Catalog"),
      icon: Database,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/40",
      data: tut.catalog,
      actionHref: "/catalog",
      actionText: tut.openToolBtn || (lang === "bn" ? "ডাটা ক্যাটালগ খুলুন" : "Open Catalog"),
    },
    {
      id: "whatsapp",
      title: tut.categories?.whatsapp || (lang === "bn" ? "হোয়াটসঅ্যাপ অটোমেশন" : "WhatsApp Engine"),
      icon: Send,
      color: "text-emerald-500",
      borderColor: "border-emerald-600/40",
      data: tut.whatsapp,
      actionHref: "/marketing?tab=whatsapp",
      actionText: tut.openToolBtn || (lang === "bn" ? "হোয়াটসঅ্যাপ ক্যাম্পেইন" : "WhatsApp Marketing"),
    },
    {
      id: "email",
      title: tut.categories?.email || (lang === "bn" ? "এআই ইমেইল বিল্ডার" : "AI Email Builder"),
      icon: Mail,
      color: "text-purple-400",
      borderColor: "border-purple-500/40",
      data: tut.email,
      actionHref: "/marketing?tab=email",
      actionText: tut.openToolBtn || (lang === "bn" ? "ইমেইল ক্যাম্পেইন" : "Email Builder"),
    },
    {
      id: "payment",
      title: tut.categories?.payment || (lang === "bn" ? "ক্রেডিট ও পেমেন্ট নির্দেশিকা" : "Credits & Payment"),
      icon: Coins,
      color: "text-amber-500",
      borderColor: "border-amber-500/40",
      data: tut.payment,
      actionHref: "/upgrade",
      actionText: tut.openToolBtn || (lang === "bn" ? "প্যাকেজ দেখুন" : "Recharge Credits"),
    },
    {
      id: "desktop",
      title: tut.categories?.desktop || (lang === "bn" ? "ডেস্কটপ অ্যাপ ও লাইসেন্স" : "Desktop App & License"),
      icon: Laptop,
      color: "text-blue-400",
      borderColor: "border-blue-500/40",
      data: tut.desktop,
      actionHref: "/#download",
      actionText: tut.openToolBtn || (lang === "bn" ? "অ্যাপ ডাউনলোড পেজ" : "Download Page"),
    },
  ];

  // Filter categories and steps based on search query
  const query = searchQuery.trim().toLowerCase();
  const filteredCategories = categories.filter((cat) => {
    if (!query) return true;
    const data = cat.data || {};
    const textCorpus = [
      cat.title,
      data.title,
      data.desc,
      data.step1Title,
      data.step1Desc,
      data.step2Title,
      data.step2Desc,
      data.step3Title,
      data.step3Desc,
      data.step4Title,
      data.step4Desc,
      data.tip,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return textCorpus.includes(query);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="space-y-3 border-b border-border/40 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wide">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span>{tut.badge || "PLATFORM USER GUIDE & WORKFLOWS"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {tut.title || "Interactive Platform Tutorial & Instruction Guide"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
          {tut.subtitle ||
            "Learn how to effectively collect verified B2B leads, execute Google Maps web scraping, launch WhatsApp & Email campaigns, and manage credits."}
        </p>

        {/* ── Interactive Search ── */}
        <div className="pt-2 max-w-xl">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tut.searchPlaceholder || "Search instructions (e.g. scrape leads, anti-ban, bKash payment)..."}
              className="pl-10 h-11 text-xs sm:text-sm bg-card/60 backdrop-blur border-border/50 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* ── Tabs / Search Results ── */}
      {filteredCategories.length === 0 ? (
        <Card className="glass-panel p-12 text-center space-y-3">
          <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-60" />
          <p className="text-sm font-semibold text-foreground">
            {tut.searchEmpty || "No tutorial topics match your search query."}
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
            {lang === "bn" ? "সার্চ ক্লিয়ার করুন" : "Clear Search"}
          </Button>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          {/* Tabs header: horizontal scrollable on mobile */}
          <TabsList className="bg-card/70 border border-border/50 p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto h-auto justify-start flex-nowrap rounded-xl shadow-sm">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="gap-2 text-xs font-semibold px-3.5 py-2 shrink-0 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab contents */}
          {filteredCategories.map((cat) => {
            const data = cat.data || {};
            const Icon = cat.icon;

            const steps = [
              { title: data.step1Title, desc: data.step1Desc },
              { title: data.step2Title, desc: data.step2Desc },
              { title: data.step3Title, desc: data.step3Desc },
              { title: data.step4Title, desc: data.step4Desc },
            ].filter((s) => s.title && s.desc);

            return (
              <TabsContent key={cat.id} value={cat.id} className="space-y-6 pt-2">
                {/* Category Overview Card */}
                <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-card border ${cat.borderColor} shadow-md`}>
                        <Icon className={`h-6 w-6 ${cat.color}`} />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                          {data.title || cat.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
                          {data.desc}
                        </p>
                      </div>
                    </div>

                    {cat.actionHref && (
                      <Link href={cat.actionHref} className="shrink-0">
                        <Button className="gap-2 text-xs font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 h-9">
                          <span>{cat.actionText}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Step-by-Step Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                    {steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border/40 bg-background/50 hover:bg-background/80 transition-all p-5 space-y-2 relative group hover:border-primary/30 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {tut.stepPrefix || (lang === "bn" ? "ধাপ" : "STEP")} {idx + 1}
                          </span>
                          <h3 className="font-bold text-sm text-foreground">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                          {step.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pro Tip Box */}
                  {data.tip && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 shadow-inner">
                      <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400">
                          {tut.quickTip || (lang === "bn" ? "জরুরি টিপস" : "PRO TIP")}
                        </span>
                        <p className="text-amber-200/90 text-xs leading-relaxed">
                          {data.tip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Quick Jump Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap className="h-4 w-4 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {lang === "bn" ? "রিয়েল-টাইম স্ক্র্যাপার" : "Live Scraper Engine"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {lang === "bn" ? "ম্যাপস ডাটা সরাসরি সংগ্রহ" : "Extract B2B Maps leads"}
                        </div>
                      </div>
                    </div>
                    <Link href="/scraper">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Database className="h-4 w-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {lang === "bn" ? "ভেরিফাইড ডাটাবেস" : "Public Leads Catalog"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {lang === "bn" ? "হাজার হাজার প্রস্তুত ডাটা" : "Browse categorized leads"}
                        </div>
                      </div>
                    </div>
                    <Link href="/catalog">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Send className="h-4 w-4 text-pink-400" />
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {lang === "bn" ? "মার্কেটিং অটোমেশন" : "WhatsApp & Email"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {lang === "bn" ? "অ্যান্টি-ব্যান বাল্ক মেসেজ" : "Anti-ban campaign dispatch"}
                        </div>
                      </div>
                    </div>
                    <Link href="/marketing">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
