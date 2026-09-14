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
  MapPin,
  Activity,
  Columns,
  Rows,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocalWsBase, TOKEN_KEY } from "@/lib/constants";
import { scraperApi } from "@/lib/api/scraper";
import { toast } from "sonner";

type StreamStatus = "idle" | "connecting" | "live" | "ended" | "error";
type LayoutMode = "split" | "stacked";

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

  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [frameCount, setFrameCount] = useState(0);
  const [wsLogs, setWsLogs] = useState<string[]>([]);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [currentAction, setCurrentAction] = useState<string>("Standby");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("stacked");
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

  // Pre-load HTTP snapshot when activeJobId changes
  useEffect(() => {
    if (!activeJobId) {
      setWsLogs([]);
      setDiscoveredCount(0);
      setLiveFrame(null);
      setFrameCount(0);
      setCurrentAction("Standby");
      return;
    }

    setWsLogs([]);
    setDiscoveredCount(0);
    setLiveFrame(null);
    setFrameCount(0);
    setCurrentAction(isJobRunning ? "Connecting to Chrome driver..." : "Job review");

    // Fetch initial HTTP snapshot (logs + latest frame)
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

    scraperApi
      .screenshot(activeJobId)
      .then((res) => {
        if (res.data?.available && res.data.image) {
          setLiveFrame(res.data.image);
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

  // Track closed / finished job IDs so we NEVER reopen or loop connections for them
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

      const wsUrl = `${getLocalWsBase()}/ws/scraper/${activeJobId}/stream?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isCancelled || jobEndedRef.current) {
          ws.close();
          return;
        }
        setStreamStatus("live");
        setCurrentAction("Live stream connected");
      };

      ws.onmessage = (event) => {
        if (isCancelled || jobEndedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "init_logs" && Array.isArray(msg.logs)) {
            setWsLogs(msg.logs);
          } else if (msg.type === "log" && msg.message) {
            // Append log line instantly with 0 batching
            setWsLogs((prev) => [...prev, msg.message]);

            // Update current action badge from log message
            const clean = msg.message.replace(/^\[\d+:\d+:\d+\]\s*/, "");
            if (clean.includes("[NAVIGATE]")) {
              setCurrentAction("Navigating Google Maps...");
            } else if (clean.includes("[SCROLL")) {
              setCurrentAction("Scrolling Maps business feed...");
            } else if (clean.includes("[INSPECT")) {
              setCurrentAction("Clicking & inspecting business card...");
            } else if (clean.includes("[SAVED")) {
              setCurrentAction("Lead captured & parsed successfully");
            } else if (clean.includes("[RENDERED]")) {
              setCurrentAction("Google Maps page rendered");
            }
          } else if (msg.type === "frame" && msg.image) {
            // Update live Google Maps frame immediately
            setLiveFrame(`data:image/jpeg;base64,${msg.image}`);
            setFrameCount((prev) => prev + 1);
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
            setCurrentAction("Scrape finished");
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
    <Card className="glass-panel border-cyan-500/40 shadow-2xl overflow-hidden bg-black/95">
      <CardContent className="p-0">
        {/* ── Console & Debugger Header ── */}
        <div className="bg-zinc-950/90 border-b border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Title & OS dots */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80 border border-red-600/40" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
            </div>
            <div className="h-3.5 w-px bg-zinc-700" />
            <div className="flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-zinc-200">
                Google Maps Live Debugger {activeJobId ? `[Job #${activeJobId}]` : ""}
              </span>
            </div>
          </div>

          {/* Real-time Status Indicators */}
          <div className="flex items-center gap-2">
            {/* Live Action Ticker */}
            <Badge
              variant="outline"
              className="border-cyan-500/40 bg-cyan-950/40 text-cyan-300 font-mono text-[10px] gap-1 px-2 py-0.5 max-w-[220px] truncate"
              title={currentAction}
            >
              <Activity className="h-3 w-3 text-cyan-400 shrink-0 animate-spin" />
              <span className="truncate">{currentAction}</span>
            </Badge>

            {/* Found Leads Pill */}
            {discoveredCount > 0 && (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-mono text-[10px] px-2 py-0.5"
              >
                Leads: <strong className="ml-1 text-white">{discoveredCount}</strong>
              </Badge>
            )}

            {/* Stream Connection Pill */}
            {streamStatus === "live" && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/60 border border-red-500/50 text-red-400 font-mono text-[10px]">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE ({frameCount}f)</span>
              </div>
            )}
            {streamStatus === "connecting" && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 font-mono text-[10px]">
                <Wifi className="h-3 w-3 animate-pulse" />
                CONNECTING
              </div>
            )}
            {streamStatus === "ended" && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono text-[10px]">
                <WifiOff className="h-3 w-3" />
                ENDED
              </div>
            )}

            {/* View Mode Controls */}
            <div className="flex items-center border border-zinc-800 rounded bg-zinc-900/80 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLayoutMode("stacked")}
                className={`h-6 w-6 p-0 text-xs ${layoutMode === "stacked" ? "bg-zinc-800 text-cyan-400" : "text-zinc-400"}`}
                title="Stacked View (Map on top, Logs below)"
              >
                <Rows className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLayoutMode("split")}
                className={`h-6 w-6 p-0 text-xs ${layoutMode === "split" ? "bg-zinc-800 text-cyan-400" : "text-zinc-400"}`}
                title="Split View (Side-by-side Map & Logs)"
              >
                <Columns className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Expand / Collapse Button */}
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

        {/* ── Unified Debugger Body (Live Google Map + Realtime Log Terminal) ── */}
        <div
          className={`grid gap-0 ${
            layoutMode === "split"
              ? "grid-cols-1 lg:grid-cols-12"
              : "grid-cols-1"
          }`}
        >
          {/* 1. Google Maps Visual Debugger Canvas */}
          <div
            className={`relative bg-zinc-950 border-r border-b border-zinc-800/80 flex flex-col justify-center items-center overflow-hidden transition-all duration-200 ${
              layoutMode === "split" ? "lg:col-span-6 min-h-[360px]" : ""
            } ${isExpanded ? "max-h-[520px]" : "max-h-[320px]"}`}
          >
            {liveFrame ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={liveFrame}
                  alt="Live Google Maps Automation Feed"
                  className="w-full h-auto object-contain select-none pointer-events-none"
                />

                {/* Live Driver Inspection Overlay Tag */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-black/85 backdrop-blur-md rounded border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-xl">
                    <MapPin className="h-3 w-3 text-red-500 animate-bounce" />
                    <span>GOOGLE MAPS DRIVER</span>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  {streamStatus === "live" ? "REALTIME FRAME" : "FINAL CAPTURE"}
                </div>
              </div>
            ) : activeJobId ? (
              /* Waiting for first frame */
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
                <div className="relative flex items-center justify-center">
                  <span className="h-10 w-10 rounded-full bg-cyan-500/20 animate-ping absolute" />
                  <MapPin className="h-7 w-7 text-red-500 animate-pulse relative z-10" />
                </div>
                <div className="font-mono text-xs font-semibold text-zinc-200">
                  Connecting to Google Maps Automated Session...
                </div>
                <p className="font-mono text-[11px] text-zinc-500 max-w-xs">
                  Chrome driver is launching and querying Google Maps. Live map frames and interactive markers will appear here in real-time.
                </p>
              </div>
            ) : (
              /* Idle Standby */
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-2 min-h-[160px]">
                <MapPin className="h-6 w-6 text-zinc-600" />
                <div className="font-mono text-xs font-semibold text-zinc-400">
                  Debugger Standby
                </div>
                <p className="font-mono text-[11px] text-zinc-600 max-w-xs">
                  Launch a search query above to see live Google Maps automation, clicks, and real-time lead extraction.
                </p>
              </div>
            )}
          </div>

          {/* 2. Real-Time Streaming Console */}
          <div
            className={`flex flex-col bg-black/95 ${
              layoutMode === "split" ? "lg:col-span-6" : ""
            }`}
          >
            {/* Terminal Mini Toolbar */}
            <div className="bg-zinc-950 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Terminal className="h-3.5 w-3.5" />
                LIVE STREAM CONSOLE ({displayLogs.length} events)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`px-1.5 py-0.5 rounded text-[10px] border ${
                    autoScroll
                      ? "bg-cyan-950 border-cyan-500/40 text-cyan-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-500"
                  }`}
                  title="Toggle Auto-scroll"
                >
                  Auto-scroll: {autoScroll ? "ON" : "OFF"}
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLogs}
                  disabled={displayLogs.length === 0}
                  className="h-6 px-2 text-[10px] font-mono gap-1 text-zinc-400 hover:text-white"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Terminal Log Output (Zero-batching unbuffered stream) */}
            <div
              ref={terminalRef}
              className={`p-3 font-mono text-xs space-y-1 overflow-y-auto select-text ${
                layoutMode === "split"
                  ? isExpanded
                    ? "h-[480px]"
                    : "h-[320px]"
                  : isExpanded
                  ? "h-[360px]"
                  : "h-[220px]"
              }`}
            >
              {displayLogs.length > 0 ? (
                displayLogs.map((line, idx) => {
                  let colorClass = "text-emerald-400";

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
                    colorClass = "text-emerald-300 font-bold bg-emerald-950/20 px-1 py-0.5 rounded";
                  }

                  return (
                    <div key={idx} className="leading-relaxed flex items-start gap-2">
                      <span className="text-zinc-600 text-[10px] select-none shrink-0 w-6 text-right">
                        {idx + 1}
                      </span>
                      <span className={`flex-1 break-all ${colorClass}`}>{line}</span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                  {activeJobId ? "Awaiting real-time debugger events..." : "No active job running. Launch a search query to begin."}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
