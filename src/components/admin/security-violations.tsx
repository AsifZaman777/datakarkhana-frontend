"use client";

import { Shield, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useLanguage } from "@/providers/language-provider";
import type { SecurityViolation } from "@/lib/types";

interface SecurityViolationsProps {
  violations: SecurityViolation[];
  onRefresh: () => void;
}

export function SecurityViolations({ violations, onRefresh }: SecurityViolationsProps) {
  const { lang } = useLanguage();

  const handleSeed = async () => {
    try {
      await adminApi.seedTestViolations();
      toast.success(
        lang === "bn"
          ? "নমুনা সিকিউরিটি ভায়োলেশন লগ সফলভাবে যুক্ত হয়েছে।"
          : "Sample security violation logs inserted."
      );
      onRefresh();
    } catch {
      toast.error(
        lang === "bn"
          ? "টেস্ট লগ তৈরি করতে ব্যর্থ হয়েছে।"
          : "Failed to seed test logs."
      );
    }
  };

  return (
    <Card className="glass-panel p-6 border-destructive/30">
      <CardContent className="p-0 space-y-4">
        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <h3 className="text-sm font-bold text-foreground">
              {lang === "bn"
                ? "অ্যান্টি-লিক ও সিকিউরিটি সেন্সর লঙ্ঘন লগ"
                : "Anti-Leak & Security Sensor Violation Logs"}
            </h3>
          </div>

          <Button size="sm" variant="outline" onClick={handleSeed} className="gap-1 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />{" "}
            {lang === "bn" ? "টেস্ট লগ তৈরি করুন" : "Seed Test Logs"}
          </Button>
        </div>

        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{lang === "bn" ? "লগ #" : "Log #"}</TableHead>
                <TableHead>{lang === "bn" ? "ব্যবহারকারীর ইমেইল / আইডি" : "User Email / ID"}</TableHead>
                <TableHead>{lang === "bn" ? "লঙ্ঘনের ধরণ" : "Intercepted Violation Type"}</TableHead>
                <TableHead>{lang === "bn" ? "আইপি ঠিকানা" : "IP Address"}</TableHead>
                <TableHead>{lang === "bn" ? "সময়" : "Timestamp"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{v.id}</TableCell>
                  <TableCell className="text-xs font-semibold">{v.user_email || `User #${v.user_id || "Guest"}`}</TableCell>
                  <TableCell className="text-xs font-bold text-destructive">
                    <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px]">
                      {v.violation_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-cyan-400">{v.ip_address || "127.0.0.1"}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{v.timestamp}</TableCell>
                </TableRow>
              ))}

              {violations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground">
                    {lang === "bn" ? "এখনো কোনো সিকিউরিটি লঙ্ঘন পাওয়া যায়নি।" : "No security violations logged yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
