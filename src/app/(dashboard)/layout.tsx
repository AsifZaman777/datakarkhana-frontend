"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/providers/auth-provider";
import { PaymentWizardModal } from "@/components/payment/payment-wizard-modal";
import { LiveCampaignTracker } from "@/components/marketing/live-campaign-tracker";
import { LoadingBackdrop } from "@/components/ui/loading-backdrop";
import { LicenseBadge } from "@/components/LicenseBadge";
import { LicenseModal } from "@/components/LicenseModal";
import { licenseApi } from "@/lib/api/license";
import { TourProvider } from "@/providers/tour-provider";

import { useLanguage } from "@/providers/language-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAdmin } = useAuth();
  const { lang } = useLanguage();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [isLoading, user, router]);

  // Protect admin routes
  useEffect(() => {
    if (!isLoading && user && pathname.startsWith("/admin") && !isAdmin) {
      router.push("/catalog");
    }
  }, [isLoading, user, pathname, isAdmin, router]);

  // Automatically prompt license activation modal if customer is unlicensed or expired
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      licenseApi.getStatus().then((res) => {
        if (!res.data?.valid) {
          setLicenseModalOpen(true);
        }
      }).catch(() => { });
    }
  }, [isLoading, user, isAdmin]);

  if (isLoading || !user) {
    return (
      <LoadingBackdrop
        variant="backdrop"
        label={lang === "bn" ? "অ্যাকাউন্ট যাচাই হচ্ছে..." : "Authenticating session..."}
        color="cyan"
        size="md"
      />
    );
  }

  return (
    <TourProvider>
      <div className="min-h-screen flex bg-background text-foreground">
        {/* Sidebar */}
        <Sidebar onOpenPaymentModal={() => setPaymentModalOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 pt-16 lg:pt-6 lg:p-10 space-y-6 min-w-0">
          {/* Top Desktop Bar with Status, Tour & License Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">
                {lang === "bn" ? "লোকাল অটোমেশন ইঞ্জিন সচল" : "Local Automation Engine"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <LicenseBadge onOpenModal={() => setLicenseModalOpen(true)} />
            </div>
          </div>

          {/* Admin Warning Banner for Logged-In User */}
          {user.warning_message && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-start gap-3 shadow-lg">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  ⚠️ {lang === "bn" ? "সিস্টেম অ্যাডমিনিস্ট্রেটরের নোটিশ" : "Notice from System Administrator"}
                </div>
                <div className="text-xs text-foreground/90">{user.warning_message}</div>
              </div>
            </div>
          )}

          {children}
        </main>

        {/* Payment Wizard Modal */}
        <PaymentWizardModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
        />

        {/* Desktop License & Renewal Modal */}
        <LicenseModal
          isOpen={licenseModalOpen}
          onClose={() => setLicenseModalOpen(false)}
          onOpenPaymentModal={() => {
            setLicenseModalOpen(false);
            setPaymentModalOpen(true);
          }}
        />

        {/* Persistent Live Campaign Background Tracker */}
        <LiveCampaignTracker />
      </div>
    </TourProvider>
  );
}
