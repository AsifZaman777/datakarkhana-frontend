"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  Bug,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isDesktopApp } from "@/lib/desktop";
import { toast } from "sonner";

export function DebugModeButton() {
  const [isDebugActive, setIsDebugActive] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize desktop and devtools status
  useEffect(() => {
    const desktop = isDesktopApp();
    setIsDesktop(desktop);

    if (desktop && window.electronAPI?.isDevToolsOpened) {
      window.electronAPI
        .isDevToolsOpened()
        .then((isOpen) => {
          setIsDebugActive(Boolean(isOpen));
        })
        .catch(() => {});

      if (window.electronAPI?.onDevToolsChange) {
        const cleanup = window.electronAPI.onDevToolsChange((isOpen) => {
          setIsDebugActive(isOpen);
        });
        return cleanup;
      }
    } else {
      const saved = sessionStorage.getItem("datakarkhana_debug_mode") === "true";
      setIsDebugActive(saved);
    }
  }, []);

  const handleToggleDebug = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isDesktop && window.electronAPI?.toggleDevTools) {
        const isOpen = await window.electronAPI.toggleDevTools();
        setIsDebugActive(isOpen);
        if (isOpen) {
          toast.success("Debug Mode Activated", {
            description: "DevTools Inspector opened. Right-click any element to Inspect or press F12.",
          });
        } else {
          toast.info("Debug Mode Deactivated", {
            description: "DevTools Inspector closed.",
          });
        }
      } else {
        const nextState = !isDebugActive;
        setIsDebugActive(nextState);
        sessionStorage.setItem("datakarkhana_debug_mode", String(nextState));
        if (nextState) {
          toast.success("Debug Mode Active (Browser)", {
            description: "Press F12 or Right Click > 'Inspect' to open browser developer tools.",
          });
          console.info("[DATAKARKHANA DEBUG] Debug mode enabled. Environment:", {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
            time: new Date().toISOString(),
          });
        } else {
          toast.info("Debug Mode Disabled", {
            description: "Web debug logging paused.",
          });
        }
      }
    } catch (err: any) {
      toast.error("Failed to toggle Debug Mode", {
        description: err?.message || "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isDesktop, isDebugActive]);

  const handleOpenInspector = async () => {
    if (isDesktop && window.electronAPI?.openDevTools) {
      await window.electronAPI.openDevTools();
      setIsDebugActive(true);
      toast.success("DevTools Inspector Opened", {
        description: "You can now inspect DOM elements, network requests, and console logs.",
      });
    } else {
      toast.info("Open Inspector", {
        description: "Press F12 or Ctrl+Shift+I / Cmd+Option+I in your browser.",
      });
    }
  };

  const handlePrintDiagnostics = () => {
    const diagnostics = {
      isDesktop: isDesktopApp(),
      platform: window.electronAPI?.platform || (typeof navigator !== "undefined" ? navigator.platform : "web"),
      debugMode: isDebugActive,
      timestamp: new Date().toISOString(),
      screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A",
    };
    console.group("🛠️ [DataKarkhana System Diagnostics]");
    console.table(diagnostics);
    console.groupEnd();
    toast.success("System Diagnostics Dumped to Console", {
      description: "Press F12 or open DevTools to inspect details in the Console tab.",
    });
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Primary Toggle Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={handleToggleDebug}
        className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all border shadow-sm flex items-center gap-2 cursor-pointer ${
          isDebugActive
            ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:bg-emerald-900/50 hover:text-emerald-200"
            : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
        }`}
        title={
          isDesktop
            ? "Toggle Debug Mode & Chromium DevTools Inspector (Shortcut: F12)"
            : "Toggle Debug Mode (Shortcut: F12 in browser)"
        }
      >
        <div className="relative flex items-center justify-center">
          <Bug className={`h-3.5 w-3.5 ${isDebugActive ? "text-emerald-400" : "text-muted-foreground"}`} />
          {isDebugActive && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>
        <span className="hidden xs:inline">Debug Mode</span>
        <Badge
          variant={isDebugActive ? "default" : "secondary"}
          className={`px-1.5 py-0 text-[10px] font-mono font-bold tracking-tight rounded leading-tight ${
            isDebugActive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isDebugActive ? "ON" : "OFF"}
        </Badge>
      </Button>

      {/* Advanced Debug Menu Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/50 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors outline-none"
          title="Inspect & Debug Options"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-card border-border/60 shadow-2xl p-1.5 z-50">
          <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5 flex items-center justify-between">
            <span>Inspector & Diagnostics</span>
            {isDesktop ? (
              <Badge variant="outline" className="text-[9px] border-cyan-500/40 text-cyan-400 bg-cyan-950/30">
                Desktop App
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400 bg-amber-950/30">
                Browser
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/40" />

          <DropdownMenuItem
            onClick={handleOpenInspector}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-md cursor-pointer hover:bg-accent/70"
          >
            <Search className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-foreground">Open DevTools Inspector</div>
              <div className="text-[10px] text-muted-foreground">Inspect DOM elements & styling</div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">F12</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleToggleDebug}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-md cursor-pointer hover:bg-accent/70"
          >
            <Terminal className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-foreground">
                {isDebugActive ? "Close DevTools" : "Launch DevTools"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {isDebugActive ? "Turn off debug inspector" : "Open full developer console"}
              </div>
            </div>
            {isDebugActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handlePrintDiagnostics}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-md cursor-pointer hover:bg-accent/70"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-foreground">Dump Diagnostics</div>
              <div className="text-[10px] text-muted-foreground">Print runtime state to console</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/40" />

          <div className="px-2.5 py-2 text-[10px] text-muted-foreground bg-muted/30 rounded-md space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Info className="h-3 w-3 text-cyan-400" />
              <span>Right-Click Inspect Element</span>
            </div>
            <p className="leading-relaxed">
              In the Desktop App, you can right-click any UI element to directly inspect it in DevTools.
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
