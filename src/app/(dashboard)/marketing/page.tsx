"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Mail, BarChart3, History, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/marketing/dashboard-stats";
import { WhatsAppPanel } from "@/components/marketing/whatsapp-panel";
import { EmailBuilder } from "@/components/marketing/email-builder";
import { CampaignHistory } from "@/components/marketing/campaign-history";
import { LogViewer } from "@/components/marketing/log-viewer";
import { ContactSelectorModal } from "@/components/marketing/contact-selector-modal";
import { marketingApi } from "@/lib/api/marketing";
import { datasetsApi } from "@/lib/api/datasets";
import type { DashboardStats as StatsType, Dataset, RecipientContact } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";

import { useSearchParams } from "next/navigation";

export default function MarketingPage() {
  const { t, lang } = useLanguage();
  const m = t.marketing || {};
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const groupParam = searchParams.get("group");

  const [activeTab, setActiveTab] = useState(tabParam || "dashboard");
  const [stats, setStats] = useState<StatsType | null>(null);
  const [recipientGroups, setRecipientGroups] = useState<Dataset[]>([]);

  // Contact selector modal state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeGroupVal, setActiveGroupVal] = useState(groupParam || "");
  const [groupContacts, setGroupContacts] = useState<RecipientContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());

  const loadStats = useCallback(() => {
    marketingApi
      .dashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => { });
  }, []);

  const loadRecipientGroups = useCallback(() => {
    datasetsApi
      .list()
      .then((res) => setRecipientGroups(res.data))
      .catch(() => { });
  }, []);

  const loadContactsForGroup = useCallback(async (groupVal: string) => {
    setActiveGroupVal(groupVal);
    if (!groupVal) {
      setGroupContacts([]);
      setSelectedContactIds(new Set());
      return;
    }
    try {
      const res = await marketingApi.recipientContacts(groupVal);
      if (res.data && res.data.contacts) {
        setGroupContacts(res.data.contacts);
        setSelectedContactIds(new Set(res.data.contacts.map((c) => c.id)));
      }
    } catch {
      setGroupContacts([]);
      setSelectedContactIds(new Set());
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadRecipientGroups();
    if (groupParam) {
      loadContactsForGroup(groupParam);
    }
  }, [loadStats, loadRecipientGroups, groupParam, loadContactsForGroup]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          {m.title || (lang === "bn" ? "মাল্টি-চ্যানেল মার্কেটিং অটোমেশন" : "Multi-Channel Marketing Automation")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {m.subtitle || (lang === "bn" ? "আপনার ভেরিফাইড লিডগুলোতে অ্যান্টি-ব্যান হোয়াটসঅ্যাপ ক্যাম্পেইন এবং এইচটিএমএল ইমেইল প্রচার করুন" : "Power anti-ban WhatsApp campaigns and HTML email template dispatches to your verified leads")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/60 border border-border/40 p-1 flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto h-auto justify-start flex-nowrap">
          <TabsTrigger value="dashboard" className="gap-2 text-xs font-semibold shrink-0">
            <BarChart3 className="h-4 w-4 text-cyan-400" /> 
            {m.tabDashboard || (lang === "bn" ? "ড্যাশবোর্ড ওভারভিউ" : "Dashboard Overview")}
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2 text-xs font-semibold shrink-0">
            <Send className="h-4 w-4 text-emerald-400" /> 
            {m.tabWhatsapp || (lang === "bn" ? "হোয়াটসঅ্যাপ ক্যাম্পেইন" : "WhatsApp Campaign")}
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2 text-xs font-semibold shrink-0">
            <Mail className="h-4 w-4 text-purple-400" /> 
            {m.tabEmail || (lang === "bn" ? "ইমেইল ক্যাম্পেইন" : "Email Campaign")}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs font-semibold shrink-0">
            <History className="h-4 w-4 text-amber-500" /> 
            {m.tabHistory || (lang === "bn" ? "ক্যাম্পেইন হিস্ট্রি" : "Campaign History")}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2 text-xs font-semibold shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" /> 
            {m.tabLogs || (lang === "bn" ? "দৈনিক সিস্টেম লগ" : "Daily System Logs")}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <DashboardStats stats={stats} />
          <CampaignHistory campaigns={stats?.campaigns || []} onRefresh={loadStats} />
        </TabsContent>

        {/* TAB 2: WHATSAPP */}
        <TabsContent value="whatsapp" className="space-y-6 pt-4">
          <WhatsAppPanel
            recipientGroups={recipientGroups}
            onOpenSelector={() => setSelectorOpen(true)}
            selectedContactsCount={selectedContactIds.size}
            totalContactsCount={groupContacts.length}
            groupContacts={groupContacts}
            selectedContactIds={selectedContactIds}
            onSelectGroup={loadContactsForGroup}
            initialGroup={groupParam || undefined}
          />
        </TabsContent>

        {/* TAB 3: EMAIL */}
        <TabsContent value="email" className="space-y-6 pt-4">
          <EmailBuilder
            recipientGroups={recipientGroups}
            onOpenSelector={() => setSelectorOpen(true)}
            selectedContactsCount={selectedContactIds.size}
            totalContactsCount={groupContacts.length}
            groupContacts={groupContacts}
            selectedContactIds={selectedContactIds}
            onSelectGroup={loadContactsForGroup}
          />
        </TabsContent>

        {/* TAB 4: HISTORY */}
        <TabsContent value="history" className="space-y-6 pt-4">
          <CampaignHistory campaigns={stats?.campaigns || []} onRefresh={loadStats} />
        </TabsContent>

        {/* TAB 5: LOGS */}
        <TabsContent value="logs" className="space-y-6 pt-4">
          <LogViewer />
        </TabsContent>
      </Tabs>

      {/* Contact Selector Modal */}
      <ContactSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        contacts={groupContacts}
        selectedIds={selectedContactIds}
        onSelectionChange={setSelectedContactIds}
      />
    </div>
  );
}
