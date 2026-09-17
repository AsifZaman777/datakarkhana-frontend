"use client";

import { useState, useEffect } from "react";
import { Building, ShieldCheck, CheckCircle2, XCircle, Clock, ExternalLink, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marketingApi } from "@/lib/api/marketing";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import type { BrevoApplication } from "@/lib/types";
import { LoadingBackdrop } from "@/components/ui/loading-backdrop";

export function BrevoApplicationsList() {
  const { t, lang } = useLanguage();
  const [applications, setApplications] = useState<BrevoApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Approval Modal State
  const [approveTarget, setApproveTarget] = useState<BrevoApplication | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [dailyLimit, setDailyLimit] = useState<number>(300);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  // FIX: moved targetStatus to top with all other state (was declared after useEffect)
  const [targetStatus, setTargetStatus] = useState<string>("pending_email_verification");

  // Rejection Modal State
  const [rejectTarget, setRejectTarget] = useState<BrevoApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const loadApplications = () => {
    setLoading(true);
    marketingApi
      .listBrevoApplications()
      .then((res) => setApplications(res.data))
      .catch(() => toast.error("Failed to load Brevo applications."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleOpenApprove = (app: BrevoApplication) => {
    setApproveTarget(app);
    // FIX: Original had an operator precedence bug: `(app.assigned_api_key || app.user_email) ?`
    // user_email is always truthy, so a random key was ALWAYS auto-generated. Now we correctly
    // pre-fill only when there is already an existing assigned_api_key.
    setApiKey(app.assigned_api_key || "");
    setDailyLimit(app.daily_limit || 300);
    setTargetStatus("pending_email_verification");
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    if (targetStatus === "approved" && !apiKey.trim()) {
      toast.warning("Please enter a valid Brevo API Key to mark as Approved.");
      return;
    }
    setIsSubmittingApprove(true);
    try {
      await marketingApi.approveBrevoApplication(approveTarget.id, {
        api_key: apiKey.trim(),
        daily_limit: Number(dailyLimit) || 300,
        account_status: targetStatus,
      });
      const msg = targetStatus === "pending_email_verification"
        ? `Initiated Brevo registration! Awaiting customer email confirmation for ${approveTarget.user_email}.`
        : `Approved Brevo account for ${approveTarget.user_email}!`;
      toast.success(msg);
      setApproveTarget(null);
      loadApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Approval failed.");
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.warning("Please enter a reason for rejecting this application.");
      return;
    }
    setIsSubmittingReject(true);
    try {
      await marketingApi.rejectBrevoApplication(rejectTarget.id, {
        reason: rejectReason.trim(),
      });
      toast.success(`Application rejected for ${rejectTarget.user_email}.`);
      setRejectTarget(null);
      loadApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Rejection failed.");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleUnapproveUser = async (userId: number, userEmail?: string) => {
    try {
      await marketingApi.unapproveUserBrevo(userId);
      toast.success(`Revoked Brevo approval for ${userEmail || `User #${userId}`}. Email panel locked.`);
      loadApplications();
    } catch {
      toast.error("Failed to revoke Brevo approval.");
    }
  };

  return (
    <Card className="glass-panel p-6 border-purple-500/30">
      <CardContent className="p-0 space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-foreground">
              {lang === "bn" ? "ব্রেভো (Brevo) বিজনেস ভেরিফিকেশন ও এপিআই অনুমোদন" : "Brevo Business Verification & API Approvals"}
            </h3>
          </div>
          <Badge variant="outline" className="border-purple-500/40 text-purple-300 font-mono text-xs">
            {lang === "bn" ? `আবেদন: ${applications.length}টি` : `Submissions: ${applications.length}`}
          </Badge>
        </div>

        {/* Loading state */}
        {loading && (
          <LoadingBackdrop
            variant="inline"
            label={lang === "bn" ? "ব্রেভো আবেদন লোড হচ্ছে..." : "Loading Brevo applications..."}
            color="purple"
            size="md"
          />
        )}

        {/* Applications List */}
        {!loading && <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-xl border border-border/40 bg-card/50 space-y-3 hover:border-purple-500/30 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/20 pb-2">
                <div>
                  <span className="font-bold text-sm text-foreground">{app.business_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">({app.user_email || `User #${app.user_id}`})</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status Badges */}
                  {app.status === "pending" && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 gap-1 text-[11px]">
                      <Clock className="h-3 w-3 animate-pulse" />
                      {lang === "bn" ? "রিভিউ বাকি" : "Pending Review"}
                    </Badge>
                  )}
                  {app.status === "pending_email_verification" && (
                    <Badge variant="outline" className="border-blue-500/40 text-blue-400 gap-1 text-[11px]">
                      <Mail className="h-3 w-3 animate-pulse" />
                      {lang === "bn" ? "ইমেইল ভেরিফিকেশন বাকি" : "Awaiting Email Verification"}
                    </Badge>
                  )}
                  {app.status === "email_verified" && (
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      {lang === "bn" ? "ইমেইল ভেরিফাইড — এপিআই কি প্রয়োজন" : "Email Verified — Needs API Key"}
                    </Badge>
                  )}
                  {app.status === "approved" && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      {lang === "bn"
                        ? `অনুমোদিত (${app.daily_limit || 300}/দিন)`
                        : `Approved (${app.daily_limit || 300}/day)`}
                    </Badge>
                  )}
                  {app.status === "rejected" && (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-400 gap-1 text-[11px]">
                      <XCircle className="h-3 w-3" />
                      {lang === "bn" ? "বাতিল" : "Rejected"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Business Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px]">{lang === "bn" ? "ডোমেইন:" : "Domain:"}</span>
                  <span className="text-purple-300 font-bold">{app.domain_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">{lang === "bn" ? "ফোন:" : "Phone:"}</span>
                  <span className="text-foreground">{app.business_phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">{lang === "bn" ? "ঠিকানা:" : "Location:"}</span>
                  <span className="text-foreground">{app.location}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">{lang === "bn" ? "জমাদান:" : "Submitted:"}</span>
                  <span className="text-muted-foreground">{app.created_at ? app.created_at.split("T")[0] : ""}</span>
                </div>
              </div>

              {/* Verification Handle / Social Link */}
              <div className="text-xs bg-background/60 p-2.5 rounded-lg border border-border/30 flex items-center justify-between">
                <span className="text-muted-foreground font-mono text-[11px]">
                  {lang === "bn" ? "ভেরিফিকেশন হ্যান্ডেল/ওয়েবসাইট: " : "Verification Handle/Website: "}
                  <strong className="text-cyan-400">{app.social_media_website}</strong>
                </span>
                {app.social_media_website?.startsWith("http") && (
                  <a
                    href={app.social_media_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-[11px] font-bold shrink-0"
                  >
                    {lang === "bn" ? "দেখুন" : "Inspect"} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Assigned API Key preview if approved */}
              {app.status === "approved" && app.assigned_api_key && (
                <div className="text-xs text-emerald-400 bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/30 flex items-center justify-between font-mono">
                  <span>
                    {lang === "bn" ? "সংযুক্ত ব্রেভো এপিআই কি: " : "Linked Brevo API Key: "}
                    <strong>{app.assigned_api_key}</strong>
                  </span>
                  <span>
                    {lang === "bn" ? `দৈনিক সীমা: ${app.daily_limit}টি ইমেইল/দিন` : `Limit: ${app.daily_limit} emails/day`}
                  </span>
                </div>
              )}

              {/* Show rejection reason when rejected */}
              {app.status === "rejected" && app.rejection_reason && (
                <div className="text-xs text-rose-400 bg-rose-950/20 p-2 rounded-lg border border-rose-500/30 font-mono">
                  <span className="text-muted-foreground">{lang === "bn" ? "বাতিলের কারণ: " : "Rejection reason: "}</span>
                  {app.rejection_reason}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                {app.status === "pending" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectTarget(app)}
                      className="h-8 text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                    >
                      {lang === "bn" ? "আবেদন বাতিল" : "Reject Application"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenApprove(app)}
                      className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {lang === "bn" ? "ব্রেভো একাউন্ট শুরু" : "Initiate Brevo Account"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnapproveUser(app.user_id, app.user_email)}
                      className="h-8 text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {lang === "bn" ? "অনুমোদন বাতিল / লক" : "Unapprove / Lock Access"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenApprove(app)}
                      className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {lang === "bn" ? "এপিআই কি কনফিগার" : "Configure / Link API Key"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {applications.length === 0 && (
            <div className="text-center py-12 text-xs text-muted-foreground italic">
              {lang === "bn"
                ? "এখনও কোনো ব্রেভো বিজনেস ভেরিফিকেশন আবেদন জমা পড়েনি।"
                : "No Brevo business verification applications submitted yet."}
            </div>
          )}
        </div>}
      </CardContent>

      {/* Approval / Registration Modal */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <ShieldCheck className="h-5 w-5" />
              {targetStatus === "pending_email_verification"
                ? (lang === "bn"
                    ? `ব্রেভো রেজিস্ট্রেশন শুরু (${approveTarget?.business_name})`
                    : `Initiate Brevo Registration (${approveTarget?.business_name})`)
                : (lang === "bn"
                    ? `ব্রেভো ক্রেডেনশিয়াল কনফিগারেশন (${approveTarget?.business_name})`
                    : `Configure Brevo Credentials (${approveTarget?.business_name})`)}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {targetStatus === "pending_email_verification"
                ? (lang === "bn"
                    ? `${approveTarget?.user_email}-এর জন্য ব্রেভো অ্যাকাউন্ট খুলুন। ব্রেভো সরাসরি গ্রাহকের ইনবক্সে ভেরিফিকেশন ইমেইল পাঠাবে।`
                    : `Open Brevo account for ${approveTarget?.user_email}. Brevo will send the confirmation email directly to the customer's inbox.`)
                : (lang === "bn"
                    ? "গ্রাহকের ব্রেভো এপিআই কি (xkeysib-...) পেস্ট করুন এবং দৈনিক সীমা নির্ধারণ করুন।"
                    : `Paste the customer's Brevo API Key (xkeysib-...) and set the daily dispatch limit.`)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "অ্যাকাউন্ট অ্যাক্টিভেশন মোড" : "Account Activation Mode"}
              </Label>
              <Select value={targetStatus} onValueChange={(val) => val && setTargetStatus(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_email_verification">
                    {lang === "bn"
                      ? "১. অ্যাকাউন্ট সাইনআপ শুরু (গ্রাহকের ইমেইল ভেরিফিকেশনের জন্য অপেক্ষা)"
                      : "1. Initiate Account Signup (Await Customer Email Verification)"}
                  </SelectItem>
                  <SelectItem value="approved">
                    {lang === "bn"
                      ? "২. এপিআই কি লিঙ্ক ও আনলক (সম্পূর্ণ অনুমোদিত)"
                      : "2. Link API Key & Unlock (Fully Approved)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetStatus === "pending_email_verification" && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">
                    {lang === "bn" ? "গ্রাহকের ইমেইল:" : "Customer Email:"}
                  </span>
                  <span className="font-mono text-white font-semibold">{approveTarget?.user_email}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {lang === "bn"
                    ? "গ্রাহকের ইমেইল কপি করতে নিচের বাটনে ক্লিক করুন এবং নতুন ট্যাবে ব্রেভোর সাইন-আপ পোর্টাল খুলুন। ব্রেভো সরাসরি গ্রাহকের ইনবক্সে ভেরিফিকেশন লিঙ্ক পাঠাবে।"
                    : "Click the button below to copy the customers email and open Brevo's sign-up portal in a new tab. Brevo will send the confirmation link directly to their inbox."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (approveTarget?.user_email) {
                      navigator.clipboard.writeText(approveTarget.user_email);
                      toast.success(
                        lang === "bn"
                          ? `ইমেইল "${approveTarget.user_email}" ক্লিপবোর্ডে কপি করা হয়েছে! ব্রেভো খোলা হচ্ছে...`
                          : `Copied "${approveTarget.user_email}" to clipboard! Opening Brevo signup...`
                      );
                      window.open("https://app.brevo.com/account/register", "_blank");
                    }
                  }}
                  className="w-full text-xs font-bold border-purple-500/40 text-purple-300 hover:bg-purple-500/20 gap-2 h-9 mt-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {lang === "bn" ? "ইমেইল কপি ও ব্রেভো সাইনআপ খুলুন" : "Copy Email & Open Brevo Signup"}
                </Button>
              </div>
            )}

            {targetStatus === "approved" && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {lang === "bn" ? "গ্রাহকের ব্রেভো এপিআই কি *" : "Customer's Brevo API Key *"}
                </Label>
                <Input
                  placeholder="xkeysib-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-xs font-mono h-9"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "দৈনিক ইমেইল সীমা (প্রতিদিনের সীমা) *" : "Daily Email Limit (Emails per Day) *"}
              </Label>
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                min={10}
                max={50000}
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                {lang === "bn"
                  ? "ডিফল্ট: ফ্রি ব্রেভো অ্যাকাউন্টের জন্য প্রতিদিন ৩০০টি ইমেইল।"
                  : "Default: 300 emails per day for free Brevo accounts."}
              </p>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="ghost" onClick={() => setApproveTarget(null)} className="text-xs h-8">
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={isSubmittingApprove}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8"
            >
              {isSubmittingApprove
                ? (lang === "bn" ? "প্রক্রিয়াধীন..." : "Processing...")
                : targetStatus === "pending_email_verification"
                ? (lang === "bn" ? "সাইনআপ শুরু ও ভেরিফিকেশন ইমেইল পাঠান" : "Initiate Signup & Trigger Verification Email")
                : (lang === "bn" ? "এপিআই কি লিঙ্ক ও আনলক করুন" : "Link API Key & Unlock Email Marketing")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-rose-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <XCircle className="h-5 w-5" />
              {lang === "bn" ? "বিজনেস ভেরিফিকেশন বাতিল" : "Reject Business Verification"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lang === "bn"
                ? `কেন ${rejectTarget?.business_name}-এর ভেরিফিকেশন বাতিল করা হচ্ছে তার কারণ উল্লেখ করুন।`
                : `Provide feedback on why this verification request for ${rejectTarget?.business_name} was rejected.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold">
              {lang === "bn" ? "বাতিলের কারণ / ফিডব্যাক *" : "Rejection Reason / Feedback *"}
            </Label>
            <Textarea
              placeholder={
                lang === "bn"
                  ? "যেমন: ডোমেইন ভেরিফিকেশন ব্যর্থ হয়েছে বা সোশ্যাল মিডিয়া উপস্থিতি অপর্যাপ্ত।"
                  : "e.g. Domain verification failed or insufficient social media presence."
              }
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-3">
            <Button variant="ghost" onClick={() => setRejectTarget(null)} className="text-xs h-8">
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isSubmittingReject}
              className="font-bold text-xs h-8"
            >
              {isSubmittingReject
                ? (lang === "bn" ? "বাতিল হচ্ছে..." : "Rejecting...")
                : (lang === "bn" ? "ভেরিফিকেশন বাতিল করুন" : "Reject Verification")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
