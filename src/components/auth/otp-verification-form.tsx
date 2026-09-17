"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { authApi } from "@/lib/api/auth";

interface OtpVerificationFormProps {
  email?: string;
  onBackToLogin: () => void;
  initialOtp?: string;
}

export function OtpVerificationForm({ email: initialEmail = "", onBackToLogin, initialOtp = "" }: OtpVerificationFormProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [otp, setOtp] = useState(initialOtp);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setIsEditingEmail(false);
    }
  }, [initialEmail]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(cleaned);
    setError("");

    if (cleaned.length === 6 && email.trim()) {
      submitOtp(cleaned);
    }
  };

  const submitOtp = async (codeToSubmit?: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your account email address.");
      return;
    }

    const code = (codeToSubmit || otp).trim();
    if (code.length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const res = await authApi.verifyOtp({
        email: trimmedEmail,
        otp: code,
      });

      toast.success("Email verified successfully! Welcome to DataKarkhana.");
      login(res.data.token, res.data.user);

      if (res.data.user.role === "admin" || res.data.user.role === "superadmin") {
        router.push("/admin");
      } else {
        router.push("/catalog");
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Invalid verification code. Please check and try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address to resend code.");
      toast.error("Please enter your email address first.");
      return;
    }
    if (cooldown > 0) return;
    setIsResending(true);
    setError("");

    try {
      const res = await authApi.resendVerification(trimmedEmail);
      toast.success(res.data.message || "A new 6-digit code has been sent!");
      setCooldown(45);
      setOtp("");
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">
          {lang === "bn" ? "ওটিপি কোড যাচাই" : "Verify OTP Code"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {lang === "bn"
            ? "আপনার একাউন্ট সক্রিয় করতে ইমেইলে প্রেরিত ৬-সংখ্যার ওটিপি কোডটি প্রবেশ করান"
            : "Enter the 6-digit code sent to your email to activate your account"}
        </p>
        
        {email && !isEditingEmail ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-mono text-foreground font-semibold border border-border/40">
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span>{email}</span>
            <button
              type="button"
              onClick={() => setIsEditingEmail(true)}
              className="text-[10px] text-primary underline ml-1 hover:text-primary/80 font-sans"
            >
              {lang === "bn" ? "পরিবর্তন" : "Change"}
            </button>
          </div>
        ) : null}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submitOtp();
        }}
        className="space-y-5"
      >
        {(!email || isEditingEmail) && (
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-muted-foreground">
              {lang === "bn" ? "একাউন্ট ইমেইল" : "Account Email"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="pl-9 h-10 bg-background/50 text-sm"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-center block text-muted-foreground">
            {lang === "bn" ? "৬-সংখ্যার ওটিপি কোড লিখুন:" : "Enter 6-Digit OTP Code:"}
          </label>
          <div className="flex justify-center">
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="••••••"
              className="text-center font-mono text-2xl tracking-[0.4em] font-bold h-12 w-64 bg-background border-primary/40 focus:border-primary focus:ring-primary/30 shadow-inner"
            />
          </div>
          <p className="text-[11px] text-center text-muted-foreground">
            {lang === "bn"
              ? "আপনার ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন • কোডের মেয়াদ ১৫ মিনিট"
              : "Check your email inbox or spam folder • Code is valid for 15 minutes"}
          </p>
        </div>

        <Button
          type="submit"
          disabled={isVerifying || otp.length !== 6}
          className="w-full bg-primary text-primary-foreground font-bold h-10 text-sm shadow-md"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {lang === "bn" ? "কোড যাচাই হচ্ছে..." : "Verifying Code..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {lang === "bn" ? "যাচাই করে এগিয়ে যান" : "Verify & Continue"}
            </span>
          )}
        </Button>

        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {lang === "bn" ? "সাইন ইন-এ ফিরে যান" : "Back to Sign In"}
          </button>

          <button
            type="button"
            disabled={cooldown > 0 || isResending}
            onClick={handleResend}
            className={`font-medium transition-colors ${
              cooldown > 0
                ? "text-muted-foreground/60 cursor-not-allowed"
                : "text-primary hover:underline cursor-pointer"
            }`}
          >
            {isResending
              ? (lang === "bn" ? "পাঠানো হচ্ছে..." : "Sending...")
              : cooldown > 0
              ? (lang === "bn" ? `কোড পুনরায় পাঠান (${cooldown} সে.)` : `Resend code (${cooldown}s)`)
              : (lang === "bn" ? "কোড পুনরায় পাঠান" : "Resend code")}
          </button>
        </div>
      </form>
    </div>
  );
}
