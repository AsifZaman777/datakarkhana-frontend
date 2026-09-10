"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Terminal,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Activity,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWsBase, TOKEN_KEY } from "@/lib/constants";
import { scraperApi } from "@/lib/api/scraper";
import { toast } from "sonner";

type StreamStatus = "idle" | "connecting" | "live" | "ended" | "error";

interface ScraperTerminalProps {
  logs?: string[];
  activeJobId: number | null;
  isJobRunning?: boolean;
  onJobFinished?: (status: string, resultCount: number) => void;
}

export function ScraperTerminal({
  logs = [],
  activeJobId,
  isJobRunning = false,
  onJobFinished,
}: ScraperTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const jobEndedRef = useRef(false);

  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [wsLogs, setWsLogs] = useState<string[]>([]);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [currentAction, setCurrentAction] = useState<string>("Standby");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const displayLogs = wsLogs.length > 0 ? wsLogs : logs;

  // Auto-scroll terminal when new logs arrive
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayLogs, autoScroll]);

  // Copy logs helper
  const handleCopyLogs = () => {
    if (displayLogs.length === 0) return;
    navigator.clipboard.writeText(displayLogs.join("\n"));
    setCopied(true);
    toast.success("Terminal logs copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear local logs helper
  const handleClearLogs = () => {
    setWsLogs([]);
    toast.info("Terminal view cleared");
  };

  // Cleanup helper
  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, "Clean close");
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
  }, []);

  // Pre-load HTTP log history when activeJobId changes
  useEffect(() => {
    if (!activeJobId) {
      setWsLogs([]);
      setDiscoveredCount(0);
      setCurrentAction("Standby");
      return;
    }

    setWsLogs([]);
    setDiscoveredCount(0);
    setCurrentAction(isJobRunning ? "Connecting to scraper service..." : "Job review");

    // Fetch initial HTTP snapshot (logs + result count) — 0 images loaded
    scraperApi
      .jobStatus(activeJobId)
      .then((res) => {
        if (res.data?.logs && res.data.logs.length > 0) {
          setWsLogs((prev) => (prev.length === 0 ? res.data.logs : prev));
        }
        if (res.data?.job?.result_count) {
          setDiscoveredCount(res.data.job.result_count);
        }
      })
      .catch(() => {});
  }, [activeJobId, isJobRunning]);

  const onJobFinishedRef = useRef(onJobFinished);
  useEffect(() => {
    onJobFinishedRef.current = onJobFinished;
  }, [onJobFinished]);

  const discoveredCountRef = useRef(discoveredCount);
  useEffect(() => {
    discoveredCountRef.current = discoveredCount;
  }, [discoveredCount]);

  // Track closed / finished job IDs so we never reopen or loop connections
  const finishedJobIdsRef = useRef<Set<number>>(new Set());

  // WebSocket connection manager — ONLY opens when job is actively running
  useEffect(() => {
    if (!activeJobId || !isJobRunning || finishedJobIdsRef.current.has(activeJobId)) {
      closeWebSocket();
      setStreamStatus(activeJobId ? "ended" : "idle");
      return;
    }

    jobEndedRef.current = false;

    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setStreamStatus("error");
      return;
    }

    let isCancelled = false;

    const connect = () => {
      if (isCancelled || jobEndedRef.current || finishedJobIdsRef.current.has(activeJobId)) return;

      closeWebSocket();
      setStreamStatus("connecting");

      const wsUrl = `${getWsBase()}/ws/scraper/${activeJobId}/stream?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isCancelled || jobEndedRef.current) {
          ws.close();
          return;
        }
        setStreamStatus("live");
        setCurrentAction("Live log stream connected");
      };

      ws.onmessage = (event) => {
        if (isCancelled || jobEndedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "init_logs" && Array.isArray(msg.logs)) {
            setWsLogs(msg.logs);
          } else if (msg.type === "log" && msg.message) {
            // Append log line instantly with zero batching
            setWsLogs((prev) => [...prev, msg.message]);

            // Update current action ticker from log tags
            const clean = msg.message.replace(/^\[\d+:\d+:\d+\]\s*/, "");
            if (clean.includes("[NAVIGATE]")) {
              setCurrentAction("Navigating Google Maps...");
            } else if (clean.includes("[SCROLL")) {
              setCurrentAction("Scrolling business feed...");
            } else if (clean.includes("[INSPECT")) {
              setCurrentAction("Inspecting business card...");
            } else if (clean.includes("[SAVED")) {
              setCurrentAction("Lead captured & saved");
            } else if (clean.includes("[RENDERED]")) {
              setCurrentAction("Google Maps page rendered");
            }
          } else if (msg.type === "progress") {
            if (typeof msg.count === "number") {
              setDiscoveredCount(msg.count);
            }
            if (msg.action) {
              setCurrentAction(msg.action);
            }
          } else if (msg.type === "job_ended") {
            jobEndedRef.current = true;
            finishedJobIdsRef.current.add(activeJobId);
            setStreamStatus("ended");
            setCurrentAction("Scrape completed");
            closeWebSocket();
            if (onJobFinishedRef.current) {
              onJobFinishedRef.current(msg.status || "done", msg.result_count || 0);
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        setStreamStatus("error");
      };

      ws.onclose = () => {
        setStreamStatus("ended");
        wsRef.current = null;
        if (jobEndedRef.current && onJobFinishedRef.current) {
          onJobFinishedRef.current("done", discoveredCountRef.current);
        }
      };
    };

    connect();

    return () => {
      isCancelled = true;
      closeWebSocket();
    };
  }, [activeJobId, isJobRunning, closeWebSocket]);

  return (
    <Card className="glass-panel border-emerald-500/30 shadow-2xl overflow-hidden bg-black/95">
      <CardContent className="p-0">
        {/* ── Terminal Window Titlebar ── */}
        <div className="bg-zinc-950/95 border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Title & macOS-style dots */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
            </div>
            <div className="h-3.5 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-zinc-100 tracking-wide">
                Scraper Live Console {activeJobId ? `[Job #${activeJobId}]` : ""}
              </span>
            </div>
          </div>

          {/* Real-time Status Badges & Controls */}
          <div className="flex items-center gap-2">
            {/* Live Action Ticker */}
            <Badge
              variant="outline"
              className="border-cyan-500/40 bg-cyan-950/30 text-cyan-300 font-mono text-[10px] gap-1 px-2.5 py-0.5 max-w-[220px] truncate"
              title={currentAction}
            >
              <Activity className="h-3 w-3 text-cyan-400 shrink-0 animate-spin" />
              <span className="truncate">{currentAction}</span>
            </Badge>

            {/* Found Leads Pill */}
            {discoveredCount > 0 && (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-mono text-[10px] px-2.5 py-0.5 gap-1"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                Leads: <strong className="text-white">{discoveredCount}</strong>
              </Badge>
            )}

            {/* Stream Status Badge */}
            {streamStatus === "live" && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-mono text-[10px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>STREAMING</span>
              </div>
            )}
            {streamStatus === "connecting" && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 font-mono text-[10px]">
                <Wifi className="h-3 w-3 animate-pulse" />
                <span>CONNECTING</span>
              </div>
            )}
            {streamStatus === "ended" && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono text-[10px]">
                <WifiOff className="h-3 w-3" />
                <span>COMPLETED</span>
              </div>
            )}

            {/* Viewport Expand / Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
              title={isExpanded ? "Collapse Viewport" : "Expand Full Viewport"}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* ── Sub-header Toolbar (Log Stats, Auto-scroll & Copy) ── */}
        <div className="bg-zinc-950/60 px-4 py-2 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Events:</span>
            <span className="text-zinc-200 font-semibold">{displayLogs.length}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">Mode:</span>
            <span className="text-emerald-400 font-medium">Text-Only Stream (Zero Overhead)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                autoScroll
                  ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300"
              }`}
              title="Toggle automatic scrolling to latest log line"
            >
              Auto-scroll: {autoScroll ? "ON" : "OFF"}
            </button>

            {displayLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLogs}
                className="h-6 px-2 text-[10px] font-mono gap-1 text-zinc-400 hover:text-rose-400"
                title="Clear logs from current view"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLogs}
              disabled={displayLogs.length === 0}
              className="h-6 px-2 text-[10px] font-mono gap-1 text-zinc-400 hover:text-white"
              title="Copy all logs to clipboard"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* ── High-Performance Streaming Log Output ── */}
        <div
          ref={terminalRef}
          className={`p-4 font-mono text-xs space-y-1 overflow-y-auto select-text scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent ${
            isExpanded ? "h-[620px]" : "h-[440px]"
          }`}
        >
          {displayLogs.length > 0 ? (
            displayLogs.map((line, idx) => {
              let colorClass = "text-zinc-300";

              if (
                line.includes("Error") ||
                line.includes("⚠️") ||
                line.includes("[WARN]") ||
                line.includes("[HALT]") ||
                line.includes("failed")
              ) {
                colorClass = "text-rose-400 font-medium";
              } else if (line.includes("[NAVIGATE]") || line.includes("🌐")) {
                colorClass = "text-cyan-400 font-semibold";
              } else if (line.includes("[RENDERED]") || line.includes("📍")) {
                colorClass = "text-blue-400 font-medium";
              } else if (line.includes("[SCROLL") || line.includes("📜")) {
                colorClass = "text-purple-300";
              } else if (line.includes("[DISCOVERY]") || line.includes("🎯")) {
                colorClass = "text-amber-300 font-semibold";
              } else if (line.includes("[INSPECT") || line.includes("🔍")) {
                colorClass = "text-yellow-300 font-medium";
              } else if (line.includes("[SAVED") || line.includes("✅") || line.includes("🎉")) {
                colorClass = "text-emerald-300 font-bold bg-emerald-950/30 px-1 py-0.5 rounded";
              }

              return (
                <div key={idx} className="leading-relaxed flex items-start gap-2.5 font-mono">
                  <span className="text-zinc-600 text-[10px] select-none shrink-0 w-7 text-right pt-0.5">
                    {idx + 1}
                  </span>
                  <span className={`flex-1 break-all ${colorClass}`}>{line}</span>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Terminal className="h-5 w-5 text-zinc-500" />
              </div>
              <div className="font-mono text-xs font-semibold text-zinc-400">
                {activeJobId
                  ? "Awaiting real-time scraper stream..."
                  : "Console Standby • Zero Overhead Mode"}
              </div>
              <p className="font-mono text-[11px] text-zinc-600 max-w-sm">
                {activeJobId
                  ? "Scraper worker is initializing and will stream real-time events here as Google Maps entries are discovered."
                  : "Launch a scraping search query from the form to monitor real-time extraction logs and verified business leads."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
