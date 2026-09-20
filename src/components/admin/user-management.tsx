import { useState, useEffect, useMemo } from "react";
import { UserCheck, ShieldAlert, AlertTriangle, Trash2, Coins, Plus, Minus, Key, Building, Cloud, CloudOff, FolderOpen, SlidersHorizontal, HardDrive, Database, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/ui/modal-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { adminApi } from "@/lib/api/admin";
import { marketingApi } from "@/lib/api/marketing";
import { datasetsApi } from "@/lib/api/datasets";
import { toast } from "sonner";
import { useLanguage } from "@/providers/language-provider";
import type { User, CloudStorageOverview, UserUploadedDataset } from "@/lib/types";

interface UserManagementProps {
  users: User[];
  onRefresh: () => void;
  onOpenWarningModal: (user: User) => void;
}

export function UserManagement({
  users,
  onRefresh,
  onOpenWarningModal,
}: UserManagementProps) {
  const { lang } = useLanguage();
  // Modal target states
  const [creditModalTarget, setCreditModalTarget] = useState<{ user: User; mode: "add" | "deduct" } | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>("50");
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);

  const [roleTarget, setRoleTarget] = useState<{ userId: number; role: string } | null>(null);
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Brevo credentials modal state
  const [brevoTarget, setBrevoTarget] = useState<User | null>(null);
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [dailyLimit, setDailyLimit] = useState<number>(300);
  const [brevoStatus, setBrevoStatus] = useState<string>("approved");
  const [isSubmittingBrevo, setIsSubmittingBrevo] = useState(false);

  // Cloud Sync toggle state
  const [isTogglingSync, setIsTogglingSync] = useState<number | null>(null);

  const handleToggleSync = async (user: User) => {
    const currentVal = user.allow_sync === 1;
    setIsTogglingSync(user.id);
    try {
      const res = await adminApi.setUserAllowSync(user.id, !currentVal);
      toast.success(res.data.message || `Cloud sync ${!currentVal ? "enabled" : "disabled"} for ${user.email}`);
      onRefresh();
    } catch {
      toast.error("Failed to update cloud sync permission.");
    } finally {
      setIsTogglingSync(null);
    }
  };

  // Cloud Storage Overview state
  const [storageOverview, setStorageOverview] = useState<CloudStorageOverview | null>(null);

  const loadStorageOverview = async () => {
    try {
      const res = await adminApi.getStorageOverview();
      setStorageOverview(res.data);
    } catch {
      // Ignore if not available
    }
  };

  useEffect(() => {
    loadStorageOverview();
  }, [users]);

  // Inspect User Datasets modal state
  const [inspectUserTarget, setInspectUserTarget] = useState<User | null>(null);
  const [userDatasets, setUserDatasets] = useState<UserUploadedDataset[]>([]);
  const [loadingUserDatasets, setLoadingUserDatasets] = useState(false);
  const [isDesyncingId, setIsDesyncingId] = useState<number | null>(null);

  const handleOpenUserDatasets = async (user: User) => {
    setInspectUserTarget(user);
    setLoadingUserDatasets(true);
    try {
      const res = await adminApi.getUserDatasets(user.id);
      setUserDatasets(res.data.datasets || []);
    } catch {
      toast.error("Failed to load user datasets.");
      setUserDatasets([]);
    } finally {
      setLoadingUserDatasets(false);
    }
  };

  const handleAdminDesync = async (datasetId: number) => {
    setIsDesyncingId(datasetId);
    try {
      const res = await datasetsApi.desync(datasetId);
      toast.success(res.data.message || "Dataset desynced from cloud successfully!");
      if (inspectUserTarget) {
        const resDs = await adminApi.getUserDatasets(inspectUserTarget.id);
        setUserDatasets(resDs.data.datasets || []);
      }
      onRefresh();
      loadStorageOverview();
    } catch {
      toast.error("Failed to desync dataset.");
    } finally {
      setIsDesyncingId(null);
    }
  };

  // User Upload Limit modal state
  const [limitModalTarget, setLimitModalTarget] = useState<User | null>(null);
  const [limitAmount, setLimitAmount] = useState<number>(5);
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  const handleOpenLimitModal = (user: User) => {
    setLimitModalTarget(user);
    setLimitAmount(user.max_sync_files ?? 5);
  };

  const confirmSetLimit = async () => {
    if (!limitModalTarget) return;
    setIsSavingLimit(true);
    try {
      const res = await adminApi.setUserUploadLimit(limitModalTarget.id, limitAmount);
      toast.success(res.data.message || `Upload limit set to ${limitAmount} datasets.`);
      setLimitModalTarget(null);
      onRefresh();
      loadStorageOverview();
    } catch {
      toast.error("Failed to update upload limit.");
    } finally {
      setIsSavingLimit(false);
    }
  };

  const handleOpenCreditModal = (user: User, mode: "add" | "deduct") => {
    setCreditModalTarget({ user, mode });
    setCreditAmount(mode === "add" ? "50" : "10");
  };

  const confirmAdjustCredits = async () => {
    if (!creditModalTarget) return;
    const parsed = parseInt(creditAmount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.warning("Please enter a valid positive credit number.");
      return;
    }

    const finalAmount = creditModalTarget.mode === "add" ? parsed : -parsed;
    setIsSubmittingCredit(true);

    try {
      await adminApi.addCredits(creditModalTarget.user.id, finalAmount);
      const actionText = creditModalTarget.mode === "add" ? `Added ${parsed} credits to` : `Deducted ${parsed} credits from`;
      toast.success(`${actionText} ${creditModalTarget.user.email}!`);
      setCreditModalTarget(null);
      onRefresh();
    } catch {
      toast.error("Failed to update user credit balance.");
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  const confirmRoleChange = async () => {
    if (!roleTarget) return;
    try {
      await adminApi.updateUserRole(roleTarget.userId, roleTarget.role);
      toast.success("Role updated successfully.");
      onRefresh();
    } catch {
      toast.error("Failed to update role.");
    } finally {
      setRoleTarget(null);
    }
  };

  const confirmBanToggle = async () => {
    if (!banTarget) return;
    const isBanning = banTarget.is_banned !== 1;
    try {
      await adminApi.banUser(banTarget.id, {
        is_banned: isBanning ? 1 : 0,
        warning_message: "Your account has been suspended for violating security policies.",
        ban_ip: true,
        ip_address: banTarget.ip_address || "",
      });
      toast.success(isBanning ? "User banned." : "User unbanned.");
      onRefresh();
    } catch {
      toast.error("Failed to update ban status.");
    } finally {
      setBanTarget(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminApi.deleteUser(deleteTarget.id);
      if (res.data.success) {
        toast.success("User permanently deleted.");
        onRefresh();
      }
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleOpenBrevoModal = (user: User) => {
    setBrevoTarget(user);
    setBrevoApiKey(user.brevo_api_key || `xkeysib-${Math.random().toString(36).substring(2, 12)}`);
    setDailyLimit(user.daily_email_limit || 300);
    setBrevoStatus(user.brevo_account_status || "approved");
  };

  const confirmBrevoConfig = async () => {
    if (!brevoTarget) return;
    setIsSubmittingBrevo(true);
    try {
      await marketingApi.updateUserBrevoConfig(brevoTarget.id, {
        api_key: brevoApiKey,
        daily_limit: Number(dailyLimit) || 300,
        account_status: brevoStatus,
      });
      toast.success(`Updated Brevo configuration for ${brevoTarget.email}!`);
      setBrevoTarget(null);
      onRefresh();
    } catch {
      toast.error("Failed to update Brevo configuration.");
    } finally {
      setIsSubmittingBrevo(false);
    }
  };

  const calcNewBalance = () => {
    if (!creditModalTarget) return 0;
    const current = creditModalTarget.user.credits || 0;
    const parsed = parseInt(creditAmount) || 0;
    if (creditModalTarget.mode === "add") return current + parsed;
    return Math.max(0, current - parsed);
  };

  // TanStack Table setup for Users
  const [userSorting, setUserSorting] = useState<SortingState>([]);

  const userColumns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "আইডি #" : "ID #"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "গ্রাহকের ইমেইল / নাম" : "Customer Email / Name"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span>{u.email}</span>
                {u.brevo_account_status === "email_verified" && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-cyan-500/40 text-cyan-400 font-mono"
                  >
                    {lang === "bn" ? "ইমেইল ভেরিফাইড" : "Email Verified"}
                  </Badge>
                )}
                {u.brevo_account_status === "approved" && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-emerald-500/40 text-emerald-400 font-mono"
                  >
                    {lang === "bn" ? "API সক্রিয়" : "API Active"}
                  </Badge>
                )}
                {u.brevo_account_status === "pending_email_verification" && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-amber-500/40 text-amber-400 font-mono"
                  >
                    {lang === "bn" ? "ইমেইল প্রেরিত" : "Brevo Email Sent"}
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {u.full_name}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: lang === "bn" ? "রোল" : "Role",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <Select
              value={u.role}
              onValueChange={(role) =>
                role && setRoleTarget({ userId: u.id, role })
              }
            >
              <SelectTrigger className="h-7 text-[11px] w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorKey: "credits",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "ক্রেডিট ব্যালেন্স" : "Credits Balance"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-amber-500">
            {row.original.credits} CR
          </span>
        ),
      },
      {
        id: "status",
        header: lang === "bn" ? "স্ট্যাটাস / ওয়ার্নিং" : "Status / Warning",
        cell: ({ row }) => {
          const u = row.original;
          return u.is_banned === 1 ? (
            <Badge variant="destructive" className="text-[10px]">
              {lang === "bn" ? "ব্যানড" : "BANNED"}
            </Badge>
          ) : u.warning_message ? (
            <Badge
              variant="outline"
              className="text-[10px] text-amber-500 border-amber-500/40"
            >
              {lang === "bn" ? "সতর্কবার্তা জারি" : "Warning Issued"}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] text-emerald-400 border-emerald-500/40"
            >
              {lang === "bn" ? "সক্রিয়" : "Active"}
            </Badge>
          );
        },
      },
      {
        id: "quota",
        header: () => (
          <div className="text-center">
            {lang === "bn" ? "প্ল্যান ও ক্লাউড কোটা" : "Plan & Cloud Quota"}
          </div>
        ),
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex flex-col items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[9px] uppercase tracking-wider font-mono font-bold ${
                  u.role === "admin" || u.role === "superadmin"
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : u.plan_tier === "enterprise"
                    ? "border-purple-500/40 text-purple-400 bg-purple-500/10"
                    : u.plan_tier === "pro"
                    ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                    : "border-border/60 text-muted-foreground bg-card/40"
                }`}
              >
                {u.role === "admin" || u.role === "superadmin"
                  ? "Admin"
                  : u.plan_tier === "enterprise"
                  ? "Enterprise"
                  : u.plan_tier === "pro"
                  ? "Pro Growth"
                  : "Starter"}
              </Badge>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isTogglingSync === u.id}
                  onClick={() => handleToggleSync(u)}
                  className={`h-6 text-[10px] px-2 gap-1 rounded-full transition-all ${
                    u.allow_sync === 1
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                      : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
                  }`}
                  title={
                    u.allow_sync === 1
                      ? "Custom Cloud Sync is Enabled. Click to disable."
                      : "Custom Cloud Sync is Disabled. Click to grant sync permission."
                  }
                >
                  {u.allow_sync === 1 ? (
                    <>
                      <Cloud className="h-3 w-3 text-emerald-400" />
                      <span>{lang === "bn" ? "অনুমোদিত" : "Allowed"}</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="h-3 w-3" />
                      <span>{lang === "bn" ? "বন্ধ" : "Off"}</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenLimitModal(u)}
                  className="h-6 text-[10px] px-1.5 font-mono border-border/50 hover:border-primary/50 text-muted-foreground hover:text-foreground gap-1"
                  title="Set user max upload/sync file limit"
                >
                  <SlidersHorizontal className="h-2.5 w-2.5" />
                  <span>
                    {u.synced_files_count ?? 0}/
                    {u.max_sync_files === 0
                      ? "∞"
                      : u.max_sync_files ?? 5}
                  </span>
                </Button>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleOpenUserDatasets(u)}
                className="h-5 text-[10px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-1.5 gap-1"
                title="Inspect cloud datasets uploaded by this user"
              >
                <FolderOpen className="h-3 w-3" />
                <span>
                  {lang === "bn"
                    ? `সিঙ্ককৃত ফাইল (${u.synced_files_count ?? 0})`
                    : `View Synced (${u.synced_files_count ?? 0})`}
                </span>
              </Button>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right">
            {lang === "bn"
              ? "অ্যাকশন (ক্রেডিট / ব্রেভো / নোটিশ / ব্যান)"
              : "Actions (Credits / Brevo API / Notice / Ban)"}
          </div>
        ),
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex justify-end items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenCreditModal(u, "add")}
                className="h-7 text-[11px] px-2 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 gap-1 font-bold"
                title="Add Credits (+)"
              >
                CR
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenBrevoModal(u)}
                className="h-7 text-[11px] px-2 text-purple-400 border-purple-500/40 hover:bg-purple-500/10 gap-1 font-mono"
                title="Brevo API Key & Daily Limits"
              >
                <Key className="h-3 w-3" /> Brevo
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenWarningModal(u)}
                className="h-7 text-[11px] px-2 text-purple-400 border-purple-500/40 hover:bg-purple-500/10 gap-1"
                title="Issue Notice Warning"
              >
                <AlertTriangle className="h-3 w-3" />{" "}
                {lang === "bn" ? "নোটিশ" : "Warning"}
              </Button>

              <Button
                size="sm"
                variant={u.is_banned === 1 ? "outline" : "destructive"}
                onClick={() => setBanTarget(u)}
                className="h-7 text-[11px] px-2 gap-1"
              >
                {u.is_banned === 1 ? (
                  <UserCheck className="h-3 w-3" />
                ) : (
                  <ShieldAlert className="h-3 w-3" />
                )}
                {u.is_banned === 1
                  ? lang === "bn"
                    ? "আনব্যান"
                    : "Unban"
                  : lang === "bn"
                  ? "ব্যান"
                  : "Ban"}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteTarget(u)}
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                title="Delete Account"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [isTogglingSync, lang, onOpenWarningModal]
  );

  const userTable = useReactTable({
    data: users,
    columns: userColumns,
    state: { sorting: userSorting },
    onSortingChange: setUserSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // TanStack Table setup for Inspect User Datasets Modal
  const [datasetSorting, setDatasetSorting] = useState<SortingState>([]);

  const datasetColumns = useMemo<ColumnDef<UserUploadedDataset>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "ডাটাবেসের নাম" : "Dataset Name"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="text-xs font-medium">
              <div className="truncate max-w-[200px]" title={d.name}>{d.name}</div>
              {d.file_path && (
                <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                  {d.file_path}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: lang === "bn" ? "ক্যাটাগরি" : "Category",
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.category || (lang === "bn" ? "স্ক্র্যাপড" : "Scraped")}
          </span>
        ),
      },
      {
        accessorKey: "row_count",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "রেকর্ড সংখ্যা" : "Records"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono">
            {row.original.row_count.toLocaleString()} {lang === "bn" ? "সারি" : "rows"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {lang === "bn" ? "আপলোডের তারিখ" : "Uploaded"}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right">
            {lang === "bn" ? "অ্যাকশন" : "Actions"}
          </div>
        ),
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="text-right">
              <Button
                size="sm"
                variant="destructive"
                disabled={isDesyncingId === d.id}
                onClick={() => handleAdminDesync(d.id)}
                className="h-7 text-[11px] px-2 gap-1"
                title="Desync from cloud (removes from Supabase bucket & cloud DB, keeps user local file)"
              >
                <CloudOff className="h-3 w-3" />
                {isDesyncingId === d.id
                  ? lang === "bn"
                    ? "ডিসিঙ্ক হচ্ছে..."
                    : "Desyncing..."
                  : lang === "bn"
                  ? "ডিসিঙ্ক"
                  : "Desync"}
              </Button>
            </div>
          );
        },
      },
    ],
    [isDesyncingId, lang]
  );

  const datasetTable = useReactTable({
    data: userDatasets,
    columns: datasetColumns,
    state: { sorting: datasetSorting },
    onSortingChange: setDatasetSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="glass-panel p-6">
      <CardContent className="p-0 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {lang === "bn"
                ? "গ্রাহক একাউন্ট ও ক্রেডিট ব্যালেন্স পরিচালনা"
                : "Customer Accounts & Credit Balances Management"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "ব্যবহারকারীর রোল, ব্যালেন্স, আপলোড লিমিট এবং ক্লাউড স্টোরেজ ডাটা পরিচালনা করুন।"
                : "Manage user roles, balances, upload limits, and inspect cloud storage datasets."}
            </p>
          </div>
        </div>

        {/* Cloud Storage Monitoring Summary Banner */}
        {storageOverview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg border border-border/50 bg-background/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {lang === "bn" ? "সুপাবেস বাকেট" : "Supabase Bucket"}
                </div>
                <div className="text-xs font-mono font-bold text-foreground truncate max-w-[130px]">
                  {storageOverview.bucket_name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {lang === "bn" ? "মোট ক্লাউড ডাটাবেস" : "Total Cloud Datasets"}
                </div>
                <div className="text-xs font-mono font-bold text-purple-400">
                  {storageOverview.total_cloud_datasets}{" "}
                  {lang === "bn" ? "টি ফাইল" : "files"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {lang === "bn" ? "মোট সিঙ্ককৃত সারি" : "Total Synced Rows"}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {storageOverview.total_cloud_rows.toLocaleString()}{" "}
                  {lang === "bn" ? "টি রেকর্ড" : "records"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md border ${
                  storageOverview.supabase_configured
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {lang === "bn" ? "ক্লাউড স্ট্যাটাস" : "Cloud Status"}
                </div>
                <div className="text-xs font-medium text-foreground">
                  {storageOverview.supabase_configured
                    ? lang === "bn"
                      ? "স্টোরেজ সংযুক্ত"
                      : "Storage Connected"
                    : lang === "bn"
                    ? "শুধুমাত্র লোকাল"
                    : "Local Only"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border/40 overflow-hidden bg-background/50">
          <Table>
            <TableHeader>
              {userTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-border/40 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold py-2.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {userTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-border/20 hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dedicated Credit Add / Deduct Modal */}
      <Dialog
        open={!!creditModalTarget}
        onOpenChange={(v) => !v && setCreditModalTarget(null)}
      >
        <DialogContent className="glass-panel border-border/40 sm:max-w-md p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              <span>
                {creditModalTarget?.mode === "add"
                  ? lang === "bn"
                    ? "ব্যবহারকারীর ক্রেডিট যোগ (+)"
                    : "Add Usage Credits (+)"
                  : lang === "bn"
                  ? "ব্যবহারকারীর ক্রেডিট কর্তন (-)"
                  : "Deduct Usage Credits (-)"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lang === "bn" ? "নির্দিষ্ট গ্রাহক: " : "Target Customer: "}
              <span className="text-foreground font-semibold">
                {creditModalTarget?.user.email}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher */}
          <div className="flex bg-muted/40 p-1 rounded-lg gap-1 border border-border/40 my-2">
            <button
              type="button"
              onClick={() =>
                setCreditModalTarget((prev) =>
                  prev ? { ...prev, mode: "add" } : null
                )
              }
              className={`flex-1 text-xs py-1.5 font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                creditModalTarget?.mode === "add"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />{" "}
              {lang === "bn" ? "ক্রেডিট যোগ (+)" : "Add Credits (+)"}
            </button>

            <button
              type="button"
              onClick={() =>
                setCreditModalTarget((prev) =>
                  prev ? { ...prev, mode: "deduct" } : null
                )
              }
              className={`flex-1 text-xs py-1.5 font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                creditModalTarget?.mode === "deduct"
                  ? "bg-rose-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Minus className="h-3.5 w-3.5" />{" "}
              {lang === "bn" ? "ক্রেডিট কর্তন (-)" : "Deduct Credits (-)"}
            </button>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "ক্রেডিটের পরিমাণ *" : "Credit Amount *"}
              </Label>
              <Input
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder={
                  lang === "bn" ? "ক্রেডিট পরিমাণ লিখুন..." : "Enter credit amount..."
                }
                className="text-xs h-9 font-mono"
              />
            </div>

            {/* Live Balance Preview Box */}
            <div className="p-3 rounded-lg border border-border/40 bg-black/40 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {lang === "bn" ? "বর্তমান ব্যালেন্স:" : "Current Balance:"}
                </span>
                <span className="font-bold text-foreground">
                  {creditModalTarget?.user.credits || 0} CR
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {lang === "bn"
                    ? `সমন্বয় (${creditModalTarget?.mode === "add" ? "+" : "-"}):`
                    : `Adjustment (${creditModalTarget?.mode === "add" ? "+" : "-"}):`}
                </span>
                <span
                  className={
                    creditModalTarget?.mode === "add"
                      ? "text-emerald-400 font-bold"
                      : "text-rose-400 font-bold"
                  }
                >
                  {creditModalTarget?.mode === "add" ? "+" : "-"}
                  {parseInt(creditAmount) || 0} CR
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40 text-foreground font-bold">
                <span>
                  {lang === "bn" ? "নতুন ব্যালেন্স:" : "New Balance:"}
                </span>
                <span className="text-amber-400">{calcNewBalance()} CR</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreditModalTarget(null)}
              className="text-xs"
            >
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              size="sm"
              disabled={isSubmittingCredit}
              onClick={confirmAdjustCredits}
              className={`text-xs font-bold text-white ${
                creditModalTarget?.mode === "add"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              {isSubmittingCredit
                ? lang === "bn"
                  ? "আপডেট হচ্ছে..."
                  : "Updating..."
                : creditModalTarget?.mode === "add"
                ? lang === "bn"
                  ? "ক্রেডিট যোগ নিশ্চিত করুন"
                  : "Confirm Add Credits"
                : lang === "bn"
                ? "ক্রেডিট কর্তন নিশ্চিত করুন"
                : "Confirm Deduct Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirm Modal */}
      <ConfirmModal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        onConfirm={confirmRoleChange}
        title={
          lang === "bn" ? "ব্যবহারকারীর রোল পরিবর্তন" : "Change User Role"
        }
        description={
          lang === "bn"
            ? `আপনি কি নিশ্চিতভাবে এই ব্যবহারকারীর রোল "${roleTarget?.role?.toUpperCase()}"-এ পরিবর্তন করতে চান?`
            : `Are you sure you want to update this user's permission role to "${roleTarget?.role?.toUpperCase()}"?`
        }
        confirmText={
          lang === "bn" ? "রোল পরিবর্তন করুন" : "Update Role"
        }
      />

      {/* Ban / Unban Confirm Modal */}
      <ConfirmModal
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={confirmBanToggle}
        title={
          banTarget?.is_banned === 1
            ? lang === "bn"
              ? "গ্রাহক একাউন্ট আনব্যান করুন"
              : "Unban Customer Account"
            : lang === "bn"
            ? "গ্রাহক একাউন্ট ব্যান করুন"
            : "Ban Customer Account"
        }
        description={
          lang === "bn"
            ? `আপনি কি নিশ্চিতভাবে ব্যবহারকারী #${banTarget?.id} (${banTarget?.email}) কে ${
                banTarget?.is_banned === 1 ? "আনব্যান" : "ব্যান"
              } করতে চান?`
            : `Are you sure you want to ${
                banTarget?.is_banned === 1 ? "UNBAN" : "BAN"
              } user #${banTarget?.id} (${banTarget?.email})?`
        }
        confirmText={
          banTarget?.is_banned === 1
            ? lang === "bn"
              ? "একাউন্ট আনব্যান করুন"
              : "Unban Account"
            : lang === "bn"
            ? "একাউন্ট ব্যান করুন"
            : "Ban Account"
        }
        isDanger={banTarget?.is_banned !== 1}
      />

      {/* Delete User Confirm Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
        title={
          lang === "bn"
            ? `ব্যবহারকারী #${deleteTarget?.id} স্থায়ীভাবে মুছবেন?`
            : `Permanently Delete User #${deleteTarget?.id}?`
        }
        description={
          lang === "bn"
            ? `এর ফলে ডাটাবেস থেকে ${deleteTarget?.email} একাউন্টটি স্থায়ীভাবে মুছে যাবে। এটি আর ফিরিয়ে আনা সম্ভব নয়।`
            : `This will permanently unregister and delete account ${deleteTarget?.email} from the database. This action CANNOT be undone.`
        }
        confirmText={
          lang === "bn" ? "একাউন্ট মুছে ফেলুন" : "Delete Account"
        }
        isDanger
      />

      {/* Brevo Config Modal */}
      <Dialog open={!!brevoTarget} onOpenChange={(open) => !open && setBrevoTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <Key className="h-5 w-5" />{" "}
              {lang === "bn"
                ? `ব্রেভো এপিআই ও লিমিট (${brevoTarget?.email})`
                : `Brevo API Key & Limits (${brevoTarget?.email})`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "এই গ্রাহকের ব্রেভো এপিআই কি, দৈনিক ইমেইল প্রেরণের সীমা ও অনুমোদন স্থিতি নির্ধারণ করুন।"
                : "Manually assign or edit this customer's Brevo API Key, daily dispatch limits, and verification status."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "ব্রেভো এপিআই কি *" : "Brevo API Key *"}
              </Label>
              <Input
                placeholder="xkeysib-..."
                value={brevoApiKey}
                onChange={(e) => setBrevoApiKey(e.target.value)}
                className="text-xs font-mono h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {lang === "bn"
                  ? "দৈনিক ইমেইল প্রেরণের সর্বোচ্চ সীমা *"
                  : "Daily Email Dispatch Limit *"}
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
                  ? "প্রতি ২৪ ঘণ্টায় সর্বোচ্চ প্রেরণের অনুমতি (ডিফল্ট: ৩০০)।"
                  : "Maximum emails allowed per 24-hour cycle (default: 300)."}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {lang === "bn" ? "ভেরিফিকেশন স্ট্যাটাস" : "Verification Status"}
              </Label>
              <Select value={brevoStatus} onValueChange={(val) => val && setBrevoStatus(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    {lang === "bn" ? "অনুমোদিত ও সক্রিয়" : "Approved & Active"}
                  </SelectItem>
                  <SelectItem value="email_verified">
                    {lang === "bn" ? "ইমেইল ভেরিফাইড (API এর জন্য প্রস্তুত)" : "Email Verified (Ready for API Key)"}
                  </SelectItem>
                  <SelectItem value="pending_email_verification">
                    {lang === "bn" ? "গ্রাহক কনফার্মেশনের অপেক্ষায়" : "Awaiting Customer Brevo Email"}
                  </SelectItem>
                  <SelectItem value="pending">
                    {lang === "bn" ? "পর্যালোচনা অপেক্ষমান" : "Application Pending Review"}
                  </SelectItem>
                  <SelectItem value="rejected">
                    {lang === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}
                  </SelectItem>
                  <SelectItem value="none">
                    {lang === "bn" ? "নেই / আনভেরিফাইড" : "None / Unverified"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button variant="ghost" onClick={() => setBrevoTarget(null)} className="text-xs h-8">
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              onClick={confirmBrevoConfig}
              disabled={isSubmittingBrevo}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8"
            >
              {isSubmittingBrevo
                ? lang === "bn"
                  ? "সংরক্ষণ হচ্ছে..."
                  : "Saving Config..."
                : lang === "bn"
                ? "ব্রেভো তথ্য সংরক্ষণ করুন"
                : "Save Brevo Credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspect User Datasets Dialog */}
      <Dialog open={!!inspectUserTarget} onOpenChange={(open) => !open && setInspectUserTarget(null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border/50 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400">
              <FolderOpen className="h-5 w-5" />{" "}
              {lang === "bn"
                ? `ক্লাউড ডাটাবেস (${inspectUserTarget?.email})`
                : `Cloud Datasets (${inspectUserTarget?.email})`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "সুপাবেস ক্লাউডে আপলোড ও সিঙ্ককৃত ডাটাবেস। ক্লাউড থেকে ডিসিঙ্ক করলে লোকাল ফাইল অক্ষত রেখে শুধুমাত্র ক্লাউড ডাটা মুছে যাবে।"
                : "Datasets uploaded to Supabase Storage and synced by this user. You can desync any dataset to remove it from the cloud while preserving the user's local file."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-2">
            {loadingUserDatasets ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {lang === "bn" ? "ডাটাবেস লোড হচ্ছে..." : "Loading datasets..."}
              </div>
            ) : userDatasets.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {lang === "bn"
                  ? "এই ব্যবহারকারী ক্লাউডে কোনো ডাটাবেস আপলোড করেননি।"
                  : "No datasets uploaded to cloud by this user yet."}
              </div>
            ) : (
              <div className="rounded-md border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    {datasetTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="border-b border-border/40 hover:bg-transparent">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="text-xs font-semibold py-2.5">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {datasetTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="border-b border-border/20 hover:bg-muted/30">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border/30">
            <Button variant="ghost" onClick={() => setInspectUserTarget(null)} className="text-xs h-8">
              {lang === "bn" ? "বন্ধ করুন" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Upload Limit Dialog */}
      <Dialog open={!!limitModalTarget} onOpenChange={(open) => !open && setLimitModalTarget(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="h-5 w-5 text-primary" />{" "}
              {lang === "bn"
                ? `সর্বোচ্চ আপলোড লিমিট (${limitModalTarget?.email})`
                : `Set Max Upload Limit (${limitModalTarget?.email})`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "ক্লাউড স্টোরেজে এই ব্যবহারকারী সর্বোচ্চ কতটি ডাটাবেস একসাথে সংরক্ষণ করতে পারবেন তা নির্ধারণ করুন।"
                : "Define the maximum number of datasets this user can store simultaneously in Supabase Storage cloud."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {lang === "bn"
                  ? "সর্বোচ্চ ক্লাউড ফাইল সীমা"
                  : "Maximum Cloud Datasets Limit"}
              </Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={limitAmount}
                onChange={(e) => setLimitAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-xs h-9 font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                {lang === "bn" ? (
                  <>
                    আনলিমিটেড করতে <strong className="text-foreground">0</strong> দিন। ডিফল্ট ৫টি।
                  </>
                ) : (
                  <>
                    Enter <strong className="text-foreground">0</strong> for unlimited uploads. Default is 5 datasets.
                  </>
                )}
              </p>
            </div>

            <div className="rounded-md p-2.5 bg-muted/40 border border-border/40 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === "bn" ? "বর্তমান সিঙ্ককৃত ফাইল:" : "Current Synced Files:"}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {limitModalTarget?.synced_files_count ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === "bn" ? "বর্তমান সীমা:" : "Current Limit:"}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {limitModalTarget?.max_sync_files === 0
                    ? lang === "bn"
                      ? "আনলিমিটেড"
                      : "Unlimited"
                    : (limitModalTarget?.max_sync_files ?? 5)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/30">
            <Button variant="ghost" onClick={() => setLimitModalTarget(null)} className="text-xs h-8">
              {lang === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button
              onClick={confirmSetLimit}
              disabled={isSavingLimit}
              className="font-bold text-xs h-8"
            >
              {isSavingLimit
                ? lang === "bn"
                  ? "সংরক্ষণ হচ্ছে..."
                  : "Saving..."
                : lang === "bn"
                ? "আপলোড লিমিট পরিবর্তন করুন"
                : "Update Upload Limit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
