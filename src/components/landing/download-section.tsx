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
  const [releaseInfo, setReleaseInfo] = useState<{
    version: string;
    windowsUrl: string;
    macUrl: string;
    winSizeMb: number;
    macSizeMb: number;
  }>({
    version: "2.1.2",
    windowsUrl:
      process.env.NEXT_PUBLIC_DESKTOP_WIN_URL ||
      "https://github.com/AsifZaman777/datakarkhana-desktop/releases/download/v2.1.2/DataKarkhana-Desktop-Setup-2.1.2.exe",
    macUrl:
      process.env.NEXT_PUBLIC_DESKTOP_MAC_URL ||
      "https://github.com/AsifZaman777/datakarkhana-desktop/releases/download/v2.1.2/DataKarkhana-Desktop-2.1.2-arm64.dmg",
    winSizeMb: 185,
    macSizeMb: 196,
  });
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

    // Auto-fetch latest release details from GitHub via cached Next.js route
    fetch("/api/desktop-release")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.version) {
          setReleaseInfo((prev) => ({
            version: data.version,
            windowsUrl:
              process.env.NEXT_PUBLIC_DESKTOP_WIN_URL ||
              data.windows?.url ||
              prev.windowsUrl,
            macUrl:
              process.env.NEXT_PUBLIC_DESKTOP_MAC_URL ||
              data.mac?.url ||
              prev.macUrl,
            winSizeMb: data.windows?.sizeMb || prev.winSizeMb,
            macSizeMb: data.mac?.sizeMb || prev.macSizeMb,
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not auto-fetch desktop release, using defaults:", err);
      });
  }, []);

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
            <span>
              {lang === "bn"
                ? `ডেস্কটপ অ্যাপ্লিকেশন • স্বতন্ত্র v${releaseInfo.version}`
                : `DESKTOP APPLICATION • STANDALONE V${releaseInfo.version}`}
            </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Windows Card */}
          <div
            className={`relative rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
              detectedOs === "windows"
                ? "border-primary/60 bg-card shadow-xl shadow-primary/10 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/50 shadow-sm hover:shadow-md"
            }`}
          >
            {detectedOs === "windows" && (
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dt.winCardRec || "Recommended for your PC"}
              </div>
            )}

            <div className="space-y-4">
              {/* Header with Icon */}
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                  <Monitor className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">{dt.winCardTitle || "Windows PC"}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{dt.winCardSub || "Windows 10 / 11 (64-bit)"}</p>
                </div>
              </div>

              <div className="space-y-2.5 py-2 border-y border-border/40 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.winF1 || "Includes Desktop App Icon & Start Menu shortcut"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.winF2 || "Built-in standard uninstaller (Windows Settings ➔ Apps)"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.winF3 || "Zero Command Prompt / CMD terminal popups"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.winF4 || "100% standalone binary installer (.exe)"}</span>
                </div>
              </div>

              {/* Specs pill */}
              <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground bg-muted/60 p-2 rounded-lg border border-border/60">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5 text-primary" />{" "}
                  {lang === "bn" ? `আকার: ~${releaseInfo.winSizeMb} মেগাবাইট` : `Size: ~${releaseInfo.winSizeMb} MB`}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-primary" /> {dt.winArch || "x64 Architecture"}
                </span>
              </div>
            </div>

            <div className="pt-5 mt-auto">
              <a href={releaseInfo.windowsUrl} download className="block">
                <Button size="lg" className="w-full gap-2 font-bold py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25">
                  <Download className="h-5 w-5" />
                  {dt.winBtn || "Download for Windows (.exe)"}
                </Button>
              </a>
              <p className="text-[11px] text-center text-muted-foreground/80 mt-1.5 font-mono">
                {lang === "bn"
                  ? `সংস্করণ ${releaseInfo.version} • উইন্ডোজ ১০ ও ১১ (৬৪-বিট)`
                  : `Version ${releaseInfo.version} • Windows 10 & 11 (64-bit)`}
              </p>
            </div>
          </div>

          {/* macOS Card */}
          <div
            className={`relative rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
              detectedOs === "mac"
                ? "border-primary/60 bg-card shadow-xl shadow-primary/10 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/50 shadow-sm hover:shadow-md"
            }`}
          >
            {detectedOs === "mac" && (
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dt.macCardRec || "Recommended for your Mac"}
              </div>
            )}

            <div className="space-y-4">
              {/* Header with Icon */}
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-zinc-500/10 border border-zinc-500/30 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-inner">
                  <Apple className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">{dt.macCardTitle || "Apple macOS"}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{dt.macCardSub || "macOS 11.0+ (Apple Silicon & Intel)"}</p>
                </div>
              </div>

              <div className="space-y-2.5 py-2 border-y border-border/40 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.macF1 || "Native .app bundle with custom 3D Cyber Icon"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.macF2 || "Drag & Drop installation into Applications folder"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.macF3 || "Zero Terminal windows open during app execution"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-foreground/90">{dt.macF4 || "Simple uninstall by dragging to macOS Trash"}</span>
                </div>
              </div>

              {/* Specs pill */}
              <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground bg-muted/60 p-2 rounded-lg border border-border/60">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5 text-primary" />{" "}
                  {lang === "bn" ? `আকার: ~${releaseInfo.macSizeMb} মেগাবাইট` : `Size: ~${releaseInfo.macSizeMb} MB`}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-primary" /> {dt.macFormat || "Format: .dmg Disk Image"}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-5 mt-auto">
              <a href={releaseInfo.macUrl} download className="block">
                <Button
                  size="lg"
                  className={`w-full gap-2 font-bold py-2.5 shadow-md transition-all ${
                    detectedOs === "mac"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
                      : "bg-muted hover:bg-accent text-foreground"
                  }`}
                >
                  <Download className="h-5 w-5" />
                  {dt.macBtn || "Download for Mac (.dmg)"}
                </Button>
              </a>
              <p className="text-[11px] text-center text-muted-foreground/80 mt-1.5 font-mono">
                {lang === "bn"
                  ? `সংস্করণ ${releaseInfo.version} • macOS ১১.০+ (অ্যাপল সিলিকন ও ইন্টেল)`
                  : `Version ${releaseInfo.version} • macOS 11.0+ (Apple Silicon & Intel)`}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="mt-12 rounded-xl bg-card/40 border border-border/50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
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
