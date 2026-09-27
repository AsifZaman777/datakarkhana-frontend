"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Shield,
  MessageSquarePlus,
  Search,
  Timer,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Info,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Clock,
  Ban,
  Cpu,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import { useLocalModels } from "@/providers/local-models-provider";
import { modelsApi } from "@/lib/api/models";
import {
  scanForSpamKeywords,
  getSpamScore,
  type SpamKeyword,
} from "@/data/spam-keywords";

// ── Types ──

export interface BanProtectionConfig {
  /** Multiple message variants for random selection */
  messageVariants: string[];
  /** Per-message delay range (seconds) */
  delayMin: number;
  delayMax: number;
  /** Break config: after N messages, take a break */
  breakAfterMessages: number;
  /** Break duration in seconds */
  breakDuration: number;
  /** User has acknowledged TOC */
  tocAccepted: boolean;
  /** Spam score for each variant */
  spamScores: number[];
}

interface BanProtectionWizardProps {
  open: boolean;
  onClose: () => void;
  /** Called when all 4 steps pass and user proceeds */
  onComplete: (config: BanProtectionConfig) => void;
  /** The base template text from the campaign panel */
  baseTemplate: string;
  /** Company name for template substitution preview */
  companyName?: string;
}

// ── Step definitions ──

const STEPS = [
  {
    id: "messages",
    icon: MessageSquarePlus,
    en: "Message Variants",
    bn: "মেসেজ ভেরিয়েন্ট",
  },
  {
    id: "spam",
    icon: Search,
    en: "Spam Keyword Scan",
    bn: "স্প্যাম কীওয়ার্ড স্ক্যান",
  },
  {
    id: "timing",
    icon: Timer,
    en: "Delay & Break Config",
    bn: "বিলম্ব ও ব্রেক কনফিগ",
  },
  {
    id: "toc",
    icon: FileCheck,
    en: "Terms & Disclaimer",
    bn: "শর্তাবলী ও দায়মুক্তি",
  },
];

export function BanProtectionWizard({
  open,
  onClose,
  onComplete,
  baseTemplate,
  companyName = "",
}: BanProtectionWizardProps) {
  const { lang } = useLanguage();
  const { openModelHub, installedModels, activeModel } = useLocalModels();
  const [currentStep, setCurrentStep] = useState(0);

  // ── Local AI Action States ──
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isAuditingAi, setIsAuditingAi] = useState(false);

  // ── Step 1: Message Variants ──
  const [variants, setVariants] = useState<string[]>([baseTemplate]);

  // Reset variants when base template changes
  useEffect(() => {
    if (baseTemplate && open) {
      setVariants((prev) => {
        if (prev.length === 0 || (prev.length === 1 && !prev[0].trim())) {
          return [baseTemplate];
        }
        return prev;
      });
    }
  }, [baseTemplate, open]);

  // ── Step 2: Spam scan results (computed) ──
  const spamResults = useMemo(() => {
    return variants.map((v) => ({
      matches: scanForSpamKeywords(v),
      score: getSpamScore(v),
    }));
  }, [variants]);

  // ── Step 3: Timing Config ──
  const [delayMin, setDelayMin] = useState(10);
  const [delayMax, setDelayMax] = useState(30);
  const [breakAfterMessages, setBreakAfterMessages] = useState(10);
  const [breakDuration, setBreakDuration] = useState(120);

  // ── Step 4: TOC ──
  const [tocAccepted, setTocAccepted] = useState(false);

  // ── Handlers ──

  const handleAiGenerateVariants = async () => {
    const baseText = variants[0] || baseTemplate;
    if (!baseText.trim()) {
      toast.error(lang === "bn" ? "প্রথমে একটি মূল মেসেজ লিখুন" : "Please enter a base message first");
      return;
    }

    try {
      setIsGeneratingAi(true);
      const res = await modelsApi.generateVariants(baseText, 3, lang, activeModel?.filename);
      if (res.variants && res.variants.length > 0) {
        setVariants(res.variants);
        toast.success(
          lang === "bn"
            ? `✨ ${res.model_used} দিয়ে ৩টি ভেরিয়েন্ট সফলভাবে তৈরি করা হয়েছে (${res.latency_ms}ms)!`
            : `✨ Generated 3 variations via ${res.model_used} (${res.latency_ms}ms)!`
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "AI generation failed");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAiAuditAndFix = async () => {
    try {
      setIsAuditingAi(true);
      let fixedCount = 0;
      const updated = await Promise.all(
        variants.map(async (v) => {
          const score = getSpamScore(v);
          if (score > 0) {
            const res = await modelsApi.auditSpam(v, lang, activeModel?.filename);
            if (res.suggested_rewrite && res.suggested_rewrite !== v) {
              fixedCount++;
              return res.suggested_rewrite;
            }
          }
          return v;
        })
      );

      if (fixedCount > 0) {
        setVariants(updated);
        toast.success(
          lang === "bn"
            ? `🤖 ${fixedCount}টি ভেরিয়েন্ট থেকে স্প্যাম শব্দ সরিয়ে প্রাকৃতিক করা হয়েছে!`
            : `🤖 Cleaned promotional spam keywords across ${fixedCount} variant(s)!`
        );
      } else {
        toast.info(
          lang === "bn"
            ? "সবগুলো মেসেজ ইতোমধ্যে নিরাপদ অবস্থায় আছে।"
            : "All message variants are already safe."
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "AI Spam audit failed");
    } finally {
      setIsAuditingAi(false);
    }
  };

  const addVariant = useCallback(() => {
    if (variants.length >= 6) {
      toast.warning(
        lang === "bn"
          ? "সর্বোচ্চ ৬টি মেসেজ ভেরিয়েন্ট যুক্ত করা যায়"
          : "Maximum 6 message variants allowed"
      );
      return;
    }
    setVariants((prev) => [...prev, ""]);
  }, [variants.length, lang]);

  const removeVariant = useCallback(
    (idx: number) => {
      if (variants.length <= 1) {
        toast.warning(
          lang === "bn"
            ? "কমপক্ষে ১টি মেসেজ ভেরিয়েন্ট থাকতে হবে"
            : "At least 1 message variant required"
        );
        return;
      }
      setVariants((prev) => prev.filter((_, i) => i !== idx));
    },
    [variants.length, lang]
  );

  const updateVariant = useCallback((idx: number, text: string) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[idx] = text;
      return updated;
    });
  }, []);

  const duplicateVariant = useCallback(
    (idx: number) => {
      if (variants.length >= 6) {
        toast.warning(
          lang === "bn"
            ? "সর্বোচ্চ ৬টি ভেরিয়েন্ট"
            : "Max 6 variants"
        );
        return;
      }
      setVariants((prev) => {
        const copy = [...prev];
        copy.splice(idx + 1, 0, prev[idx]);
        return copy;
      });
    },
    [variants.length, lang]
  );

  // ── Step Validation ──

  const isStepValid = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0: // Messages – at least 1 non-empty variant
          return variants.filter((v) => v.trim().length > 10).length >= 1;
        case 1: // Spam scan – must have 0 high-severity matches
          return !spamResults.some((r) =>
            r.matches.some((m) => m.severity === "high")
          );
        case 2: // Timing
          return delayMin >= 5 && delayMax >= delayMin && breakAfterMessages >= 5 && breakDuration >= 30;
        case 3: // TOC
          return tocAccepted;
        default:
          return false;
      }
    },
    [variants, spamResults, delayMin, delayMax, breakAfterMessages, breakDuration, tocAccepted]
  );

  const canProceedToNext = isStepValid(currentStep);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step – submit
      onComplete({
        messageVariants: variants.filter((v) => v.trim().length > 0),
        delayMin,
        delayMax,
        breakAfterMessages,
        breakDuration,
        tocAccepted,
        spamScores: spamResults.map((r) => r.score),
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  // ── Severity Color Helpers ──

  const severityColor = (s: string) => {
    if (s === "high") return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    if (s === "medium")
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-sky-400 bg-sky-500/10 border-sky-500/30";
  };

  const scoreColor = (score: number) => {
    if (score >= 60) return "text-rose-400";
    if (score >= 30) return "text-amber-400";
    return "text-emerald-400";
  };

  const scoreLabel = (score: number) => {
    if (score >= 60)
      return lang === "bn" ? "⚠️ উচ্চ ঝুঁকি" : "⚠️ High Risk";
    if (score >= 30)
      return lang === "bn" ? "⚡ মাঝারি ঝুঁকি" : "⚡ Medium Risk";
    return lang === "bn" ? "✅ নিরাপদ" : "✅ Safe";
  };

  // ── Render ──

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[90vw] max-w-[960px] sm:max-w-[960px] h-[82vh] max-h-[84vh] overflow-hidden p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 flex flex-col shadow-2xl"
        style={{
          width: "90vw",
          maxWidth: "960px",
          height: "82vh",
          maxHeight: "84vh",
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-3.5 border-b border-border/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500/20 via-amber-500/10 to-emerald-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-rose-400" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                {lang === "bn"
                  ? "🛡️ ব্যান প্রটেকশন উইজার্ড"
                  : "🛡️ Ban Protection Wizard"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-normal">
                {lang === "bn"
                  ? "ক্যাম্পেইন শুরুর আগে ৪-স্তরের নিরাপত্তা যাচাই সম্পন্ন করুন"
                  : "Complete the 4-layer security check before launching your campaign"}
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openModelHub}
            className="h-7 text-xs font-semibold border-purple-500/30 text-purple-300 hover:bg-purple-500/10 gap-1.5 shrink-0 hidden sm:flex"
            title={lang === "bn" ? "লোকাল এআই মডেল হাব" : "Local AI Model Hub"}
          >
            <Cpu className="h-3 w-3 text-purple-400" />
            <span>
              {activeModel ? activeModel.name.split(" ")[0] : (lang === "bn" ? "এআই মডেল" : "Local AI")}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </Button>
        </DialogHeader>

        {/* Step Bar */}
        <div className="px-6 py-2 border-b border-border/20 bg-card/30">
          <div className="flex items-center gap-1.5">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isDone = idx < currentStep;
              const stepValid = isStepValid(idx);

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => idx <= currentStep && setCurrentStep(idx)}
                    disabled={idx > currentStep}
                    className={`
                      flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all w-full
                      ${isActive
                        ? "bg-primary/15 text-primary border border-primary/30 shadow-xs font-semibold"
                        : isDone && stepValid
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer font-medium"
                        : isDone && !stepValid
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-pointer font-medium"
                        : "text-muted-foreground border border-transparent hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                      }
                    `}
                  >
                    <div className="relative">
                      <StepIcon className="h-3.5 w-3.5 shrink-0" />
                      {isDone && stepValid && (
                        <Check className="absolute -top-1 -right-1 h-2.5 w-2.5 text-emerald-400" />
                      )}
                      {isDone && !stepValid && (
                        <XCircle className="absolute -top-1 -right-1 h-2.5 w-2.5 text-rose-400" />
                      )}
                    </div>
                    <span className="hidden sm:inline truncate text-xs">
                      {lang === "bn" ? step.bn : step.en}
                    </span>
                    <span className="sm:hidden font-bold">{idx + 1}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0 mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          {/* ═══ STEP 1: Message Variants ═══ */}
          {currentStep === 0 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquarePlus className="h-4 w-4 text-primary" />
                    {lang === "bn"
                      ? "মেসেজ ভেরিয়েন্ট তৈরি করুন"
                      : "Create Message Variants"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {lang === "bn"
                      ? "একই মেসেজ সবাইকে পাঠালে ব্যান ঝুঁকি বাড়ে। ৩-৪টি ভেরিয়েন্ট তৈরি করুন — সেলেনিয়াম এলোমেলোভাবে বাছাই করবে।"
                      : "Sending identical messages to everyone increases ban risk. Create 3-4 variants — Selenium picks randomly per contact."}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAiGenerateVariants}
                    disabled={isGeneratingAi}
                    className="gap-1.5 text-xs font-semibold border-purple-500/40 text-purple-300 hover:bg-purple-500/10 h-7 px-2.5"
                  >
                    {isGeneratingAi ? (
                      <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-purple-400" />
                    )}
                    <span>{lang === "bn" ? "✨ এআই ভেরিয়েন্ট" : "✨ AI Generate"}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addVariant}
                    className="gap-1.5 text-xs font-medium border-primary/40 text-primary hover:bg-primary/10 h-7 px-2.5 shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                    {lang === "bn" ? "ভেরিয়েন্ট যুক্ত করুন" : "Add Variant"}
                  </Button>
                </div>
              </div>

              {/* Recommendation Badge */}
              {variants.length < 3 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-normal">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  {lang === "bn"
                    ? `আপনার ${variants.length}টি ভেরিয়েন্ট আছে। ব্যান সুরক্ষার জন্য কমপক্ষে ৩টি সুপারিশ করা হয়।`
                    : `You have ${variants.length} variant(s). At least 3 recommended for ban protection.`}
                </div>
              )}

              {/* Variant Editors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {variants.map((text, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/30 bg-card/40 p-3 space-y-2 hover:border-border/50 transition-all flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium border-primary/30 text-primary px-1.5 py-0.5"
                      >
                        {lang === "bn"
                          ? `ভেরিয়েন্ট #${idx + 1}`
                          : `Variant #${idx + 1}`}
                      </Badge>
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => duplicateVariant(idx)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title={lang === "bn" ? "ডুপ্লিকেট" : "Duplicate"}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeVariant(idx)}
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          title={lang === "bn" ? "মুছুন" : "Delete"}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => updateVariant(idx, e.target.value)}
                      rows={4}
                      placeholder={
                        lang === "bn"
                          ? "এখানে মেসেজ টেমপ্লেট লিখুন... ({name} দিয়ে নাম পার্সোনালাইজ করুন)"
                          : "Write your message template here... (use {name} for personalization)"
                      }
                      className="w-full rounded-lg border border-input bg-black/25 px-2.5 py-2 text-xs font-sans text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-y leading-relaxed flex-1 min-h-[90px]"
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span>
                        {text.length}{" "}
                        {lang === "bn" ? "অক্ষর" : "chars"}
                      </span>
                      <span
                        className={`font-medium ${
                          getSpamScore(text) >= 30
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {lang === "bn" ? "স্প্যাম স্কোর:" : "Spam Score:"}{" "}
                        {getSpamScore(text)}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Spam Keyword Scan ═══ */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                    <Search className="h-4 w-4 text-amber-500" />
                    {lang === "bn"
                      ? "স্প্যাম কীওয়ার্ড স্ক্যান রিপোর্ট"
                      : "Spam Keyword Scan Report"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {lang === "bn"
                      ? "আপনার প্রতিটি মেসেজ ভেরিয়েন্ট WhatsApp-এর অ্যান্টি-স্প্যাম ফিল্টারের বিরুদ্ধে স্ক্যান করা হয়েছে। উচ্চ ঝুঁকির কীওয়ার্ডগুলো সরাতে হবে।"
                      : "Each message variant has been scanned against WhatsApp's anti-spam filters. High-severity keywords must be removed to proceed."}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAiAuditAndFix}
                  disabled={isAuditingAi}
                  className="gap-1.5 text-xs font-semibold border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 h-7 px-2.5 shrink-0"
                >
                  {isAuditingAi ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                  ) : (
                    <Zap className="h-3 w-3 text-cyan-400" />
                  )}
                  <span>{lang === "bn" ? "🤖 এআই অটো-ফিক্স" : "🤖 AI Auto-Fix"}</span>
                </Button>
              </div>

              {/* Overall summary */}
              {(() => {
                const totalHigh = spamResults.reduce(
                  (acc, r) =>
                    acc + r.matches.filter((m) => m.severity === "high").length,
                  0
                );
                const totalMed = spamResults.reduce(
                  (acc, r) =>
                    acc +
                    r.matches.filter((m) => m.severity === "medium").length,
                  0
                );
                const avgScore =
                  spamResults.length > 0
                    ? Math.round(
                        spamResults.reduce((a, r) => a + r.score, 0) /
                          spamResults.length
                      )
                    : 0;

                return (
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-border/30 bg-card/40 p-2.5 text-center">
                      <div className={`text-lg font-bold ${scoreColor(avgScore)}`}>
                        {avgScore}/100
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {lang === "bn" ? "গড় স্প্যাম স্কোর" : "Avg Spam Score"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 text-center">
                      <div className="text-lg font-bold text-rose-400">
                        {totalHigh}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {lang === "bn" ? "উচ্চ ঝুঁকি" : "High Risk"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-center">
                      <div className="text-lg font-bold text-amber-400">
                        {totalMed}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {lang === "bn" ? "মাঝারি ঝুঁকি" : "Medium Risk"}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Per-variant results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {variants.map((text, idx) => {
                  const { matches, score } = spamResults[idx] || {
                    matches: [],
                    score: 0,
                  };
                  const highMatches = matches.filter(
                    (m) => m.severity === "high"
                  );
                  const medMatches = matches.filter(
                    (m) => m.severity === "medium"
                  );
                  const lowMatches = matches.filter(
                    (m) => m.severity === "low"
                  );

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 space-y-2 ${
                        highMatches.length > 0
                          ? "border-rose-500/30 bg-rose-500/5"
                          : score >= 30
                          ? "border-amber-500/20 bg-amber-500/5"
                          : "border-emerald-500/20 bg-emerald-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium px-1.5 py-0.5"
                        >
                          {lang === "bn"
                            ? `ভেরিয়েন্ট #${idx + 1}`
                            : `Variant #${idx + 1}`}
                        </Badge>
                        <span
                          className={`text-xs font-semibold ${scoreColor(score)}`}
                        >
                          {scoreLabel(score)} ({score}/100)
                        </span>
                      </div>

                      {matches.length === 0 ? (
                        <div className="text-xs text-emerald-400 flex items-center gap-1.5 py-1 font-medium">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {lang === "bn"
                            ? "কোনো স্প্যাম কীওয়ার্ড পাওয়া যায়নি! এই মেসেজ নিরাপদ।"
                            : "No spam keywords detected! This message is safe."}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {[...highMatches, ...medMatches, ...lowMatches].map(
                            (m, mIdx) => (
                              <span
                                key={mIdx}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium border ${severityColor(
                                  m.severity
                                )}`}
                              >
                                {m.severity === "high" && (
                                  <XCircle className="h-2.5 w-2.5 shrink-0" />
                                )}
                                {m.severity === "medium" && (
                                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                )}
                                &quot;{m.word}&quot;
                                <span className="opacity-70 text-[9px]">
                                  ({m.category})
                                </span>
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* High severity blocker warning */}
              {spamResults.some((r) =>
                r.matches.some((m) => m.severity === "high")
              ) && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                  <Ban className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <strong className="text-xs font-semibold text-rose-200">
                      {lang === "bn"
                        ? "ব্লকার: উচ্চ ঝুঁকির কীওয়ার্ড পাওয়া গেছে!"
                        : "Blocker: High-risk keywords detected!"}
                    </strong>
                    <br />
                    <span className="text-[11px]">
                      {lang === "bn"
                        ? "পরবর্তী ধাপে যেতে হলে সমস্ত উচ্চ ঝুঁকির কীওয়ার্ড (লাল) মুছে ফেলুন। পূর্ববর্তী ধাপে গিয়ে মেসেজ সম্পাদনা করুন।"
                        : "Remove all high-severity keywords (red) to proceed. Go back to Step 1 to edit your messages."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 3: Delay & Break Config ═══ */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                  <Timer className="h-4 w-4 text-cyan-400" />
                  {lang === "bn"
                    ? "বিলম্ব ও ব্রেক কনফিগারেশন"
                    : "Delay & Break Configuration"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {lang === "bn"
                    ? "প্রতিটি মেসেজের মাঝে অসম বিলম্ব এবং নির্দিষ্ট সংখ্যক মেসেজ পর ব্রেক নিন। এটি মানুষের আচরণ অনুকরণ করে।"
                    : "Set uneven delays between messages and breaks after N messages. This mimics human behavior to avoid detection."}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Per-message delay */}
                <Card className="border-border/30 bg-card/40 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <Label className="text-xs font-semibold text-foreground">
                      {lang === "bn"
                        ? "প্রতিটি মেসেজের মাঝে বিলম্ব (সেকেন্ড)"
                        : "Delay Between Messages (seconds)"}
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-normal text-muted-foreground">
                        {lang === "bn" ? "সর্বনিম্ন বিলম্ব" : "Minimum Delay"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[delayMin]}
                          onValueChange={(val) => {
                            const v = Array.isArray(val) ? val[0] : val;
                            setDelayMin(v);
                            if (v > delayMax) setDelayMax(v);
                          }}
                          min={5}
                          max={120}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono font-semibold text-cyan-400 w-10 text-right">
                          {delayMin}s
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-normal text-muted-foreground">
                        {lang === "bn" ? "সর্বোচ্চ বিলম্ব" : "Maximum Delay"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[delayMax]}
                          onValueChange={(val) => {
                            const v = Array.isArray(val) ? val[0] : val;
                            setDelayMax(v);
                            if (v < delayMin) setDelayMin(v);
                          }}
                          min={5}
                          max={180}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono font-semibold text-cyan-400 w-10 text-right">
                          {delayMax}s
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    💡{" "}
                    {lang === "bn"
                      ? `প্রতিটি মেসেজের মাঝে ${delayMin}–${delayMax} সেকেন্ড এলোমেলো বিলম্ব হবে (অসম প্যাটার্ন)।`
                      : `Each message will have a random delay of ${delayMin}–${delayMax}s (uneven pattern).`}
                  </p>
                </Card>

                {/* Break config */}
                <Card className="border-border/30 bg-card/40 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                    <Label className="text-xs font-semibold text-foreground">
                      {lang === "bn"
                        ? "ব্রেক কনফিগারেশন"
                        : "Break Configuration"}
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-normal text-muted-foreground">
                        {lang === "bn"
                          ? "কতটি মেসেজ পর ব্রেক"
                          : "Break After N Messages"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[breakAfterMessages]}
                          onValueChange={(val) => setBreakAfterMessages(Array.isArray(val) ? val[0] : val)}
                          min={5}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono font-semibold text-emerald-400 w-10 text-right">
                          {breakAfterMessages}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-normal text-muted-foreground">
                        {lang === "bn"
                          ? "ব্রেকের সময়কাল (সেকেন্ড)"
                          : "Break Duration (seconds)"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[breakDuration]}
                          onValueChange={(val) => setBreakDuration(Array.isArray(val) ? val[0] : val)}
                          min={30}
                          max={600}
                          step={30}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono font-semibold text-emerald-400 w-10 text-right">
                          {breakDuration}s
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    💡{" "}
                    {lang === "bn"
                      ? `প্রতি ${breakAfterMessages}টি মেসেজ পাঠানোর পর ${breakDuration} সেকেন্ড (${Math.round(breakDuration / 60)} মিনিট) ব্রেক নেওয়া হবে।`
                      : `After every ${breakAfterMessages} messages, a ${breakDuration}s (${Math.round(breakDuration / 60)} min) break will be taken.`}
                  </p>
                </Card>
              </div>

              {/* Layer 4 Additional: User-Agent Randomization */}
              <Card className="border-border/30 bg-card/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <Label className="text-xs font-semibold text-foreground">
                    {lang === "bn"
                      ? "অতিরিক্ত সুরক্ষা স্তর (স্বয়ংক্রিয়)"
                      : "Additional Protection Layers (Automatic)"}
                  </Label>
                </div>
                <ul className="text-xs text-foreground/80 space-y-1.5 ml-0.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      {lang === "bn"
                        ? "প্রতিটি মেসেজে {name} দিয়ে স্বয়ংক্রিয় ব্যক্তিগতকরণ"
                        : "Auto-personalization with {name} per message"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      {lang === "bn"
                        ? "অবৈধ নম্বর শনাক্ত হলে স্বয়ংক্রিয়ভাবে এড়িয়ে যাওয়া"
                        : "Auto-skip invalid numbers with modal dismissal"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      {lang === "bn"
                        ? "হিউম্যান-লাইক টাইপিং সিমুলেশন (ক্যারেক্টার বাই ক্যারেক্টার)"
                        : "Human-like typing simulation (character by character)"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      {lang === "bn"
                        ? "স্বয়ংক্রিয় স্ক্রিনশট সেভ করে লাইভ ট্র্যাকিং"
                        : "Auto-screenshot capture for live tracking"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      {lang === "bn"
                        ? "ক্যাম্পেইন যেকোনো সময় বন্ধ করা যায় (ইমিডিয়েট স্টপ)"
                        : "Campaign can be stopped anytime (immediate stop)"}
                    </span>
                  </li>
                </ul>
              </Card>
            </div>
          )}

          {/* ═══ STEP 4: Terms & Conditions / Disclaimer ═══ */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-amber-500" />
                  {lang === "bn"
                    ? "শর্তাবলী ও দায়মুক্তি বিজ্ঞপ্তি"
                    : "Terms of Use & Disclaimer Notice"}
                </h3>
              </div>

              <div className="rounded-xl border border-border/30 bg-card/30 p-3.5 overflow-y-auto max-h-[42vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* English Version */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                      Terms of Use & Disclaimer (English)
                    </h4>
                    <div className="text-muted-foreground space-y-1.5 text-[11px] leading-relaxed">
                      <p>
                        By proceeding with this WhatsApp campaign, you acknowledge and agree to the following terms:
                      </p>
                      <ol className="list-decimal ml-3.5 space-y-1">
                        <li>
                          <strong className="text-foreground font-semibold">User Responsibility:</strong> DataKarkhana provides this WhatsApp automation tool as a technology service only.
                          The message content, recipient selection, sending frequency, and all campaign configurations are <strong className="text-foreground">entirely decided and controlled by you (the user)</strong>.
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">Ban Risk Acknowledgement:</strong> WhatsApp may restrict, temporarily ban, or permanently ban accounts that violate their Terms of Service.
                          DataKarkhana has provided this multi-layer ban protection wizard to help minimize risk, but <strong className="text-foreground">no system can guarantee 100% ban prevention</strong>.
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">No Liability:</strong> DataKarkhana, its developers, owners, and affiliates shall <strong className="text-rose-300">NOT be held responsible or liable</strong> for any WhatsApp account ban, restriction, data loss, or any other consequence resulting from the use of this campaign tool.
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">Configurable Safety:</strong> You have been provided with configurable message variants, spam keyword scanning, delay controls, and break settings.
                          You are <strong className="text-foreground">fully responsible for configuring these settings appropriately</strong> based on your use case and risk tolerance.
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">Compliance:</strong> You confirm that you have the right to message the recipients in your contact list and that your messages comply with applicable laws, regulations, and WhatsApp&apos;s Terms of Service.
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">Indemnification:</strong> You agree to indemnify and hold harmless DataKarkhana from any claims, losses, or damages arising from your use of this tool.
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Bangla Version */}
                  <div className="space-y-2 lg:border-l lg:border-border/30 lg:pl-4 border-t lg:border-t-0 border-border/30 pt-3 lg:pt-0">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                      ব্যবহারের শর্তাবলী ও দায়মুক্তি বিজ্ঞপ্তি (বাংলা)
                    </h4>
                    <div className="text-muted-foreground space-y-1.5 text-[11px] leading-relaxed">
                      <p className="font-medium text-foreground/80">
                        এই হোয়াটসঅ্যাপ ক্যাম্পেইন চালানোর মাধ্যমে আপনি নিম্নলিখিত শর্তাবলীতে সম্মত হচ্ছেন:
                      </p>
                      <ol className="list-decimal ml-3.5 space-y-1">
                        <li>
                          <strong className="text-foreground font-semibold">ব্যবহারকারীর দায়িত্ব:</strong> DataKarkhana এই হোয়াটসঅ্যাপ অটোমেশন টুলটি শুধুমাত্র একটি প্রযুক্তি সেবা হিসেবে প্রদান করে।
                          মেসেজের বিষয়বস্তু, প্রাপক নির্বাচন, পাঠানোর ফ্রিকোয়েন্সি এবং সমস্ত ক্যাম্পেইন কনফিগারেশন <strong className="text-foreground">সম্পূর্ণরূপে আপনার (ব্যবহারকারী) দ্বারা নির্ধারিত ও নিয়ন্ত্রিত</strong>।
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">ব্যান ঝুঁকি স্বীকৃতি:</strong> হোয়াটসঅ্যাপ তাদের সেবার শর্ত লঙ্ঘনকারী অ্যাকাউন্টগুলিকে সীমাবদ্ধ, সাময়িকভাবে ব্যান বা স্থায়ীভাবে ব্যান করতে পারে।
                          DataKarkhana ঝুঁকি কমাতে এই মাল্টি-লেয়ার ব্যান প্রটেকশন উইজার্ড সরবরাহ করেছে, কিন্তু <strong className="text-foreground">কোনো সিস্টেম ১০০% ব্যান প্রতিরোধের গ্যারান্টি দিতে পারে না</strong>।
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">দায়মুক্তি:</strong> DataKarkhana, এর ডেভেলপার, মালিক এবং সংশ্লিষ্ট পক্ষ এই ক্যাম্পেইন টুল ব্যবহারের ফলে <strong className="text-rose-300">কোনো হোয়াটসঅ্যাপ অ্যাকাউন্ট ব্যান, সীমাবদ্ধতা, ডেটা ক্ষতি বা অন্য কোনো পরিণতির জন্য দায়ী থাকবে না</strong>।
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">কনফিগারযোগ্য নিরাপত্তা:</strong> আপনাকে কনফিগারযোগ্য মেসেজ ভেরিয়েন্ট, স্প্যাম কীওয়ার্ড স্ক্যানিং, বিলম্ব নিয়ন্ত্রণ এবং ব্রেক সেটিংস প্রদান করা হয়েছে।
                          আপনার ব্যবহারের ক্ষেত্র এবং ঝুঁকি সহনশীলতার ভিত্তিতে <strong className="text-foreground">এই সেটিংস যথাযথভাবে কনফিগার করার সম্পূর্ণ দায়িত্ব আপনার</strong>।
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">সম্মতি:</strong> আপনি নিশ্চিত করছেন যে আপনার যোগাযোগ তালিকার প্রাপকদের মেসেজ পাঠানোর অধিকার আপনার আছে এবং আপনার মেসেজগুলি প্রযোজ্য আইন, বিধিবিধান এবং হোয়াটসঅ্যাপের সেবার শর্তাবলী মেনে চলে।
                        </li>
                        <li>
                          <strong className="text-foreground font-semibold">ক্ষতিপূরণ:</strong> আপনি এই টুল ব্যবহার থেকে উদ্ভূত যেকোনো দাবি, ক্ষতি বা ক্ষয়ক্ষতি থেকে DataKarkhana-কে ক্ষতিমুক্ত রাখতে সম্মত হচ্ছেন।
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accept checkbox */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Checkbox
                  id="toc-accept"
                  checked={tocAccepted}
                  onCheckedChange={(c) => setTocAccepted(!!c)}
                  className="mt-0.5 h-4 w-4"
                />
                <label
                  htmlFor="toc-accept"
                  className="text-xs font-medium text-foreground cursor-pointer leading-snug"
                >
                  {lang === "bn"
                    ? "আমি উপরের সমস্ত শর্তাবলী পড়েছি এবং সম্মত হচ্ছি। আমি বুঝি যে ক্যাম্পেইন কনফিগারেশন সম্পূর্ণ আমার দায়িত্ব এবং কোনো ব্যান/সীমাবদ্ধতার জন্য DataKarkhana দায়ী নয়।"
                    : "I have read and agree to all the terms above. I understand that campaign configuration is entirely my responsibility and DataKarkhana is not liable for any bans or restrictions."}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-border/30 bg-card/40 flex items-center justify-between gap-3 shrink-0 mt-auto">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="gap-1.5 text-xs font-medium h-8 px-3"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {lang === "bn" ? "পূর্ববর্তী" : "Previous"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono font-medium">
              {lang === "bn"
                ? `ধাপ ${currentStep + 1} / ${STEPS.length}`
                : `Step ${currentStep + 1} of ${STEPS.length}`}
            </span>

            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                disabled={!canProceedToNext}
                className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 h-8 px-4"
              >
                {lang === "bn" ? "পরবর্তী" : "Next"}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                disabled={!canProceedToNext}
                className="gap-1.5 text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-600 disabled:opacity-40 h-8 px-4 shadow-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {lang === "bn"
                  ? "সুরক্ষিত ক্যাম্পেইন শুরু করুন"
                  : "Launch Protected Campaign"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
