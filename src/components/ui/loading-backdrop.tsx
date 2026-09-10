"use client";

import { cn } from "@/lib/utils";

interface LoadingBackdropProps {
  /** "backdrop" = full-screen fixed overlay. "inline" = fills parent container. */
  variant?: "backdrop" | "inline";
  /** Descriptive text shown below the spinner */
  label?: string;
  /** Spinner size */
  size?: "sm" | "md" | "lg";
  /** Accent colour ring */
  color?: "cyan" | "purple" | "amber" | "emerald";
  className?: string;
}

const SIZE = {
  sm: { outer: 56,  inner: 40,  core: "h-3 w-3", text: "text-[11px]" },
  md: { outer: 80,  inner: 60,  core: "h-4 w-4", text: "text-xs"     },
  lg: { outer: 112, inner: 84,  core: "h-6 w-6", text: "text-sm"     },
};

const COLOR = {
  cyan:    { border: "border-cyan-500/60",    dot: "bg-cyan-400",    shadow: "shadow-cyan-500/40",    text: "text-cyan-400"    },
  purple:  { border: "border-purple-500/60",  dot: "bg-purple-400",  shadow: "shadow-purple-500/40",  text: "text-purple-400"  },
  amber:   { border: "border-amber-500/60",   dot: "bg-amber-400",   shadow: "shadow-amber-500/40",   text: "text-amber-400"   },
  emerald: { border: "border-emerald-500/60", dot: "bg-emerald-400", shadow: "shadow-emerald-500/40", text: "text-emerald-400" },
};

export function LoadingBackdrop({
  variant = "inline",
  label,
  size = "md",
  color = "cyan",
  className,
}: LoadingBackdropProps) {
  const s = SIZE[size];
  const c = COLOR[color];

  const spinner = (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex items-center justify-center" style={{ width: s.outer, height: s.outer }}>
        {/* Outer dashed ring - slow clockwise spin */}
        <div
          className={cn("absolute rounded-full border-2 border-dashed opacity-30", c.border)}
          style={{ width: s.outer, height: s.outer, animation: "spin 4s linear infinite" }}
        />
        {/* Inner solid ring - fast counter-clockwise */}
        <div
          className={cn("absolute rounded-full border opacity-50", c.border)}
          style={{ width: s.inner, height: s.inner, animation: "spin 1.4s linear infinite reverse" }}
        />
        {/* Ping dot */}
        <div className={cn("rounded-full animate-ping opacity-70 absolute", s.core, c.dot, c.shadow)} />
        {/* Solid dot */}
        <div className={cn("rounded-full relative", s.core, c.dot, `shadow-lg ${c.shadow}`)} />
      </div>

      {label && (
        <p className={cn("font-mono tracking-wide animate-pulse", s.text, c.text)}>{label}</p>
      )}
    </div>
  );

  if (variant === "backdrop") {
    return (
      <div className={cn("fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md", className)}>
        {/* Ambient glow blob */}
        <div
          className="absolute rounded-full opacity-[0.06] blur-3xl pointer-events-none"
          style={{
            width: 400,
            height: 400,
            background: color === "cyan"
              ? "radial-gradient(circle, oklch(0.75 0.14 200), transparent)"
              : color === "purple"
              ? "radial-gradient(circle, oklch(0.65 0.2 300), transparent)"
              : color === "amber"
              ? "radial-gradient(circle, oklch(0.82 0.16 80), transparent)"
              : "radial-gradient(circle, oklch(0.72 0.19 155), transparent)",
          }}
        />
        {spinner}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center w-full py-12", className)}>
      {spinner}
    </div>
  );
}
