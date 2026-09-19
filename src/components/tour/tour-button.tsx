"use client";

import { Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/language-provider";
import { useProductTour } from "@/providers/tour-provider";
import { cn } from "@/lib/utils";

interface TourButtonProps {
  variant?: "topbar" | "sidebar" | "inline";
  className?: string;
  tab?: string;
}

export function TourButton({ variant = "topbar", className, tab }: TourButtonProps) {
  const { lang } = useLanguage();
  const { startTour, isRunning } = useProductTour();

  const handleLaunch = () => {
    startTour(tab);
  };

  if (variant === "sidebar") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLaunch}
        disabled={isRunning}
        className={cn(
          "w-full justify-start gap-2.5 text-xs font-semibold border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 hover:text-cyan-300 transition-all shadow-sm",
          className
        )}
      >
        <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 animate-pulse" />
        <span className="truncate">{lang === "bn" ? "প্রোডাক্ট ট্যুর" : "Product Tour"}</span>
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLaunch}
        disabled={isRunning}
        className={cn(
          "gap-1.5 text-xs font-bold border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-all",
          className
        )}
      >
        <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
        <span>{lang === "bn" ? "ট্যুর শুরু করুন" : "Take a Tour"}</span>
      </Button>
    );
  }

  // Default: Topbar button
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLaunch}
      disabled={isRunning}
      className={cn(
        "h-8 px-3 gap-1.5 text-xs font-bold border-cyan-500/40 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 hover:text-cyan-300 transition-all rounded-lg shadow-sm",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 animate-pulse" />
      <span>{lang === "bn" ? "প্রোডাক্ট ট্যুর" : "Product Tour"}</span>
    </Button>
  );
}
