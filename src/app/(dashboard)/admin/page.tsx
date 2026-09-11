"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Upload, Inbox, Coins, LayoutDashboard, Building, Key, MoreHorizontal, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { DatasetUploadForm } from "@/components/admin/dataset-upload-form";
import { PromotionRequests } from "@/components/admin/promotion-requests";
import { PaymentVerification } from "@/components/admin/payment-verification";
import { GatewaySettings } from "@/components/admin/gateway-settings";
import { BrevoApplicationsList } from "@/components/admin/brevo-applications";
import { LicenseManagement } from "@/components/admin/license-management";
import { adminApi } from "@/lib/api/admin";
import { configApi } from "@/lib/api/config";
import { useLanguage } from "@/providers/language-provider";
import type {
  RegionsConfig,
  PromotionRequest,
  PaymentRequest,
  DatasetRequest,
} from "@/lib/types";

import { useSearchParams } from "next/navigation";
import { PackageSettings } from "@/components/admin/package-settings";

interface AdminPageProps {
  initialTab?: string;
}

export default function AdminPage({ initialTab = "dashboard" }: AdminPageProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const queryTab = searchParams ? searchParams.get("tab") : null;
  const at = (t as any).admin || {};

  const [activeTab, setActiveTab] = useState(queryTab || initialTab);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [regionsConfig, setRegionsConfig] = useState<RegionsConfig | null>(null);

  const [promotions, setPromotions] = useState<PromotionRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [datasetRequests, setDatasetRequests] = useState<DatasetRequest[]>([]);

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [queryTab, initialTab]);

  useEffect(() => {
    configApi.regions().then((r) => {
      setCategoriesList(r.data.categories);
      setRegionsConfig(r.data.regions);
    }).catch(() => {});
  }, []);

  const loadData = useCallback(() => {
    adminApi.listPromotionRequests().then((r) => setPromotions(r.data)).catch(() => {});
    adminApi.listPaymentRequests().then((r) => setPayments(r.data)).catch(() => {});
    adminApi.listDatasetRequests().then((r) => setDatasetRequests(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const pendingRequests = datasetRequests.filter((r) => r.status === "pending").length;

  const moreTabs = [
    { id: "promotions", label: at.tabPromotions || "Catalog Promotions", count: promotions.length, icon: Settings, color: "text-purple-400" },
    { id: "requests", label: at.tabRequests || "Dataset Requests", count: pendingRequests, icon: Inbox, color: "text-emerald-400" },
    { id: "brevo", label: "Brevo Verifications", icon: Building, color: "text-purple-400" },
    { id: "gateway", label: at.tabGateway || "Gateway Settings", icon: Settings, color: "text-muted-foreground" },
  ];

  const activeMoreTab = moreTabs.find((t) => t.id === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{at.title || "Admin Overview & Control Center"}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {at.subtitle || "Manage dataset uploads, promotion approvals, customer payments, package settings, and gateway configurations"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/60 border border-border/40 p-1 flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto h-auto justify-start flex-nowrap">
          <TabsTrigger value="dashboard" className="gap-2 text-xs font-semibold shrink-0">
            <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-2 text-xs font-semibold shrink-0">
            <Coins className="h-4 w-4 text-amber-500" /> Package Settings
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 text-xs font-semibold shrink-0">
            <Coins className="h-4 w-4 text-amber-500" /> {at.tabPayments || "Payment Verification"} ({pendingPayments})
          </TabsTrigger>
          <TabsTrigger value="licenses" className="gap-2 text-xs font-semibold shrink-0">
            <Key className="h-4 w-4 text-primary" /> Desktop Licenses
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 text-xs font-semibold shrink-0">
            <Upload className="h-4 w-4 text-cyan-400" /> {at.tabUpload || "Upload Dataset"}
          </TabsTrigger>

          {/* Three-Dot / More Modules Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 border cursor-pointer outline-none ${
                activeMoreTab
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
              }`}
            >
              {activeMoreTab ? (
                <>
                  <activeMoreTab.icon className="h-3.5 w-3.5" />
                  <span>{activeMoreTab.label}</span>
                </>
              ) : (
                <>
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More Modules</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border/60 shadow-xl p-1.5 space-y-1 z-50">
              {moreTabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary font-bold"
                        : "hover:bg-accent/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${tab.color}`} />
                      <span>{tab.label}</span>
                    </div>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-muted font-mono font-bold text-muted-foreground">
                        {tab.count}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsList>

        {/* TAB 0: DASHBOARD */}
        <TabsContent value="dashboard" className="pt-4">
          <AdminDashboard />
        </TabsContent>

        {/* TAB 1: PACKAGE SETTINGS */}
        <TabsContent value="packages" className="pt-4">
          <PackageSettings />
        </TabsContent>

        {/* TAB 1: UPLOAD */}
        <TabsContent value="upload" className="pt-4">
          <DatasetUploadForm
            categoriesList={categoriesList}
            regionsConfig={regionsConfig}
            onSuccess={loadData}
          />
        </TabsContent>

        {/* TAB 2: PROMOTIONS */}
        <TabsContent value="promotions" className="pt-4">
          <PromotionRequests requests={promotions} onRefresh={loadData} />
        </TabsContent>

        {/* TAB 3: PAYMENTS */}
        <TabsContent value="payments" className="pt-4">
          <PaymentVerification requests={payments} onRefresh={loadData} />
        </TabsContent>

        {/* TAB 4: LICENSES */}
        <TabsContent value="licenses" className="pt-4">
          <LicenseManagement />
        </TabsContent>

        {/* TAB 5: BREVO VERIFICATIONS */}
        <TabsContent value="brevo" className="pt-4">
          <BrevoApplicationsList />
        </TabsContent>

        {/* TAB 5: REQUESTS */}
        <TabsContent value="requests" className="pt-4 space-y-4">
          <div className="rounded-lg border border-border/40 overflow-hidden bg-card/60 p-4">
            <h3 className="text-sm font-bold mb-3">{at.tabRequests || "Custom Dataset Requests List"}</h3>
            <div className="space-y-3">
              {datasetRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg border border-border/30 bg-background/50 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-foreground">{req.category_query}</div>
                    <div className="text-muted-foreground">User: {req.user_email} | Phone: {req.phone}</div>
                  </div>
                  <span className="font-mono uppercase text-amber-500 font-bold">{req.status}</span>
                </div>
              ))}
            </div>
          </div>
          <BrevoApplicationsList />
        </TabsContent>

        {/* TAB 5: GATEWAY */}
        <TabsContent value="gateway" className="pt-4">
          <GatewaySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
