"use client";

import { useState, useEffect } from "react";
import { Download, Monitor, Apple, ShieldCheck, Cpu, HardDrive, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiBase } from "@/lib/constants";
import { useLanguage } from "@/providers/language-provider";

export function DownloadSection() {
  const { t, lang } = useLanguage();
  const dt = t.download || {};
  const [detectedOs, setDetectedOs] = useState<"windows" | "mac" | "other">("windows");
  const apiBase = getApiBase();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("mac") || ua.includes("darwin")) {
        setDetectedOs("mac");
      } else if (ua.includes("win")) {
        setDetectedOs("windows");
      }
    }
  }, []);

  const windowsDownloadUrl =
    process.env.NEXT_PUBLIC_DESKTOP_WIN_URL ||
    `${apiBase}/api/download/desktop?os=windows`;

  const macDownloadUrl =
    process.env.NEXT_PUBLIC_DESKTOP_MAC_URL ||
    `${apiBase}/api/download/desktop?os=mac`;

  return (
    <section id="download" className="relative py-20 lg:py-28 overflow-hidden bg-background border-t border-border/40">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>{dt.badge || "DESKTOP APPLICATION • STANDALONE V2.0"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            {dt.title || "Download Desktop Version for "}{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-primary to-blue-500 bg-clip-text text-transparent">
              {dt.titleHighlight || (lang === "bn" ? "আপনার পিসি ও ম্যাকের জন্য" : "Your PC & Mac")}
            </span>
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {dt.subtitle ||
              "Run automated B2B lead scraping and search intelligence directly on your local computer. Zero cloud or proxy costs, complete data privacy, and 1-click desktop launch."}
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Windows Card */}
          <div
            className={`relative rounded-2xl border p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
              detectedOs === "windows"
                ? "border-primary/60 bg-card/80 shadow-2xl shadow-primary/15 ring-1 ring-primary/40"
                : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60 shadow-lg"
            }`}
          >
            {detectedOs === "windows" && (
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dt.winCardRec || "Recommended for your PC"}
              </div>
            )}

            <div className="space-y-6">
              {/* Header with Icon */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                  <Monitor className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{dt.winCardTitle || "Windows PC"}</h3>
                  <p className="text-xs text-muted-foreground">{dt.winCardSub || "Windows 10 / 11 (64-bit)"}</p>
                </div>
              </div>

              <div className="space-y-3 py-2 border-y border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.winF1 || "Includes Desktop App Icon & Start Menu shortcut"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.winF2 || "Built-in standard uninstaller (Windows Settings ➔ Apps)"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.winF3 || "Zero Command Prompt / CMD terminal popups"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.winF4 || "100% standalone binary installer (.exe)"}</span>
                </div>
              </div>

              {/* Specs pill */}
              <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5 text-primary" /> {dt.winSize || "Size: ~185 MB"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-primary" /> {dt.winFormat || "Format: .exe (NSIS)"}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-6 mt-6">
              <a href={windowsDownloadUrl} download className="block">
                <Button
                  size="lg"
                  className={`w-full gap-2.5 font-bold h-12 text-sm shadow-md transition-all ${
                    detectedOs === "windows"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
                      : "bg-muted hover:bg-accent text-foreground"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  {dt.winBtn || "Download for Windows (.exe)"}
                </Button>
              </a>
              <p className="text-[11px] text-center text-muted-foreground mt-2">
                {dt.winNote || "Double-click installer to set up desktop icon automatically"}
              </p>
            </div>
          </div>

          {/* Mac Card */}
          <div
            className={`relative rounded-2xl border p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
              detectedOs === "mac"
                ? "border-primary/60 bg-card/80 shadow-2xl shadow-primary/15 ring-1 ring-primary/40"
                : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60 shadow-lg"
            }`}
          >
            {detectedOs === "mac" && (
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dt.macCardRec || "Recommended for your Mac"}
              </div>
            )}

            <div className="space-y-6">
              {/* Header with Icon */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-zinc-500/10 border border-zinc-500/30 flex items-center justify-center text-zinc-200 shadow-inner">
                  <Apple className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{dt.macCardTitle || "Apple macOS"}</h3>
                  <p className="text-xs text-muted-foreground">{dt.macCardSub || "macOS 11.0+ (Apple Silicon & Intel)"}</p>
                </div>
              </div>

              <div className="space-y-3 py-2 border-y border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.macF1 || "Native .app bundle with custom 3D Cyber Icon"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.macF2 || "Drag & Drop installation into Applications folder"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.macF3 || "Zero Terminal windows open during app execution"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{dt.macF4 || "Simple uninstall by dragging to macOS Trash"}</span>
                </div>
              </div>

              {/* Specs pill */}
              <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5 text-primary" /> {dt.macSize || "Size: ~196 MB"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-primary" /> {dt.macFormat || "Format: .dmg Disk Image"}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-6 mt-6">
              <a href={macDownloadUrl} download className="block">
                <Button
                  size="lg"
                  className={`w-full gap-2.5 font-bold h-12 text-sm shadow-md transition-all ${
                    detectedOs === "mac"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
                      : "bg-muted hover:bg-accent text-foreground"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  {dt.macBtn || "Download for Mac (.dmg)"}
                </Button>
              </a>
              <p className="text-[11px] text-center text-muted-foreground mt-2">
                {dt.macNote || "Mount DMG and drag to Applications for 1-click launch"}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="mt-12 rounded-xl bg-card/40 border border-border/50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{dt.secTitle || "Zero Code Exposure & Tamper-Proof Cryptography"}</p>
              <p className="text-[11px]">{dt.secDesc || "Clean binary distributions without exposed scripts, database credentials, or secret keys."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-primary">
            <span>{dt.secLicense || "Requires Production License Key to Activate"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </section>
  );
}
