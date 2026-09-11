"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Key, Copy, Check, Calendar, MessageSquare, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PromptModal } from "@/components/ui/modal-prompt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";
import type { PaymentRequest } from "@/lib/types";

interface PaymentVerificationProps {
  requests: PaymentRequest[];
  onRefresh: () => void;
}

interface GeneratedLicenseDialogData {
  production_key: string;
  license_token: string;
  customer_name: string;
  customer_email?: string;
  expires_at: string;
  package_name: string;
}

export function PaymentVerification({ requests, onRefresh }: PaymentVerificationProps) {
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<PaymentRequest | null>(null);
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [customKey, setCustomKey] = useState<string>("");
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Success dialog after key is generated
  const [licenseResult, setLicenseResult] = useState<GeneratedLicenseDialogData | null>(null);

  const openApproveModal = (req: PaymentRequest) => {
    setApproveTarget(req);
    setExpiryDays(30);
    setCustomKey("");
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setIsApproving(true);
    try {
      const res = await adminApi.approvePayment(approveTarget.id, {
        expiry_days: expiryDays,
        custom_key: customKey.trim() || undefined,
      });

      toast.success(res.data.message || "Payment approved & Production Key generated!");

      if (res.data.license) {
        setLicenseResult({
          production_key: res.data.license.production_key,
          license_token: res.data.license.license_token,
          customer_name: res.data.license.customer_name,
          customer_email: approveTarget.user_email,
          expires_at: res.data.license.expires_at,
          package_name: approveTarget.package_name,
        });
      }

      setApproveTarget(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to approve payment.");
    } finally {
      setIsApproving(false);
    }
  };

  const confirmReject = async (reason: string) => {
    if (!rejectTargetId || !reason) return;
    try {
      await adminApi.rejectPayment(rejectTargetId, reason);
      toast.info("Payment rejected.");
      onRefresh();
    } catch {
      toast.error("Failed to reject payment.");
    } finally {
      setRejectTargetId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const copyWhatsAppMessage = (data: GeneratedLicenseDialogData) => {
    const formattedDate = new Date(data.expires_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const msg = `🎉 Greetings ${data.customer_name}!\n\nYour DataKarkhana Desktop App subscription for ${data.package_name} is approved & active!\n\n🔑 Production License Key:\n${data.production_key}\n\n📅 Expiration Date: ${formattedDate}\n\n💻 How to Activate:\n1. Open DataKarkhana Desktop App on your PC or Laptop\n2. Paste your Production Key\n3. Click 'Activate License'\n\nThank you for choosing DataKarkhana!`;

    navigator.clipboard.writeText(msg);
    toast.success("Ready-to-send WhatsApp message copied!");
  };

  return (
    <Card className="glass-panel p-6">
      <CardContent className="p-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Customer BDT Payment Submissions Verification</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Approve bKash/Pathao payments, manually assign expiration dates, and generate production keys.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID #</TableHead>
                <TableHead>Customer Email / Name</TableHead>
                <TableHead>Package Requested</TableHead>
                <TableHead>Method & Sender</TableHead>
                <TableHead>Transaction ID (TrxID)</TableHead>
                <TableHead>Production License Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{req.id}</TableCell>
                  <TableCell className="text-xs font-semibold">
                    <div>{req.user_email}</div>
                    <div className="text-[10px] text-muted-foreground">{req.full_name || "Customer"}</div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-cyan-400">
                    <div>{req.package_name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">৳{req.amount_bdt} BDT</div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    <div className="uppercase font-bold text-amber-500">{req.payment_method}</div>
                    <div className="text-[10px] text-muted-foreground">{req.bkash_number}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-foreground tracking-wider">
                    {req.transaction_id}
                  </TableCell>
                  <TableCell>
                    {req.production_key ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">
                          {req.production_key}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(req.production_key!, `row-${req.id}`)}
                          title="Copy Production Key"
                        >
                          {copiedKey === `row-${req.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">None issued</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {req.status === "pending" && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                        Pending Review
                      </Badge>
                    )}
                    {req.status === "approved" && (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                        Approved
                      </Badge>
                    )}
                    {req.status === "rejected" && (
                      <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px]">
                        Rejected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={() => openApproveModal(req)}
                          className="h-7 text-[11px] px-2.5 bg-emerald-500 text-black font-bold hover:bg-emerald-600 gap-1.5 shadow-sm"
                        >
                          <Key className="h-3 w-3" /> Approve & Key
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectTargetId(req.id)}
                          className="h-7 text-[11px] px-2 gap-1"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Processed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                    No payment verification requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* ── STEP 1: APPROVAL & EXPIRATION ASSIGNMENT MODAL ── */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Approve Payment & Issue Desktop License
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign an expiration period and generate a signed production key for this customer.
            </DialogDescription>
          </DialogHeader>

          {approveTarget && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-lg border border-border/50 bg-background/60 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold">{approveTarget.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package:</span>
                  <span className="font-bold text-cyan-400">{approveTarget.package_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono font-bold text-amber-400">৳{approveTarget.amount_bdt} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TrxID:</span>
                  <span className="font-mono font-bold">{approveTarget.transaction_id}</span>
                </div>
              </div>

              {/* Expiry Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Assign License Expiration Period:
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "30 Days", days: 30 },
                    { label: "60 Days", days: 60 },
                    { label: "90 Days", days: 90 },
                    { label: "1 Year", days: 365 },
                  ].map((p) => (
                    <Button
                      key={p.days}
                      type="button"
                      variant={expiryDays === p.days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpiryDays(p.days)}
                      className={`text-xs h-8 ${expiryDays === p.days ? "bg-primary text-primary-foreground font-bold" : "border-border/60"}`}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">Or custom days:</span>
                  <Input
                    type="number"
                    min={1}
                    max={1825}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                    className="h-8 w-24 text-xs font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">days</span>
                </div>
              </div>

              {/* Optional Custom Key */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Custom Key Format (Optional):</Label>
                <Input
                  placeholder="Auto-generated if left empty (e.g. DK-PROD-2026-XXXX)"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setApproveTarget(null)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmApprove}
              disabled={isApproving}
              className="h-8 text-xs bg-emerald-500 text-black font-bold hover:bg-emerald-600 gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isApproving ? "Generating Key..." : "Approve & Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STEP 2: GENERATED LICENSE RESULT & COPY MODAL ── */}
      <Dialog open={!!licenseResult} onOpenChange={(open) => !open && setLicenseResult(null)}>
        <DialogContent className="sm:max-w-[540px] bg-card border-border/80 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Production Key Generated Successfully!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Payment approved! Copy the key below and send it to your customer.
            </DialogDescription>
          </DialogHeader>

          {licenseResult && (
            <div className="space-y-4 py-2">
              {/* Big Highlighted Key Box */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Production Key
                  </span>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                    Active • Valid until {new Date(licenseResult.expires_at).toLocaleDateString()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-black/60 border border-emerald-500/40 rounded-lg p-3">
                  <code className="text-base font-mono font-extrabold text-emerald-300 tracking-wider">
                    {licenseResult.production_key}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(licenseResult.production_key, "modal-key")}
                    className="h-8 px-3 bg-emerald-500 text-black font-bold hover:bg-emerald-600 gap-1 text-xs"
                  >
                    {copiedKey === "modal-key" ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Key
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick WhatsApp Share Action */}
              <div className="rounded-lg border border-border/50 bg-background/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                    Customer Message Template:
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyWhatsAppMessage(licenseResult)}
                    className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                  >
                    <Copy className="h-3 w-3" /> Copy WhatsApp Message
                  </Button>
                </div>
                <div className="text-[11px] text-muted-foreground bg-black/40 p-2.5 rounded border border-border/40 font-mono whitespace-pre-line">
                  {`Customer: ${licenseResult.customer_name} (${licenseResult.customer_email || "N/A"})\nKey: ${licenseResult.production_key}\nExpires: ${new Date(licenseResult.expires_at).toLocaleDateString()}`}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => setLicenseResult(null)}
              className="h-8 text-xs bg-primary text-primary-foreground font-semibold"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <PromptModal
        open={!!rejectTargetId}
        title="Reject Payment Request"
        description="State why this customer payment submission is being rejected."
        placeholder="e.g. Transaction ID not found or payment not received"
        confirmText="Reject Payment"
        onConfirm={confirmReject}
        onClose={() => setRejectTargetId(null)}
      />
    </Card>
  );
}
