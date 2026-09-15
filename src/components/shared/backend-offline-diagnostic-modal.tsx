"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Terminal,
  RefreshCw,
  Copy,
  CheckCheck,
  Monitor,
  Apple,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BackendOfflineDiagnosticModalProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  isRetrying: boolean;
}

type OsTab = "mac" | "windows";

const MAC_STEPS = [
  {
    step: 1,
    title: "Kill any process already using port 8000",
    description: "This frees the port if another process has taken it.",
    command: "lsof -ti :8000 | xargs kill -9 2>/dev/null; echo 'Port 8000 cleared'",
  },
  {
    step: 2,
    title: "Navigate to the backend directory",
    description: "Open a new terminal and go to your project's backend folder.",
    command: "cd /path/to/datakarkhana-backend",
  },
  {
    step: 3,
    title: "Start the local Python engine",
    description: "Launch FastAPI / Uvicorn on port 8000.",
    command: "python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload",
  },
];

const WINDOWS_STEPS = [
  {
    step: 1,
    title: "Kill any process already using port 8000",
    description: "Run this in Command Prompt or PowerShell as Administrator.",
    command: `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :8000') DO taskkill /PID %P /F`,
  },
  {
    step: 2,
    title: "Navigate to the backend directory",
    description: "Open a new Command Prompt / PowerShell window.",
    command: "cd C:\\path\\to\\datakarkhana-backend",
  },
  {
    step: 3,
    title: "Start the local Python engine",
    description: "Launch FastAPI / Uvicorn on port 8000.",
    command: "python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload",
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group mt-2 rounded-lg bg-black/60 border border-border/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground px-2"
        >
          {copied ? (
            <CheckCheck className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <pre className="px-3 py-2.5 text-[11px] text-emerald-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
        <span className="text-muted-foreground/60 select-none">$ </span>
        {code}
      </pre>
    </div>
  );
}

export function BackendOfflineDiagnosticModal({
  open,
  onClose,
  onRetry,
  isRetrying,
}: BackendOfflineDiagnosticModalProps) {
  const [activeOs, setActiveOs] = useState<OsTab>("mac");

  const steps = activeOs === "mac" ? MAC_STEPS : WINDOWS_STEPS;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-panel border-rose-500/20 sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-rose-500/10 border border-rose-500/20 shrink-0">
              <AlertCircle className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Local Backend Offline — Diagnostics
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                Cannot connect to the Python automation engine on{" "}
                <code className="bg-muted/50 rounded px-1 py-0.5 text-rose-300 font-mono">
                  127.0.0.1:8000
                </code>
                . Follow the steps below to restore it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* OS Selector */}
        <div className="flex items-center gap-2 py-3">
          <span className="text-[11px] text-muted-foreground font-semibold">
            Your OS:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setActiveOs("mac")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                activeOs === "mac"
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              <Apple className="h-3.5 w-3.5" />
              macOS / Linux
            </button>
            <button
              type="button"
              onClick={() => setActiveOs("windows")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                activeOs === "windows"
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Windows
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map(({ step, title, description, command }) => (
            <div
              key={step}
              className="flex gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
            >
              <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-primary mt-0.5">
                {step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground">{title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>
                <CodeBlock code={command} />
              </div>
            </div>
          ))}
        </div>

        {/* Helpful Tips */}
        <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px] mb-2">
            <Cpu className="h-3.5 w-3.5" />
            Common Causes
          </div>
          <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
            <li>Backend server hasn&apos;t started yet — wait ~15 seconds after launch</li>
            <li>Another app is already bound to port 8000 — Step 1 fixes this</li>
            <li>Python or pip dependencies not installed (run <code className="font-mono text-amber-300">pip install -r requirements.txt</code>)</li>
            <li>Firewall or antivirus blocking localhost connections</li>
            <li>Virtual environment not activated before starting uvicorn</li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-2 gap-3">
          <Badge
            variant="outline"
            className="border-border/40 text-muted-foreground text-[10px] font-mono gap-1"
          >
            <Terminal className="h-3 w-3" />
            Port 8000 · 127.0.0.1
          </Badge>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onRetry();
              }}
              disabled={isRetrying}
              className="text-xs h-8 gap-1.5 font-bold"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
              {isRetrying ? "Checking..." : "Retry Connection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
