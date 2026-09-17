"use client";

import { useState, useEffect, useCallback } from "react";
import { UserManagement } from "@/components/admin/user-management";
import { WarningModal } from "@/components/admin/warning-modal";
import { adminApi } from "@/lib/api/admin";
import { useLanguage } from "@/providers/language-provider";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const { t, lang } = useLanguage();
  const ut = t.users || {};
  const [users, setUsers] = useState<User[]>([]);
  const [warningTarget, setWarningTarget] = useState<User | null>(null);

  const loadUsers = useCallback(() => {
    adminApi
      .listUsers()
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          {lang === "bn"
            ? "গ্রাহক একাউন্ট ও ক্রেডিট ম্যানেজমেন্ট"
            : (ut.title || "Customer Accounts & Credits")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === "bn"
            ? "ব্যবহারকারীর অনুমতি, ক্রেডিট ব্যালেন্স বরাদ্দ, সতর্কবার্তা প্রদান এবং ব্যান স্ট্যাটাস নিয়ন্ত্রণ করুন"
            : (ut.subtitle || "Manage user permissions, assign credit balances, issue dashboard warning notices, and enforce ban status")}
        </p>
      </div>

      <UserManagement
        users={users}
        onRefresh={loadUsers}
        onOpenWarningModal={(u) => setWarningTarget(u)}
      />

      <WarningModal
        targetUser={warningTarget}
        onClose={() => setWarningTarget(null)}
        onSuccess={loadUsers}
      />
    </div>
  );
}
