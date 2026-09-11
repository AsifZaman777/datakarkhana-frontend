"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertTriangle, CheckCircle2, Key, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { authApi } from "@/lib/api/auth";
import { licenseApi } from "@/lib/api/license";

interface LoginFormProps {
  onToggleView: () => void;
  onVerifyOtp?: (email: string) => void;
  verificationNotice?: string;
}

export function LoginForm({ onToggleView, onVerifyOtp, verificationNotice }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const at = t.auth || {};

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [renewalKey, setRenewalKey] = useState("");
  const [showRenewalBox, setShowRenewalBox] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await authApi.login({ email, password });
      toast.success("Signed in successfully!");
      login(res.data.token, res.data.user);

      if (res.data.user.role === "admin" || res.data.user.role === "superadmin") {
        router.push("/admin");
      } else {
        router.push("/catalog");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        (err.code === "ERR_NETWORK" || !err.response
          ? "Cannot connect to backend server. Please verify backend is running on port 8000."
          : err.message || "Authentication failed. Check credentials.");
      setError(msg);
      if (msg.toLowerCase().includes("license expired")) {
        setShowRenewalBox(true);
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRenew = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password first.");
      return;
    }
    if (!renewalKey.trim()) {
      toast.error("Please enter your new license key.");
      return;
    }
    setIsRenewing(true);
    try {
      const res = await licenseApi.quickRenew({
        email: email.trim(),
        password,
        license_key: renewalKey.trim(),
      });
      toast.success(res.data.message || "License renewed successfully!");
      login(res.data.token, res.data.user);
      router.push("/catalog");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to renew license.");
    } finally {
      setIsRenewing(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.warning("Please enter your email address first.");
      return;
    }
    try {
      const res = await authApi.resendVerification(email);
      toast.success(res.data.message || "Verification link sent to your email!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to resend verification.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">{at.signInTitle || "Sign In"}</h2>
        <p className="text-xs text-muted-foreground">
          {at.signInDesc || "Enter your credentials to access your lead dashboard"}
        </p>
      </div>

      {verificationNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{verificationNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes("not verified") && (
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => onVerifyOtp?.(email)}
                className="w-full text-xs font-bold bg-primary text-primary-foreground"
              >
                Enter 6-Digit Verification Code (OTP)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResend}
                className="w-full text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                {at.resendEmailBtn || "Resend Verification Code"}
              </Button>
            </div>
          )}
          {error.toLowerCase().includes("license expired") && (
            <div className="pt-2 border-t border-destructive/20 space-y-2">
              <p className="text-[11px] text-foreground/80">
                Have a new production key from your administrator? Enter it below to renew your account immediately:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new DK-PROD-2026-XXXX key"
                  value={renewalKey}
                  onChange={(e) => setRenewalKey(e.target.value)}
                  className="h-8 text-xs font-mono bg-background text-foreground"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleQuickRenew}
                  disabled={isRenewing}
                  className="h-8 text-xs font-bold shrink-0 bg-primary text-primary-foreground"
                >
                  {isRenewing ? "Renewing..." : "Renew & Login"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">{at.emailLabel || "Email Address *"}</Label>
          <div className="relative">
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              className="pl-10"
            />
            <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">{at.passwordLabel || "Password *"}</Label>
          <div className="relative">
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="pl-10"
            />
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full font-bold py-5">
          {isSubmitting ? (at.btnSigningIn || "Signing in...") : (at.btnSignIn || "Sign In")}
        </Button>
      </form>

      <div className="text-center text-xs text-muted-foreground space-y-2 pt-2 border-t border-border/40">
        <div>
          {at.noAccount || "No account?"}{" "}
          <button
            type="button"
            onClick={onToggleView}
            className="text-primary font-semibold hover:underline"
          >
            {at.registerHere || "Register Here"}
          </button>
        </div>
        {onVerifyOtp && (
          <div>
            <span className="text-muted-foreground">Received an OTP code? </span>
            <button
              type="button"
              onClick={() => onVerifyOtp(email)}
              className="text-primary font-semibold hover:underline"
            >
              Verify Email with OTP →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
