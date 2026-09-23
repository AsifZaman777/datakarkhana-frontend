"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useConnectionStatus } from "@/lib/hooks/use-connection-status";
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
    checkNow,
  } = useConnectionStatus();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (isRefreshing || isChecking) return;
    setIsRefreshing(true);
    try {
      await checkNow();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const allConnected = backendOnline && dbOnline;

  return (
    <div
      onClick={handleRefresh}
      role="button"
      tabIndex={0}
      title="Click to re-check connection"
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-300 cursor-pointer select-none",
        "border backdrop-blur-md shadow-sm hover:border-primary/50",
        allConnected
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
          : backendOnline
          ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
          : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300",
        className
      )}
    >
      {/* Dot 1: Local Automation Engine */}
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
            {compact ? "Local" : "Engine"}
          </span>
        )}
      </div>

      <span className="text-muted-foreground/40 text-[10px]">•</span>

      {/* Dot 2: Cloud Control Plane */}
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
            {compact ? "Cloud" : "Cloud"}
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
  );
}
