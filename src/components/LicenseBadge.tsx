"use client";

import { useState, useEffect } from "react";
import { Key, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { licenseApi } from "@/lib/api/license";
import type { LicenseStatus } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";

interface LicenseBadgeProps {
  onOpenModal: () => void;
}

export function LicenseBadge({ onOpenModal }: LicenseBadgeProps) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<LicenseStatus | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await licenseApi.getStatus();
      setStatus(res.data);
    } catch {
      // Backend may be starting or offline
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Poll status every 1 min
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const isExpired = status.is_expired || status.status === "expired" || status.days_remaining <= 0;
  const isUnlicensed = status.status === "unlicensed";
  const isWarning = !isExpired && !isUnlicensed && status.days_remaining <= 7;

  if (status.plan_tier === "admin") {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/30 select-none"
        title="Superadmin / Administrator Access • Unlimited"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span>{lang === "bn" ? "প্রো • অ্যাডমিন" : "PRO • Admin"}</span>
      </div>
    );
  }

  if (isUnlicensed) {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 transition-colors cursor-pointer"
        title={lang === "bn" ? "ডেস্কটপ অ্যাপ লাইসেন্সবিহীন। সক্রিয় করতে ক্লিক করুন।" : "Desktop App is Unlicensed. Click to Activate."}
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>{lang === "bn" ? "লাইসেন্সবিহীন" : "Unlicensed"}</span>
      </button>
    );
  }

  if (isExpired) {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30 transition-colors animate-pulse cursor-pointer"
        title={lang === "bn" ? "আপনার ডেস্কটপ লাইসেন্সের মেয়াদ শেষ হয়েছে। নবায়ন করতে ক্লিক করুন।" : "Your desktop production license has expired. Click to renew."}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>{lang === "bn" ? "মেয়াদ শেষ" : "License Expired"}</span>
      </button>
    );
  }

  if (isWarning) {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
        title={lang === "bn" ? `আপনার লাইসেন্সের মেয়াদ আর ${status.days_remaining} দিন বাকি আছে।` : `Your license expires in ${status.days_remaining} days. Click to view.`}
      >
        <Key className="h-3.5 w-3.5" />
        <span>{status.days_remaining}{lang === "bn" ? " দিন বাকি" : "d left"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenModal}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
      title={lang === "bn" ? `লাইসেন্স সক্রিয়: মেয়াদ ${status.expires_at ? new Date(status.expires_at).toLocaleDateString() : ""} পর্যন্ত। বিস্তারিত দেখতে ক্লিক করুন।` : `License Active: Valid until ${status.expires_at ? new Date(status.expires_at).toLocaleDateString() : ""}. Click to view details.`}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
      <span>PRO • {status.days_remaining}{lang === "bn" ? " দিন বাকি" : "d left"}</span>
    </button>
  );
}
