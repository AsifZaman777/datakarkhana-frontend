"use client";

import { Search, Database, Send, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/providers/language-provider";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Search,
      title: t.features.card1Title,
      desc: t.features.card1Desc,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/25",
    },
    {
      icon: Database,
      title: t.features.card2Title,
      desc: t.features.card2Desc,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
    },
    {
      icon: Send,
      title: t.features.card3Title,
      desc: t.features.card3Desc,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/25",
    },
    {
      icon: Mail,
      title: t.features.card4Title,
      desc: t.features.card4Desc,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/25",
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-border/40 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold uppercase tracking-wider">
            {t.features.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t.features.title}
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="glass-panel border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-card"
              >
                <CardContent className="p-5 sm:p-6 flex gap-4 sm:gap-5 items-start">
                  <div
                    className={`p-3 sm:p-3.5 rounded-xl border ${item.bg} group-hover:scale-110 transition-transform duration-300 shrink-0`}
                  >
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
