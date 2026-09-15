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
import { ConnectionStatusDots } from "@/components/shared/connection-status-dots";
import { useConnectionStatus } from "@/lib/hooks/use-connection-status";
import { BackendOfflineDiagnosticModal } from "@/components/shared/backend-offline-diagnostic-modal";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const { backendOnline, isChecking, checkNow, isDesktop } = useConnectionStatus();
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  /**
   * Smart retry:
   *  - Desktop (Electron): invoke restartBackend() which kills port 8000 & respawns Python,
   *    then poll health every 2 s for up to 30 s.
   *  - Web browser: open the OS-specific diagnostic guide modal.
   */
  const handleRetryConnection = async () => {
    if (isDesktop && typeof window !== "undefined" && (window as any).electronAPI?.restartBackend) {
      setIsRestarting(true);
      toast.info("Restarting local Python engine… killing port 8000 and relaunching.", { duration: 6000 });
      try {
        const result = await (window as any).electronAPI.restartBackend();
        // backend:restart in main.js now blocks until healthy (waitForBackendReady)
        if (result?.success) {
          await checkNow(); // sync UI state
          toast.success("Local engine is back online!");
        } else {
          toast.error(
            "Engine failed to start. Check logs in: ~/Library/Application Support/DataKarkhana/backend.log",
            { duration: 10000 }
          );
          setDiagnosticModalOpen(true); // fall through to manual guide
        }
      } catch {
        toast.error("IPC error communicating with Electron main process.");
      } finally {
        setIsRestarting(false);
      }
    } else {
      // Web browser — show diagnostic modal with OS-specific terminal commands
      setDiagnosticModalOpen(true);
    }
  };

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
        {/* System Diagnostics & Connection Dots Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span>{isDesktop ? "DataKarkhana Desktop" : "DataKarkhana Portal"}</span>
          </div>
          <ConnectionStatusDots />
        </div>

        {/* Offline Alert Banner (when local backend or server is not reachable) */}
        {!backendOnline && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-rose-200">
                {isDesktop ? "Local Backend Offline (Port 8000)" : "Backend Server Offline"}
              </div>
              <div className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">
                {isDesktop
                  ? isRestarting
                    ? "Killing orphan process on port 8000 and restarting Python engine… please wait."
                    : "Cannot connect to the local Python engine on port 8000. It may still be launching or starting up."
                  : "Unable to reach the server. Check your internet connection or follow the setup guide."}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRetryConnection}
                disabled={isRestarting || isChecking}
                className="mt-2.5 h-7 text-xs border-rose-500/40 text-rose-200 hover:bg-rose-500/20 gap-1.5 font-medium"
              >
                <RefreshCw className={cn("h-3 w-3", (isChecking || isRestarting) && "animate-spin")} />
                <span>
                  {isRestarting
                    ? "Restarting Engine…"
                    : isDesktop
                    ? "Restart & Retry"
                    : "Fix — Open Setup Guide"}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* OS-specific Backend Diagnostic Modal (web/browser mode) */}
        <BackendOfflineDiagnosticModal
          open={diagnosticModalOpen}
          onClose={() => setDiagnosticModalOpen(false)}
          onRetry={checkNow}
          isRetrying={isChecking}
        />

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

