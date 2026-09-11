"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { DownloadSection } from "@/components/landing/download-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ContactSection } from "@/components/landing/contact-section";
import { LegalModal } from "@/components/shared/legal-modal";
import { useAuth } from "@/providers/auth-provider";
import { isDesktopApp } from "@/lib/desktop";
import { LoadingBackdrop } from "@/components/ui/loading-backdrop";

function VerifyRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("verify_token");
    if (token) {
      router.replace(`/auth?verify_token=${encodeURIComponent(token)}`);
    }
  }, [searchParams, router]);

  return null;
}

export default function LandingPage() {
  const [legalModalType, setLegalModalType] = useState<"privacy" | "terms" | null>(null);
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (isDesktopApp()) {
      setIsDesktop(true);
      if (!isLoading) {
        if (user) {
          router.replace(isAdmin ? "/admin" : "/catalog");
        } else {
          router.replace("/auth");
        }
      }
    }
  }, [isLoading, user, isAdmin, router]);

  // If in desktop app, never display landing website page
  if (isDesktop) {
    return <LoadingBackdrop variant="backdrop" label="Opening DataKarkhana Desktop..." color="cyan" size="md" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Suspense fallback={null}>
        <VerifyRedirect />
      </Suspense>
      <TopNavbar />

      <main className="flex-1">
        <HeroSection />
        <DownloadSection />
        <FeaturesSection />
        <PricingSection />
        <ContactSection />
      </main>

      <Footer onOpenLegalModal={(type) => setLegalModalType(type)} />
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </div>
  );
}

