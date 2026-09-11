"use client";

import { useState, useEffect } from "react";
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Mail,
  Lock,
  CreditCard,
  MessageSquare,
  ArrowRight,
  Copy,
  Check,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { licenseApi } from "@/lib/api/license";
import { toast } from "sonner";
import { HOTLINE_PHONE, SUPPORT_EMAIL } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import type { LicenseStatus, LicenseRecord } from "@/lib/types";

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: () => void;
  onOpenPaymentModal?: () => void;
}

export function LicenseModal({
  isOpen,
  onClose,
  onActivated,
  onOpenPaymentModal,
}: LicenseModalProps) {
  const { user, refreshProfile } = useAuth();
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [myLicenses, setMyLicenses] = useState<LicenseRecord[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("activate");

  const fetchStatus = async () => {
    try {
      const res = await licenseApi.getStatus();
      setStatus(res.data);
    } catch {
      // Backend offline
    }
  };

  const fetchMyLicenses = async () => {
    setLoadingLicenses(true);
    try {
      const res = await licenseApi.myLicenses();
      setMyLicenses(res.data || []);
    } catch {
      // User may not be logged in or backend offline
      setMyLicenses([]);
    } finally {
      setLoadingLicenses(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchMyLicenses();
      setLicenseKey("");
      setCopiedKey(null);
    }
  }, [isOpen]);

  const handleActivate = async (keyToActivate?: string) => {
    const key = (keyToActivate || licenseKey).trim();
    if (!key) {
      toast.error("Please enter a Production Key or License Token.");
      return;
    }

    setIsActivating(true);
    try {
      const res = await licenseApi.activate(key);
      const creditsGranted = res.data.credits_granted || 0;

      if (creditsGranted > 0) {
        toast.success(
          `🎉 License activated! ${creditsGranted} credits added to your account.`
        );
        // Refresh user profile to update credit counter in header
        await refreshProfile();
      } else {
        toast.success(res.data.message || "License activated successfully!");
      }

      setStatus(res.data.license);
      setLicenseKey("");

      // Refresh license list to show updated redemption status
      await fetchMyLicenses();

      if (onActivated) onActivated();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Invalid or expired license key."
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("Production key copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleWhatsAppRequest = () => {
    const cleanPhone = (HOTLINE_PHONE || "+880 1863443343").replace(
      /[^0-9]/g,
      ""
    );
    const emailStr = user?.email ? ` (${user.email})` : "";
    const msg = `Hello Admin, I am using the DataKarkhana Desktop App${emailStr}. I would like to request a new production key / license renewal.`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const isExpired =
    status?.is_expired ||
    status?.status === "expired" ||
    (status?.days_remaining !== undefined && status.days_remaining <= 0);
  const isActive = status?.valid && !isExpired;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border text-foreground max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Key className="h-5 w-5 text-primary" />
            Subscribe & License Activation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Activate a key to redeem credits, view your licenses, or purchase a
            plan.
          </DialogDescription>
        </DialogHeader>

        {/* Current Status Box */}
        <div className="rounded-xl border border-border/60 bg-background/60 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Status:</span>
            {isActive ? (
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] gap-1"
              >
                <ShieldCheck className="h-3 w-3" /> Active (
                {status?.days_remaining} days remaining)
              </Badge>
            ) : isExpired ? (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" /> License Expired
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-destructive/40 text-destructive bg-destructive/10 text-[10px] gap-1"
              >
                <Lock className="h-3 w-3" /> Unlicensed
              </Badge>
            )}
          </div>

          {status?.customer_name && (
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Licensed To:</span>
              <span className="font-semibold">{status.customer_name}</span>
            </div>
          )}

          {status?.production_key && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Production Key:</span>
              <code className="font-mono text-primary font-bold">
                {status.production_key}
              </code>
            </div>
          )}

          {user && (
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Credit Balance:</span>
              <span className="font-mono font-bold text-amber-400">
                {user.credits} CR
              </span>
            </div>
          )}

          {!isActive && (
            <div className="pt-2 text-[11px] text-amber-400/90 flex items-start gap-1.5 border-t border-border/30">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                You can freely browse datasets, view catalogs, and your account.
                An active key is only needed when running local Selenium
                scrapers.
              </span>
            </div>
          )}
        </div>

        {/* Tabs: Activate / My Licenses */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="activate" className="text-xs gap-1.5">
              <Key className="h-3.5 w-3.5" />
              Activate Key
            </TabsTrigger>
            <TabsTrigger value="my-licenses" className="text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              My Licenses
              {myLicenses.filter((l) => !l.is_redeemed && l.status === "active" && !l.is_expired).length > 0 && (
                <Badge
                  variant="default"
                  className="h-4 min-w-4 px-1 text-[9px] font-bold ml-1"
                >
                  {
                    myLicenses.filter(
                      (l) =>
                        !l.is_redeemed &&
                        l.status === "active" &&
                        !l.is_expired
                    ).length
                  }
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Activate Key */}
          <TabsContent
            value="activate"
            className="space-y-3 pt-2 text-xs flex-1"
          >
            {/* Enter Production Key */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Have a Production Key? Enter it here:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="license-key-input"
                  placeholder="e.g. DK-PROD-2026-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleActivate();
                  }}
                  className="h-9 text-xs font-mono tracking-wider"
                />
                <Button
                  id="activate-license-btn"
                  size="sm"
                  onClick={() => handleActivate()}
                  disabled={isActivating || !licenseKey.trim()}
                  className="h-9 px-4 bg-primary text-primary-foreground font-bold text-xs shrink-0"
                >
                  {isActivating ? "Verifying..." : "Activate"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Activating a key will verify it, store the license locally, and
                redeem the associated credits to your account.
              </p>
            </div>

            {/* Quick Actions: Repayment / Request Key */}
            {!isActive && (
              <div className="space-y-2 pt-1 border-t border-border/40">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Don&rsquo;t have a key yet?
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {onOpenPaymentModal && (
                    <Button
                      id="buy-renew-btn"
                      type="button"
                      variant="outline"
                      onClick={onOpenPaymentModal}
                      className="h-9 text-xs border-primary/40 text-primary hover:bg-primary/10 gap-1.5 font-semibold justify-start"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Buy / Renew via bKash
                    </Button>
                  )}
                  <Button
                    id="whatsapp-request-btn"
                    type="button"
                    variant="outline"
                    onClick={handleWhatsAppRequest}
                    className="h-9 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5 font-semibold justify-start"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Request Key on WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: My Licenses */}
          <TabsContent
            value="my-licenses"
            className="pt-2 text-xs flex-1 overflow-hidden"
          >
            {loadingLicenses ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin mr-2" />
                Loading your licenses...
              </div>
            ) : myLicenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground space-y-2">
                <Key className="h-8 w-8 opacity-30" />
                <p className="text-sm font-medium">No licenses found</p>
                <p className="text-[11px]">
                  Purchase a plan to receive your first license key.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[240px] pr-2">
                <div className="space-y-2">
                  {myLicenses.map((lic) => {
                    const canActivate =
                      !lic.is_redeemed &&
                      lic.status === "active" &&
                      !lic.is_expired;
                    const isCopied = copiedKey === lic.production_key;

                    return (
                      <div
                        key={lic.id}
                        className={`rounded-lg border p-3 space-y-2 transition-colors ${
                          canActivate
                            ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                            : lic.is_redeemed
                            ? "border-border/40 bg-muted/20 opacity-80"
                            : "border-destructive/30 bg-destructive/5"
                        }`}
                      >
                        {/* Header Row: Key + Status */}
                        <div className="flex items-center justify-between gap-2">
                          <code className="font-mono text-[11px] font-bold text-primary truncate">
                            {lic.production_key}
                          </code>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {lic.is_redeemed ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-blue-500/30 text-blue-400 bg-blue-500/10 gap-0.5"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Redeemed
                              </Badge>
                            ) : lic.is_expired ||
                              lic.status === "expired" ? (
                              <Badge
                                variant="destructive"
                                className="text-[9px] gap-0.5"
                              >
                                <XCircle className="h-2.5 w-2.5" />
                                Expired
                              </Badge>
                            ) : lic.status === "revoked" ? (
                              <Badge
                                variant="destructive"
                                className="text-[9px] gap-0.5"
                              >
                                <XCircle className="h-2.5 w-2.5" />
                                Revoked
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-0.5"
                              >
                                <Coins className="h-2.5 w-2.5" />
                                {lic.credits_amount} CR Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Details Row */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {lic.plan_tier?.toUpperCase()} •{" "}
                            {lic.credits_amount} credits
                          </span>
                          <span>
                            {lic.is_expired
                              ? "Expired"
                              : `${lic.days_remaining}d left`}{" "}
                            •{" "}
                            {lic.expires_at
                              ? new Date(lic.expires_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </span>
                        </div>

                        {/* Action Row */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleCopyKey(lic.production_key)
                            }
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {isCopied ? "Copied!" : "Copy Key"}
                          </Button>

                          {canActivate && (
                            <Button
                              size="sm"
                              className="h-7 text-[10px] px-3 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              onClick={() =>
                                handleActivate(lic.production_key)
                              }
                              disabled={isActivating}
                            >
                              <Sparkles className="h-3 w-3" />
                              {isActivating
                                ? "Activating..."
                                : `Activate & Get ${lic.credits_amount} CR`}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Support Hotline Footer */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-emerald-400" />
            <span>
              Hotline:{" "}
              <strong className="text-foreground">{HOTLINE_PHONE}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-cyan-400" />
            <span>{SUPPORT_EMAIL}</span>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <span>Enter App & Continue Browsing</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
