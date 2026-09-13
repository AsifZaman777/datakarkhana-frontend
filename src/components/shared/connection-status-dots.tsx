"use client";

import { useState } from "react";
import { Server, Database, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useConnectionStatus } from "@/lib/hooks/use-connection-status";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ConnectionStatusDotsProps {
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

export function ConnectionStatusDots({
  className,
  showLabels = true,
  compact = false,
}: ConnectionStatusDotsProps) {
  const {
    backendOnline,
    dbOnline,
    isChecking,
    latencyMs,
    errorMessage,
    apiEndpoint,
    isDesktop,
    checkNow,
  } = useConnectionStatus();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsRefreshing(true);
    await checkNow();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const allConnected = backendOnline && dbOnline;

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={handleRefresh}
            role="button"
            tabIndex={0}
            title="Click to re-check connection"
            className={cn(
              "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-300 cursor-pointer select-none",
              "border backdrop-blur-md shadow-sm hover:border-primary/50",
              allConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : backendOnline
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300",
              className
            )}
          >
            {/* Dot 1: Backend Server */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {backendOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2 transition-colors duration-300",
                    backendOnline ? "bg-emerald-400" : "bg-rose-500"
                  )}
                />
              </span>
              {showLabels && (
                <span className="font-semibold tracking-tight text-[11px]">
                  {compact ? "API" : "Server"}
                </span>
              )}
            </div>

            <span className="text-muted-foreground/40 text-[10px]">•</span>

            {/* Dot 2: Database */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {dbOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2 transition-colors duration-300",
                    dbOnline ? "bg-emerald-400" : "bg-rose-500"
                  )}
                />
              </span>
              {showLabels && (
                <span className="font-semibold tracking-tight text-[11px]">
                  {compact ? "DB" : "Database"}
                </span>
              )}
            </div>

            {/* Refresh Spinner Indicator */}
            <RefreshCw
              className={cn(
                "h-3 w-3 opacity-60 hover:opacity-100 transition-opacity ml-0.5",
                (isChecking || isRefreshing) && "animate-spin text-primary opacity-100"
              )}
            />
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="bottom"
          align="end"
          className="p-3 w-64 bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-xl text-xs space-y-2.5 z-50 text-foreground"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              {isDesktop ? "Desktop System Diagnostics" : "Cloud Diagnostics"}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-muted-foreground hover:text-primary transition-colors text-[10px] flex items-center gap-1"
            >
              <RefreshCw className={cn("h-3 w-3", (isChecking || isRefreshing) && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Backend Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Server className="h-3.5 w-3.5 text-sky-400" />
              <span>Backend API</span>
            </div>
            <div className="flex items-center gap-1 font-medium">
              {backendOnline ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Online {latencyMs ? `(${latencyMs}ms)` : ""}</span>
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Disconnected (Port 8000)</span>
                </span>
              )}
            </div>
          </div>

          {/* Database Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Cloud PostgreSQL</span>
            </div>
            <div className="flex items-center gap-1 font-medium">
              {dbOnline ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Supabase Ready</span>
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Offline</span>
                </span>
              )}
            </div>
          </div>

          {/* Target Host Info */}
          <div className="pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground/70 truncate">
            Target: <code className="text-primary/90 font-mono">{apiEndpoint}</code>
          </div>

          {errorMessage && (
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">
              {errorMessage}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
