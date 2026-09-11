"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/providers/auth-provider";
import { useIsDesktop } from "@/lib/desktop";
import { toast } from "sonner";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();
  const [view, setView] = useState<"login" | "register" | "otp">("login");
  const [otpEmail, setOtpEmail] = useState("");
  const [initialOtp, setInitialOtp] = useState("");
  const [verificationNotice, setVerificationNotice] = useState("");
  const verifiedRef = useRef(false);

  // If user is already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(isAdmin ? "/admin" : "/catalog");
    }
  }, [user, isLoading, isAdmin, router]);

  // Handle URL verification query params
  useEffect(() => {
    const viewParam = searchParams.get("view");
    const emailParam = searchParams.get("email");
    const verifyToken = searchParams.get("verify_token");

    if (emailParam) {
      setOtpEmail(emailParam);
    }

    if (viewParam === "otp") {
      setView("otp");
    }

    if (verifyToken && !verifiedRef.current) {
      verifiedRef.current = true;
      const cleanToken = verifyToken.trim();

      // If it's a 6-digit numeric OTP
      if (/^\d{6}$/.test(cleanToken)) {
        setInitialOtp(cleanToken);
        setView("otp");
        toast.info("6-Digit OTP detected. Click Verify & Continue to activate.");
      } else {
        // Attempt legacy token verification
        authApi
          .verifyEmail(cleanToken)
          .then((res) => {
            if (res.data.success) {
              toast.success(res.data.message || "Email verified! You can now log in.");
              setVerificationNotice(res.data.message);
              setView("login");
            } else if (res.data.already_verified) {
              toast.info("Account is already verified. Please sign in.");
              setView("login");
            } else {
              toast.warning(res.data.message || "Invalid or expired token. Enter your OTP code.");
              setView("otp");
            }
          })
          .catch(() => {
            toast.info("Please enter your 6-digit verification code below.");
            setView("otp");
          });
      }
    }
  }, [searchParams]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Card className="glass-panel w-full max-w-md p-6 sm:p-8">
        {/* Navigation Tabs for Auth Modes */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-xl mb-6 border border-border/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setView("login")}
            className={`py-2 px-2.5 rounded-lg transition-all text-center ${
              view === "login"
                ? "bg-background text-foreground shadow-sm font-bold border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setView("register")}
            className={`py-2 px-2.5 rounded-lg transition-all text-center ${
              view === "register"
                ? "bg-background text-foreground shadow-sm font-bold border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setView("otp")}
            className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              view === "otp"
                ? "bg-primary text-primary-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Verify OTP</span>
          </button>
        </div>

        <CardContent className="p-0">
          {view === "login" ? (
            <LoginForm
              onToggleView={() => setView("register")}
              onVerifyOtp={(email) => {
                setOtpEmail(email);
                setView("otp");
              }}
              verificationNotice={verificationNotice}
            />
          ) : view === "register" ? (
            <RegisterForm
              onSuccess={(email, notice) => {
                setOtpEmail(email);
                setVerificationNotice(notice);
                setView("otp");
              }}
              onToggleView={() => setView("login")}
              onVerifyOtp={() => setView("otp")}
            />
          ) : (
            <OtpVerificationForm
              email={otpEmail}
              initialOtp={initialOtp}
              onBackToLogin={() => setView("login")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopNavbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <AuthContent />
      </Suspense>
      {!isDesktop ? (
        <Footer />
      ) : (
        <footer className="py-4 border-t border-border/20 text-center text-xs text-muted-foreground/60">
          DataKarkhana Desktop © {new Date().getFullYear()} • Local Automation & Lead Generation Engine
        </footer>
      )}
    </div>
  );
}

