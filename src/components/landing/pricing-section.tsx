"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCalculator } from "@/components/landing/credit-calculator";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { paymentsApi } from "@/lib/api/payments";
import type { PaymentConfig, PaymentPackage } from "@/lib/types";

interface PricingSectionProps {
  onSelectPackage?: (pkg: PaymentPackage) => void;
  hideHeader?: boolean;
}

const DEFAULT_PACKAGES: PaymentPackage[] = [
  {
    id: "starter",
    name: "Starter Lead Pack",
    credits: 50,
    price_bdt: 350,
    price_per_credit_bdt: 7,
    popular: false,
    badge: "Starter",
    description: "Ideal for small outreach campaigns & testing.",
    features: [
      "50 Verified Lead Credits",
      "Full Phone & Email Access",
      "Unlimited Public Dataset Access",
      "Generate 10 Private Datasets",
      "WhatsApp Campaigns (max 250 leads/day)",
      "Single-Click CSV & Excel Export",
      "Local Selenium Scraper Access",
      "Standard Customer Support",
    ],
  },
  {
    id: "pro",
    name: "Pro Growth Pack",
    credits: 100,
    price_bdt: 550,
    price_per_credit_bdt: 5.5,
    popular: true,
    badge: "Most Popular",
    save_badge: "🔥 Save 1.5 Taka/Credit",
    description: "Best value! Power your WhatsApp & Email campaigns.",
    features: [
      "200 Verified Lead Credits",
      "Full Phone & Email Access",
      "Global Google Maps Scraping",
      "Priority Dataset Requests",
      "Unlimited Public Dataset Access",
      "Generate 5x Private Datasets",
      "WhatsApp Campaigns (max 350 leads/day)",
      "Email Campaigns (max 250 leads/day)",
      "24/7 Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Mega Pack",
    credits: 500,
    price_bdt: 2500,
    price_per_credit_bdt: 5,
    popular: false,
    badge: "Agency Choice",
    save_badge: "🔥 Save 2.0 Taka/Credit",
    description: "Maximum credits for high-volume agency scraping.",
    features: [
      "500 Verified Lead Credits",
      "Full Phone & Email Access",
      "Global Google Maps Scraping",
      "Instant Public Catalog Unlocks",
      "Generate 10x Private Datasets",
      "Unlimited WhatsApp Campaigns",
      "Unlimited Email Campaigns (~10k/month)",
      "Dedicated Account Manager",
      "Custom Location & Niche Requests",
    ],
  },
];

export function PricingSection({ onSelectPackage, hideHeader = false }: PricingSectionProps) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    paymentsApi
      .publicPackagesConfig()
      .then((res) => {
        if (res.data?.packages && res.data.packages.length > 0) {
          setConfig(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const rawPackages = config?.packages && config.packages.length > 0 ? config.packages : DEFAULT_PACKAGES;
  const packages = rawPackages;

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 border-t border-border/40 relative overflow-visible">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {!hideHeader && (
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2.5">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
              {t.pricing.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {t.pricing.title}
            </h2>
          </div>
        )}

        {/* Pricing Cards Grid - pt-8 provides dedicated headroom for popular badge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-8 pb-4">
          {packages.map((pkg) => {
            const isPopular = pkg.popular;
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col transition-all duration-300 ${
                  isPopular ? "md:-translate-y-2.5 z-10" : "z-0"
                }`}
              >
                {/* Floating Popular Badge placed OUTSIDE Card to prevent overflow-hidden clipping */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                    <Badge className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-extrabold uppercase tracking-wider text-[10px] px-3.5 py-1 shadow-lg shadow-amber-500/30 border-0 whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      {pkg.badge || "MOST POPULAR"}
                    </Badge>
                  </div>
                )}

                <Card
                  className={`h-full flex flex-col rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                    isPopular
                      ? "glass-panel border-2 border-amber-500 shadow-xl shadow-amber-500/15 bg-gradient-to-b from-amber-500/[0.08] via-card to-card"
                      : "glass-panel border border-border hover:border-primary/50 hover:shadow-lg bg-card"
                  }`}
                >
                  {/* Card Header & Price */}
                  <div className="space-y-2 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">{pkg.name}</h3>
                      {pkg.save_badge && (
                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-[11px] py-0.5 px-2 shrink-0">
                          {pkg.save_badge}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5 pt-0.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight">
                        ৳{pkg.price_bdt}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono font-medium">
                        BDT / {pkg.credits} CR
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="py-4 flex-1">
                    <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug text-foreground/90">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-2 mt-auto">
                    <Button
                      onClick={() => {
                        if (onSelectPackage) {
                          onSelectPackage(pkg);
                        }
                      }}
                      className={`w-full font-bold text-xs sm:text-sm py-2.5 shadow-sm transition-all ${
                        isPopular
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20"
                          : "hover:bg-accent/80 hover:text-foreground"
                      }`}
                      variant={isPopular ? "default" : "outline"}
                    >
                      {!onSelectPackage ? (
                        user ? (
                          <Link href="/upgrade" className="w-full text-center">
                            {lang === "bn" ? `${pkg.name}-এ আপগ্রেড` : `Upgrade to ${pkg.name}`}
                          </Link>
                        ) : (
                          <a href="#download" className="w-full text-center">
                            {lang === "bn" ? "শুরু করতে অ্যাপ ডাউনলোড করুন" : "Download App to Start"}
                          </a>
                        )
                      ) : (
                        <span>{lang === "bn" ? `${pkg.name} নির্বাচন করুন` : `Select ${pkg.name}`}</span>
                      )}
                    </Button>
                  </div>
                </Card>
            </div>
          );
          })}
        </div>

        {/* Credit Calculator */}
        <div className="mt-12 sm:mt-14">
          <CreditCalculator
            customRate={config?.custom_package?.price_per_credit_bdt}
            minCredits={config?.custom_package?.min_credits}
            maxCredits={config?.custom_package?.max_credits}
          />
        </div>
      </div>
    </section>
  );
}
