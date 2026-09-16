import { Check, X, Globe, Database, ShieldAlert } from "lucide-react";
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
import type { PromotionRequest } from "@/lib/types";

interface PromotionRequestsProps {
  requests: PromotionRequest[];
  onRefresh: () => void;
}

export function PromotionRequests({ requests, onRefresh }: PromotionRequestsProps) {
  const handleApprove = async (id: number) => {
    try {
      const res = await adminApi.approvePromotion(id);
      toast.success(res.data.message || "Promotion approved and published to PostgreSQL public catalog!");
      onRefresh();
    } catch {
      toast.error("Failed to approve promotion.");
    }
  };

  const handleReject = async (id: number, title: string) => {
    if (!confirm(`Reject "${title}"? This dataset will be permanently removed from PostgreSQL cloud database and will remain usable only in the customer's local database.`)) {
      return;
    }
    try {
      const res = await adminApi.rejectPromotion(id);
      toast.info(res.data.message || "Promotion request rejected. Dataset removed from PostgreSQL and preserved in local DB.");
      onRefresh();
    } catch {
      toast.error("Failed to reject promotion.");
    }
  };

  return (
    <Card className="glass-panel p-6">
      <CardContent className="p-0 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-foreground">Dataset Promotion Requests to Public Catalog</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Approved datasets become public in PostgreSQL. Rejected datasets are removed from PostgreSQL and stay local on the customer PC.
            </p>
          </div>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-500/10 gap-1 text-[11px] font-mono">
            <Database className="h-3 w-3" /> PostgreSQL Cloud Queue: {requests.length}
          </Badge>
        </div>

        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID #</TableHead>
                <TableHead>Customer Email</TableHead>
                <TableHead>Proposed Dataset Title</TableHead>
                <TableHead>Category / Location</TableHead>
                <TableHead className="w-24">Leads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions (PostgreSQL)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const targetId = r.id;
                const title = r.name || (r as any).proposed_name || (r as any).query || `Dataset #${targetId}`;
                const category = r.category || (r as any).proposed_category || "Scraped Leads";
                const status = (r.status || (r as any).promotion_status || "pending").toLowerCase();
                const location = [r.area, r.district, r.division].filter(Boolean).join(", ") || "Bangladesh";

                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{targetId}</TableCell>
                    <TableCell className="text-xs font-semibold">
                      <div>{r.user_email}</div>
                      {r.user_name && <div className="text-[10px] text-muted-foreground">{r.user_name}</div>}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>{title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">{category}</div>
                      <div className="text-[10px] text-muted-foreground">{location}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-emerald-400 font-bold">
                      {r.row_count || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                        {status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(targetId)}
                            className="h-7 text-xs bg-emerald-500 text-black hover:bg-emerald-600 font-bold gap-1"
                            title="Approve and publish to PostgreSQL Public Catalog"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve & Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(targetId, title)}
                            className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 gap-1"
                            title="Reject and delete from PostgreSQL (remains only in user's local DB)"
                          >
                            <X className="h-3.5 w-3.5" /> Reject (Remove from Cloud)
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                    No pending dataset promotion requests.
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
