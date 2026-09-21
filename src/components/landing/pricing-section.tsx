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

export function PricingSection({ onSelectPackage, hideHeader = false }: PricingSectionProps) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    paymentsApi
      .packagesConfig()
      .then((res) => setConfig(res.data))
      .catch(() => {});
  }, []);

  const packages = config?.packages || [];

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 border-t border-border/40 relative overflow-visible">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {!hideHeader && (
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2.5">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold uppercase tracking-wider">
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
                  className={`h-full flex flex-col justify-between rounded-2xl py-0 ${
                    isPopular
                      ? "glass-panel border-2 border-amber-500/80 shadow-2xl shadow-amber-500/15 bg-gradient-to-b from-amber-500/[0.08] via-card to-card"
                      : "glass-panel border border-border/40 hover:border-border/80 hover:shadow-lg bg-card/60 backdrop-blur-xl"
                  }`}
                >

                <CardHeader className="space-y-2.5 p-5 sm:p-6 lg:p-7">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl font-bold">{pkg.name}</CardTitle>
                    {pkg.save_badge && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[11px] py-0.5 px-2">
                        {pkg.save_badge}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight">
                      ৳{pkg.price_bdt}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      BDT / {pkg.credits} CR
                    </span>
                  </div>

                  <CardDescription className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 lg:p-7 pt-0 flex-1 flex flex-col justify-between space-y-6">
                  <ul className="space-y-2.5 text-xs text-muted-foreground/90">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
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
                </CardContent>
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
