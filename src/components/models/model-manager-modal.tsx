"use client";

import { useState } from "react";
import {
  Cpu,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Search,
  Check,
  X,
  RefreshCw,
  Folder,
  Zap,
  Play,
  Copy,
  Info,
  Layers,
  ArrowRight,
  Bot,
} from "lucide-react";
import { AiChatPanel } from "@/components/marketing/ai-chat-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/providers/language-provider";
import { useLocalModels } from "@/providers/local-models-provider";
import { modelsApi, type InspectHuggingFaceResult } from "@/lib/api/models";
import { toast } from "sonner";

export function ModelManagerModal() {
  const { lang } = useLanguage();
  const {
    installedModels,
    recommendedModels,
    activeModel,
    systemInfo,
    isLoading,
    isModelHubOpen,
    activeDownload,
    closeModelHub,
    refreshModels,
    startDownload,
    cancelDownload,
    deleteModel,
    setActiveModel,
  } = useLocalModels();

  const [activeTab, setActiveTab] = useState<"catalog" | "custom" | "installed" | "chat">("catalog");

  // Custom Hugging Face Inspector State
  const [hfInput, setHfInput] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedModel, setInspectedModel] = useState<InspectHuggingFaceResult | null>(null);

  // Playground State
  const [testPrompt, setTestPrompt] = useState("Generate 2 friendly greetings for a WhatsApp business message in Bengali.");
  const [testOutput, setTestOutput] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const handleInspect = async () => {
    if (!hfInput.trim()) return;
    try {
      setIsInspecting(true);
      setInspectedModel(null);
      const res = await modelsApi.inspectHuggingFace(hfInput.trim());
      setInspectedModel(res);
      toast.success(
        lang === "bn"
          ? "মডেলের তথ্য সফলভাবে যাচাই করা হয়েছে!"
          : "Hugging Face model verified successfully!"
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail || "Could not verify Hugging Face URL. Please check the link."
      );
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDownloadCustom = async () => {
    if (!inspectedModel) return;
    try {
      await startDownload(undefined, inspectedModel.download_url, inspectedModel.model_name);
      setHfInput("");
      setInspectedModel(null);
    } catch {
      // Error handled in provider toast
    }
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim()) return;
    try {
      setIsTesting(true);
      setTestOutput("");
      setTestLatency(null);
      const res = await modelsApi.generate(testPrompt, activeModel?.filename, 250);
      setTestOutput(res.text);
      setTestLatency(res.latency_ms);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Inference failed");
    } finally {
      setIsTesting(false);
    }
  };

  const copyPath = () => {
    if (systemInfo?.models_dir) {
      navigator.clipboard.writeText(systemInfo.models_dir);
      toast.success(lang === "bn" ? "পাথ কপি করা হয়েছে!" : "Folder path copied to clipboard!");
    }
  };

  return (
    <Dialog open={isModelHubOpen} onOpenChange={(v) => !v && closeModelHub()}>
      <DialogContent
        className="w-[92vw] max-w-[980px] sm:max-w-[980px] h-[84vh] max-h-[86vh] overflow-hidden p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 flex flex-col shadow-2xl"
        style={{
          width: "92vw",
          maxWidth: "980px",
          height: "84vh",
          maxHeight: "86vh",
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/30 bg-card/20 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500/20 via-primary/10 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{lang === "bn" ? "লোকাল এআই মডেল হাব" : "Local AI Model Hub"}</span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-purple-500/30 text-purple-700 dark:text-purple-300">
                    Offline • 100% Private
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {lang === "bn"
                    ? "সরাসরি আপনার কম্পিউটারে এআই মডেল ডাউনলোড করুন — কোনো এপিআই খরচ নেই, ডেটা সম্পূর্ণ নিরাপদ।"
                    : "Download and run lightweight AI models locally — zero API costs, zero data leakage, runs offline."}
                </DialogDescription>
              </div>
            </div>

            {/* Quick System Stats Pill */}
            {systemInfo && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-muted/20 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                  <span>
                    <strong className="text-foreground font-semibold">{systemInfo.available_ram_gb} GB</strong> / {systemInfo.total_ram_gb} GB RAM
                  </span>
                </div>
                <div className="h-3 w-px bg-border/40 mx-0.5" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    <strong className="text-foreground font-semibold">{systemInfo.disk_free_gb} GB</strong> Free
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Live Active Download Banner */}
        {activeDownload && activeDownload.status === "downloading" && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/5 border-b border-primary/20 shrink-0 animate-in fade-in">
            <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
              <div className="flex items-center gap-2 truncate">
                <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                <span className="font-semibold text-foreground truncate">
                  {lang === "bn" ? "ডাউনলোড হচ্ছে:" : "Downloading:"} {activeDownload.name}
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  ({(activeDownload.downloaded_bytes / (1024 * 1024)).toFixed(1)} MB / {(activeDownload.total_bytes / (1024 * 1024)).toFixed(1)} MB)
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-cyan-400 font-semibold text-[11px]">
                  ⚡ {activeDownload.speed_mbps} MB/s
                </span>
                {activeDownload.eta_seconds > 0 && (
                  <span className="text-muted-foreground text-[11px]">
                    ⏱️ {activeDownload.eta_seconds}s
                  </span>
                )}
                <span className="font-bold text-primary font-mono">
                  {activeDownload.progress_percent}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelDownload}
                  className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3 mr-1" />
                  {lang === "bn" ? "বাতিল" : "Cancel"}
                </Button>
              </div>
            </div>
            <Progress value={activeDownload.progress_percent} className="h-1.5" />
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-border/20 bg-card/10 shrink-0">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList className="bg-muted/40 p-0.5 h-9">
              <TabsTrigger value="catalog" className="text-xs px-3.5 gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{lang === "bn" ? "প্রস্তাবিত মডেল ক্যাটালগ" : "Curated Models"}</span>
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
                  {recommendedModels.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs px-3.5 gap-1.5">
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>{lang === "bn" ? "হাগিংফেইস লিঙ্ক থেকে" : "Custom HuggingFace"}</span>
              </TabsTrigger>
              <TabsTrigger value="installed" className="text-xs px-3.5 gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span>{lang === "bn" ? "ইনস্টল করা মডেল" : "Installed Models"}</span>
                {installedModels.length > 0 && (
                  <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 border-emerald-500/30 text-emerald-400 font-bold">
                    {installedModels.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs px-3.5 gap-1.5">
                <Bot className="h-3.5 w-3.5 text-purple-400" />
                <span>{lang === "bn" ? "এআই চ্যাট ও প্লেগ্রাউন্ড" : "AI Chat & Playground"}</span>
                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold bg-purple-500/10">
                  AI
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content Area */}
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          {/* ════ TAB 1: CURATED CATALOG ════ */}
          {activeTab === "catalog" && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "bn"
                    ? "কম্পিউটারের র‍্যাম ও প্রসেসরের জন্য বিশেষভাবে অপ্টিমাইজড সেরা ছোট GGUF মডেলগুলো নির্বাচন করুন:"
                    : "Select from handpicked, highly compressed GGUF models optimized for desktop CPU inference:"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={refreshModels}
                  disabled={isLoading}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  {lang === "bn" ? "রিফ্রেশ" : "Refresh"}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {recommendedModels.map((model) => {
                  const isInstalled = model.is_installed;
                  const isActive = model.is_active;
                  const isCurrentDownload = activeDownload?.model_id === model.id && activeDownload.status === "downloading";
                  const hasEnoughRam = !systemInfo || systemInfo.available_ram_gb * 1024 >= model.ram_required_mb;

                  return (
                    <Card
                      key={model.id}
                      className={`relative border transition-all flex flex-col justify-between ${
                        isActive
                          ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5"
                          : isInstalled
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border/40 bg-card/40 hover:border-border/70"
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Title & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                {model.name}
                              </h4>
                              {model.recommended && (
                                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-semibold px-1.5 py-0">
                                  Top Pick
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {model.author} • {model.filename}
                            </span>
                          </div>

                          {isActive && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">
                              Active
                            </Badge>
                          )}
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-4 gap-1.5 py-1.5 px-2.5 rounded-lg bg-muted/40 dark:bg-black/20 border border-border/40 text-center">
                          <div>
                            <div className="text-[10px] text-muted-foreground font-medium">Disk Size</div>
                            <div className="text-xs font-bold text-foreground font-mono">{model.file_size_formatted}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-medium">Min RAM</div>
                            <div className={`text-xs font-bold font-mono ${hasEnoughRam ? "text-emerald-400" : "text-amber-400"}`}>
                              {model.ram_required_mb} MB
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-medium">Speed</div>
                            <div className="text-xs font-bold text-cyan-400 font-mono">{model.inference_speed_tok_s.split(" ")[0]}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-medium">Context</div>
                            <div className="text-xs font-bold text-foreground font-mono">{model.context_window}</div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {lang === "bn" ? model.description_bn : model.description_en}
                        </p>

                        {/* Hardware alert if low RAM */}
                        {!hasEnoughRam && !isInstalled && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                              {lang === "bn"
                                ? "আপনার এভেইলেবল র‍্যাম কিছুটা কম, তবে মডেলটি চালু হতে পারে।"
                                : "Available RAM is below recommendation. May run slower."}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            {model.tags.map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                                #{t}
                              </span>
                            ))}
                          </div>

                          <div>
                            {isInstalled ? (
                              isActive ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                  <Check className="h-3.5 w-3.5" />
                                  {lang === "bn" ? "সক্রিয় মডেল" : "Active Model"}
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActiveModel(model.filename)}
                                  className="h-8 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10"
                                >
                                  {lang === "bn" ? "সক্রিয় করুন" : "Set Active"}
                                </Button>
                              )
                            ) : isCurrentDownload ? (
                              <Button type="button" size="sm" disabled className="h-8 text-xs font-semibold gap-1.5">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                {activeDownload?.progress_percent}%
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => startDownload(model.id)}
                                className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
                              >
                                <Download className="h-3.5 w-3.5" />
                                {lang === "bn" ? "ডাউনলোড করুন" : "Download"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ TAB 2: CUSTOM HUGGING FACE ════ */}
          {activeTab === "custom" && (
            <div className="space-y-4 max-w-2xl mx-auto animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <Download className="h-4 w-4 text-cyan-400" />
                  {lang === "bn"
                    ? "হাগিংফেইস (Hugging Face) থেকে যেকোনো মডেল ডাউনলোড করুন"
                    : "Download Any Custom Model from Hugging Face"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "bn"
                    ? "যেকোনো ওপেন-সোর্স GGUF মডেলের লিঙ্ক বা রিপোজিটরি নাম এখানে পেস্ট করুন। অ্যাপ সরাসরি ফাইলটি ভেরিফাই করে ডাউনলোড করবে।"
                    : "Paste a Hugging Face model URL or repository ID. The system validates the metadata and streams it directly to your local AppData storage."}
                </p>
              </div>

              {/* Input & Inspect Bar */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={hfInput}
                    onChange={(e) => setHfInput(e.target.value)}
                    placeholder={
                      lang === "bn"
                        ? "উদা: Qwen/Qwen2.5-0.5B-Instruct-GGUF বা ডিরেক্ট .gguf লিঙ্ক..."
                        : "e.g. Qwen/Qwen2.5-0.5B-Instruct-GGUF or direct .gguf link..."
                    }
                    className="text-xs font-mono h-9 bg-card/50"
                  />
                  <Button
                    type="button"
                    onClick={handleInspect}
                    disabled={isInspecting || !hfInput.trim()}
                    className="h-9 px-4 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shrink-0 gap-1.5"
                  >
                    {isInspecting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    {lang === "bn" ? "যাচাই করুন" : "Inspect"}
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3 text-cyan-400" />
                  <span>
                    Supported: <code className="text-foreground">repo/name</code> or <code className="text-foreground">https://huggingface.co/.../model.gguf</code>
                  </span>
                </div>
              </div>

              {/* Inspected Preview Card */}
              {inspectedModel && inspectedModel.valid && (
                <Card className="border-cyan-500/30 bg-cyan-500/5 p-4 space-y-3.5 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        {inspectedModel.model_name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Author: {inspectedModel.author} • Filename: {inspectedModel.filename}
                      </p>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 text-[10px]">
                      Verified GGUF
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-muted/40 dark:bg-black/25 border border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Download Size</span>
                      <strong className="text-foreground font-mono">{inspectedModel.file_size_formatted}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Estimated RAM</span>
                      <strong className="text-cyan-400 font-mono">~{inspectedModel.estimated_ram_mb} MB</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Target Storage</span>
                      <strong className="text-foreground font-mono">AppData/models</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectedModel(null)}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      {lang === "bn" ? "মুছে দিন" : "Clear"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleDownloadCustom}
                      className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {lang === "bn" ? "ডাউনলোড শুরু করুন" : "Start Download"}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Recommended Repos Quick Suggestions */}
              <div className="rounded-xl border border-border/30 bg-card/30 p-3.5 space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  💡 {lang === "bn" ? "জনপ্রিয় রিপোজিটরি উদাহরণ (ক্লিক করে পেস্ট করুন):" : "Popular GGUF Repositories (Click to paste):"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Qwen/Qwen2.5-0.5B-Instruct-GGUF",
                    "HuggingFaceTB/SmolLM2-135M-Instruct-GGUF",
                    "HuggingFaceTB/SmolLM2-360M-Instruct-GGUF",
                    "bartowski/Llama-3.2-1B-Instruct-GGUF",
                  ].map((repo) => (
                    <button
                      key={repo}
                      type="button"
                      onClick={() => setHfInput(repo)}
                      className="text-[11px] font-mono px-2 py-1 rounded bg-muted/40 hover:bg-muted/70 text-foreground/80 hover:text-foreground border border-border/30 transition-colors"
                    >
                      {repo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 3: INSTALLED MODELS & PLAYGROUND ════ */}
          {activeTab === "installed" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground">
                    {lang === "bn" ? "আপনার ডিভাইসে সংরক্ষিত মডেলসমূহ" : "Models Installed on Your Device"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === "bn"
                      ? "এই মডেলগুলো ইন্টারনেট সংযোগ ছাড়াই অফলাইনে তাৎক্ষণিক কাজ করে।"
                      : "These models are saved in your local storage and run completely offline."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPath}
                    className="h-7 text-xs font-medium border-border/50 text-muted-foreground hover:text-foreground gap-1.5"
                    title={systemInfo?.models_dir}
                  >
                    <Folder className="h-3 w-3 text-cyan-400" />
                    {lang === "bn" ? "ফোল্ডার পাথ" : "Folder Path"}
                  </Button>
                </div>
              </div>

              {installedModels.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-border/40 bg-card/20 space-y-3">
                  <Cpu className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                      {lang === "bn" ? "কোনো মডেল ইনস্টল করা নেই" : "No Models Installed Yet"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {lang === "bn"
                        ? "'প্রস্তাবিত মডেল ক্যাটালগ' ট্যাব থেকে একটি মডেল ডাউনলোড করুন।"
                        : "Download one from the 'Curated Models' tab to enable offline AI generation."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveTab("catalog")}
                    className="h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {lang === "bn" ? "মডেলগুলো দেখুন" : "Browse Models"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {installedModels.map((m) => (
                    <div
                      key={m.filename}
                      className={`rounded-xl border p-3.5 flex items-center justify-between gap-4 transition-all ${
                        m.is_active
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/30 bg-card/30 hover:border-border/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          m.is_active ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/40 text-muted-foreground"
                        }`}>
                          <Cpu className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-foreground">
                              {m.name}
                            </h4>
                            {m.is_active && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold py-0">
                                Default Active
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                            <span>{m.file_size_formatted}</span>
                            <span>•</span>
                            <span>RAM: ~{m.ram_required_mb} MB</span>
                            <span>•</span>
                            <span className="truncate max-w-[200px]" title={m.filename}>
                              {m.filename}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!m.is_active && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveModel(m.filename)}
                            className="h-7 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                          >
                            {lang === "bn" ? "সক্রিয় করুন" : "Set Active"}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteModel(m.filename)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title={lang === "bn" ? "মুছুন" : "Delete"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Playground */}
                  <div className="rounded-xl border border-border/30 bg-card/20 p-4 space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Play className="h-3.5 w-3.5 text-emerald-400" />
                        {lang === "bn" ? "মডেল টেস্টিং প্লেগ্রাউন্ড (Live Test)" : "Model Playground (Live Test)"}
                      </h4>
                      <div className="flex items-center gap-2">
                        {testLatency && (
                          <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                            ⚡ {testLatency}ms
                          </span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab("chat")}
                          className="h-6 px-2 text-[10px] gap-1 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15"
                        >
                          <Bot className="h-3 w-3" />
                          <span>{lang === "bn" ? "পূর্ণাঙ্গ এআই চ্যাট খুলুন" : "Open Full AI Chat"}</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={testPrompt}
                        onChange={(e) => setTestPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isTesting && testPrompt.trim()) {
                            e.preventDefault();
                            handleRunTest();
                          }
                        }}
                        placeholder="Type any test prompt..."
                        className="text-xs font-sans h-8 bg-card dark:bg-black/20"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleRunTest}
                        disabled={isTesting || !testPrompt.trim()}
                        className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1"
                      >
                        {isTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        {lang === "bn" ? "টেস্ট করুন" : "Test"}
                      </Button>
                    </div>

                    {/* Quick Prompt Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{lang === "bn" ? "নমুনা প্রম্পট:" : "Try:"}</span>
                      <button
                        type="button"
                        onClick={() => setTestPrompt("Generate 2 friendly greetings for a WhatsApp business message in Bengali.")}
                        className="px-2 py-0.5 rounded-md bg-secondary/40 hover:bg-secondary/80 text-foreground transition-colors border border-border/20 cursor-pointer"
                      >
                        {lang === "bn" ? "বাংলা গ্রিটিংস" : "Bengali Greetings"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestPrompt("Write 3 tips for avoiding WhatsApp bans")}
                        className="px-2 py-0.5 rounded-md bg-secondary/40 hover:bg-secondary/80 text-foreground transition-colors border border-border/20 cursor-pointer"
                      >
                        {lang === "bn" ? "ব্যান সুরক্ষা টিপস" : "Ban Protection Tips"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestPrompt("Write an exclusive 25% discount WhatsApp promotion for fashion boutique")}
                        className="px-2 py-0.5 rounded-md bg-secondary/40 hover:bg-secondary/80 text-foreground transition-colors border border-border/20 cursor-pointer"
                      >
                        {lang === "bn" ? "ডিসকাউন্ট প্রমো" : "Discount Promo"}
                      </button>
                    </div>

                    {testOutput && (
                      <div className="rounded-lg bg-muted/40 dark:bg-black/30 border border-border/40 p-3 text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap animate-in fade-in">
                        {testOutput}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 4: AI CHAT & PLAYGROUND ════ */}
          {activeTab === "chat" && (
            <div className="h-full py-1">
              <AiChatPanel compact />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/30 bg-card/30 flex items-center justify-between gap-3 shrink-0 mt-auto">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
            <Folder className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate font-mono">
              Storage: {systemInfo?.models_dir || "%APPDATA%/datakarkhana/models"}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={closeModelHub}
            className="h-8 px-4 text-xs font-medium"
          >
            {lang === "bn" ? "বন্ধ করুন" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
