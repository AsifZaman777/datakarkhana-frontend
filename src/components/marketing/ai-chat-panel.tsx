"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  FileText,
  MessageSquare,
  Mail,
  Zap,
  Cpu,
  Layers,
  HelpCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/providers/language-provider";
import { useLocalModels } from "@/providers/local-models-provider";
import { modelsApi, type ChatMessage } from "@/lib/api/models";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ChatPersona = "all-round" | "copywriting" | "template" | "anti-ban" | "bangla";

interface PersonaConfig {
  id: ChatPersona;
  titleEn: string;
  titleBn: string;
  badgeEn: string;
  badgeBn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  systemPrompt: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: "all-round",
    titleEn: "Marketing Strategist",
    titleBn: "মার্কেটিং স্ট্র্যাটেজিস্ট",
    badgeEn: "Growth & B2B",
    badgeBn: "গ্রোথ ও বিটুবি",
    icon: Sparkles,
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    systemPrompt:
      "You are an expert B2B Marketing Strategist and Growth Consultant specialized in the Bangladesh and South Asian markets. You help entrepreneurs, wholesalers, and agencies build lead generation funnels, convert prospects via WhatsApp and Email, calculate campaign ROI, and craft high-response marketing campaigns.",
  },
  {
    id: "template",
    titleEn: "Template Optimizer",
    titleBn: "টেমপ্লেট অপটিমাইজার",
    badgeEn: "WhatsApp & Email",
    badgeBn: "হোয়াটসঅ্যাপ ও ইমেইল",
    icon: FileText,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    systemPrompt:
      "You are a specialized Marketing Template Optimizer. Your role is to craft, critique, and polish high-converting WhatsApp messages and HTML email templates. Always incorporate dynamic placeholders like {name}, {link}, {code}, {company}. Ensure clear hooks, concise benefit bullet points, low-friction CTAs, and spam-compliant language to maximize reply rates.",
  },
  {
    id: "copywriting",
    titleEn: "Copywriting Polish",
    titleBn: "কপিরাইটিং পলিশ",
    badgeEn: "Persuasion & Tone",
    badgeBn: "আকর্ষণীয় ভাষা",
    icon: MessageSquare,
    color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
    systemPrompt:
      "You are a world-class Direct Response Copywriter. You rewrite, polish, and sharpen marketing copy, subject lines, WhatsApp greetings, and sales pitches. You eliminate passive voice, cut unnecessary fluff, and create punchy hooks that grab attention in the first 5 words.",
  },
  {
    id: "anti-ban",
    titleEn: "Anti-Ban Doctor",
    titleBn: "অ্যান্টি-ব্যান ডক্টর",
    badgeEn: "Meta & Spam Defense",
    badgeBn: "ব্যান প্রতিরক্ষা",
    icon: ShieldCheck,
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    systemPrompt:
      "You are a WhatsApp Deliverability and Anti-Ban Specialist. You analyze messages for Meta spam filter triggers (excessive urgency, spam words, multiple URLs, ALL-CAPS). You provide structural spin variations, human delay advice (15-30s intervals), and conversational de-escalated rewrites to protect WhatsApp numbers from getting banned.",
  },
  {
    id: "bangla",
    titleEn: "Bangla B2B Outreach",
    titleBn: "বাংলা বিটুবি আউটরিচ",
    badgeEn: "Local Nuance",
    badgeBn: "দেশীয় ব্যবসায়িক ভাষা",
    icon: Bot,
    color: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30",
    systemPrompt:
      "You are a master of Bengali business communication (মার্জিত বাণিজ্যিক বাংলা). You craft natural, courteous, and culturally resonant business messages in Bengali for Bangladeshi entrepreneurs, retailers, factory owners, and service providers. Avoid unnatural machine translations and use authentic business phrasing.",
  },
];

interface QuickPrompt {
  labelEn: string;
  labelBn: string;
  prompt: string;
  persona: ChatPersona;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    labelEn: "Improve Sales Template",
    labelBn: "সেলস টেমপ্লেট উন্নত করুন",
    prompt: "Can you improve this WhatsApp sales template with {name} tokens and high-converting hooks? Here is my draft: ",
    persona: "template",
  },
  {
    labelEn: "Bengali B2B Promo",
    labelBn: "বাংলায় পাইকারি প্রমো",
    prompt: "Write a high-converting WhatsApp promotional message in Bengali for a wholesale business, targeting retail shop owners with {name} and {link} tokens.",
    persona: "bangla",
  },
  {
    labelEn: "Anti-Ban Spam Audit",
    labelBn: "স্প্যাম অডিট ও নিরাপদ রিরাইট",
    prompt: "Audit this message for WhatsApp spam trigger words and provide an anti-ban compliant safe rewrite: ",
    persona: "anti-ban",
  },
  {
    labelEn: "3 Opening Hooks",
    labelBn: "৩টি সেরা ওপেনিং হুক",
    prompt: "Generate 3 irresistible opening hooks for a B2B cold outreach campaign on WhatsApp.",
    persona: "copywriting",
  },
  {
    labelEn: "B2B Lead Playbook",
    labelBn: "বিটুবি মার্কেটিং কৌশল",
    prompt: "How should I structure a multi-channel WhatsApp and Email marketing campaign for B2B services in Bangladesh to get maximum conversion?",
    persona: "all-round",
  },
];

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  latencyMs?: number;
}

interface AiChatPanelProps {
  onApplyToWhatsApp?: (text: string) => void;
  onApplyToEmail?: (text: string) => void;
  initialPrompt?: string;
  compact?: boolean;
}

export function AiChatPanel({
  onApplyToWhatsApp,
  onApplyToEmail,
  initialPrompt,
  compact = false,
}: AiChatPanelProps) {
  const { lang } = useLanguage();
  const { activeModel, installedModels, openModelHub } = useLocalModels();

  const [persona, setPersona] = useState<ChatPersona>("all-round");
  const [messages, setMessages] = useState<MessageItem[]>(() => [
    {
      id: "welcome-1",
      role: "assistant",
      content:
        lang === "bn"
          ? "👋 আসসালামু আলাইকুম! আমি আপনার ডেডিকেটেড লোকাল এআই মার্কেটিং সহকারী।\n\nআপনি আমার সাথে নির্দ্বিধায় আলোচনা করতে পারেন:\n• **কপিরাইটিং ও রাইটিং ইমপ্রুভমেন্ট:** আপনার যেকোনো ড্রাফটকে আরও আকর্ষণীয় ও প্রফেশনাল করা\n• **টেমপ্লেট অপটিমাইজেশন:** হোয়াটসঅ্যাপ ও ইমেইল ক্যাম্পেইনের জন্য হাই-কনভার্টিং টেমপ্লেট তৈরি\n• **অ্যান্টি-ব্যান পরামর্শ:** মেটা ও হোয়াটসঅ্যাপ স্প্যাম ফিল্টার এড়িয়ে নিরাপদ বার্তা পাঠানো\n• **মার্কেটিং স্ট্র্যাটেজি:** বিটুবি লিড জেনারেশন ও সেলস বৃদ্ধি\n\nকীভাবে শুরু করতে চান? নিচের নমুনা প্রম্পট বেছে নিন অথবা সরাসরি লিখুন!"
          : "👋 Hello! I am your on-device AI Marketing & Copywriting Copilot.\n\nFeel free to chat with me about:\n• **Writing & Copy Improvement:** Polishing hooks, tone, readability, and persuasiveness\n• **Template Optimization:** Structuring high-converting WhatsApp & Email templates with {name} tokens\n• **Anti-Ban Compliance:** Evading Meta spam filters and avoiding phone number blocks\n• **Campaign Strategy:** B2B outreach playbooks and follow-up sequences\n\nPick a quick starter below or type your draft directly!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: activeModel?.name || "DataKarkhana Local Engine",
    },
  ]);

  const [input, setInput] = useState(initialPrompt || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Advanced settings
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const currentPersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: MessageItem = {
      id: "u-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation turns for backend
      const chatHistory: ChatMessage[] = messages
        .filter((m) => m.id !== "welcome-1")
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));
      chatHistory.push({ role: "user", content: textToSend });

      const res = await modelsApi.generate({
        prompt: textToSend,
        messages: chatHistory,
        system_prompt: currentPersona.systemPrompt,
        model_filename: activeModel?.filename,
        max_tokens: maxTokens,
        temperature,
      });

      const assistantMessage: MessageItem = {
        id: "a-" + Date.now(),
        role: "assistant",
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: res.model_used,
        latencyMs: res.latency_ms,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail ||
          (lang === "bn" ? "প্রতিক্রিয়া তৈরি করা সম্ভব হয়নি।" : "Failed to generate AI response.")
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success(lang === "bn" ? "ক্লিপবোর্ডে কপি করা হয়েছে!" : "Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-reset-" + Date.now(),
        role: "assistant",
        content:
          lang === "bn"
            ? "🔄 নতুন সেশন শুরু হয়েছে। আপনার পরবর্তী মার্কেটিং বা কপিরাইটিং প্রশ্নটি লিখুন!"
            : "🔄 New chat session started. Ready for your next marketing question or draft!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: activeModel?.name || "DataKarkhana Local Engine",
      },
    ]);
    toast.info(lang === "bn" ? "চ্যাট রিসেট করা হয়েছে।" : "Chat history cleared.");
  };

  const handleInsertToken = (token: string) => {
    setInput((prev) => prev + " " + token + " ");
    textareaRef.current?.focus();
  };

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(
          "flex flex-col bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-xl",
          compact ? "h-[620px]" : "h-[740px] max-h-[82vh]"
        )}
      >
        {/* ── Top Header ── */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-border/40 bg-card/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500/20 via-primary/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="h-5 w-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                  {lang === "bn" ? "🤖 এআই মার্কেটিং ও কপিরাইটিং চ্যাট" : "🤖 AI Marketing & Copywriting Copilot"}
                </h3>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex text-[10px] font-semibold border-purple-500/30 text-purple-300 bg-purple-500/10 py-0"
                >
                  Offline & Private
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {lang === "bn"
                  ? "মার্কেটিং কৌশল, টেমপ্লেট উন্নতি ও অ্যান্টি-ব্যান কপিরাইটিং পরামর্শ"
                  : "Freely chat about marketing, writing improvement & WhatsApp templates"}
              </p>
            </div>
          </div>

          {/* Model indicator & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openModelHub}
              className="h-7 text-xs border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 text-purple-300 gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
              <span className="max-w-[120px] truncate hidden md:inline">
                {activeModel?.name || "Local Engine"}
              </span>
              <span className="text-[10px] font-bold text-emerald-400">●</span>
            </Button>

            {/* Quick settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer"
                title="Chat Parameters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-3 space-y-3 text-xs">
                <div className="font-semibold text-foreground border-b border-border/40 pb-1.5">
                  {lang === "bn" ? "এআই কনফিগারেশন" : "Model Parameters"}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Creativity (Temp):</span>
                    <span className="font-mono text-foreground font-semibold">{temperature}</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    {[0.3, 0.7, 0.9].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTemperature(t)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] border flex-1 text-center transition-colors",
                          temperature === t
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "border-border/40 hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {t === 0.3 ? "Precise" : t === 0.7 ? "Balanced" : "Creative"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Max Length:</span>
                    <span className="font-mono text-foreground font-semibold">{maxTokens} tokens</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    {[256, 512, 1024].map((tok) => (
                      <button
                        key={tok}
                        type="button"
                        onClick={() => setMaxTokens(tok)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] border flex-1 text-center transition-colors",
                          maxTokens === tok
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "border-border/40 hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {tok}
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearChat}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  />
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>{lang === "bn" ? "চ্যাট মুছুন" : "Clear conversation"}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Persona Pill Selector ── */}
        <div className="px-4 sm:px-6 py-2 border-b border-border/20 bg-muted/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 shrink-0">
            {lang === "bn" ? "সহকারী ভূমিকা:" : "Persona:"}
          </span>
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = persona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all border cursor-pointer",
                  isSelected
                    ? cn("border font-bold shadow-xs bg-gradient-to-r", p.color)
                    : "border-border/30 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card/80"
                )}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span>{lang === "bn" ? p.titleBn : p.titleEn}</span>
              </button>
            );
          })}
        </div>

        {/* ── Conversation Message Feed ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={cn("flex gap-3 max-w-[92%] sm:max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold shadow-xs",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300"
                  )}
                >
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble Container */}
                <div className="space-y-1.5 min-w-0">
                  <div
                    className={cn(
                      "rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-xs transition-all",
                      isUser
                        ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-xs"
                        : "bg-card/70 border border-border/40 text-foreground rounded-tl-xs backdrop-blur-sm"
                    )}
                  >
                    {msg.content}
                  </div>

                  {/* Meta & Assistant Action Row */}
                  <div
                    className={cn(
                      "flex items-center gap-2 text-[10px] text-muted-foreground px-1",
                      isUser ? "justify-end" : "justify-between"
                    )}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-2">
                        {msg.modelUsed && (
                          <span className="font-mono text-purple-400 font-semibold truncate max-w-[140px]">
                            {msg.modelUsed}
                          </span>
                        )}
                        {msg.latencyMs && (
                          <span className="font-mono text-cyan-400 font-medium">⚡ {msg.latencyMs}ms</span>
                        )}
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                    )}

                    {isUser && <span>{msg.timestamp}</span>}

                    {!isUser && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="h-6 px-2 text-[10px] gap-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">
                                {lang === "bn" ? "কপি হয়েছে" : "Copied"}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>{lang === "bn" ? "কপি" : "Copy"}</span>
                            </>
                          )}
                        </Button>

                        {/* Apply to WhatsApp */}
                        {onApplyToWhatsApp && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onApplyToWhatsApp(msg.content)}
                            className="h-6 px-2 text-[10px] gap-1 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                          >
                            <Send className="h-3 w-3" />
                            <span>{lang === "bn" ? "হোয়াটসঅ্যাপে পাঠান" : "Use in WhatsApp"}</span>
                          </Button>
                        )}

                        {/* Apply to Email */}
                        {onApplyToEmail && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onApplyToEmail(msg.content)}
                            className="h-6 px-2 text-[10px] gap-1 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                          >
                            <Mail className="h-3 w-3" />
                            <span>{lang === "bn" ? "ইমেইলে পাঠান" : "Use in Email"}</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto animate-in fade-in">
              <div className="h-7 w-7 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-xs p-3.5 bg-card/60 border border-purple-500/20 text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                <span>
                  {lang === "bn"
                    ? "এআই চিন্তা করছে ও কপিরাইটিং তৈরি করছে..."
                    : "AI Copilot is reasoning & generating copy..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Prompt Starters Tray ── */}
        <div className="px-4 sm:px-6 py-2 bg-card/20 border-t border-border/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground shrink-0 uppercase tracking-wider">
            {lang === "bn" ? "দ্রুত জিজ্ঞাসা:" : "Try:"}
          </span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPersona(qp.persona);
                setInput(qp.prompt);
                textareaRef.current?.focus();
              }}
              className="px-2.5 py-1 rounded-md text-[11px] bg-secondary/40 hover:bg-secondary/80 text-foreground transition-all border border-border/20 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="h-2.5 w-2.5 text-primary shrink-0" />
              <span>{lang === "bn" ? qp.labelBn : qp.labelEn}</span>
            </button>
          ))}
        </div>

        {/* ── Dynamic Composer Bar ── */}
        <div className="p-3 sm:p-4 border-t border-border/40 bg-card/40 shrink-0 space-y-2">
          {/* Quick placeholder helper tokens */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium">{lang === "bn" ? "টোকেন যোগ করুন:" : "Insert token:"}</span>
              {["{name}", "{link}", "{code}", "{company}"].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => handleInsertToken(token)}
                  className="px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground font-mono text-[10px] border border-border/30 transition-colors cursor-pointer"
                >
                  {token}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-muted-foreground hidden sm:block">
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[9px]">Enter</kbd> to send,{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded border border-border/40 text-[9px]">Shift+Enter</kbd> for newline
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                lang === "bn"
                  ? "মার্কেটিং প্রমো, সেলস বার্তা বা টেমপ্লেট সম্পর্কে যেকোনো কিছু লিখুন..."
                  : "Type any prompt, paste a marketing draft to improve, or ask for strategy..."
              }
              rows={2}
              className="resize-none text-xs sm:text-sm bg-black/20 focus-visible:ring-purple-500/30 border-border/40 rounded-xl"
            />

            <Button
              type="button"
              disabled={isLoading || !input.trim()}
              onClick={() => handleSend()}
              className="h-10 px-4 bg-gradient-to-r from-purple-600 via-primary to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-xl shrink-0 gap-1.5 shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">{lang === "bn" ? "পাঠান" : "Send"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
