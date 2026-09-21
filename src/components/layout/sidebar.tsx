"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Database,
  Search,
  Send,
  Zap,
  Settings,
  Inbox,
  Coins,
  User,
  Shield,
  LogOut,
  Globe,
  ChevronDown,
  ChevronRight,
  Users,
  CreditCard,
  Lock,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  BookOpen,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/providers/auth-provider";
import { useLanguage } from "@/providers/language-provider";
import { APP_NAME } from "@/lib/constants";
import { ConnectionStatusDots } from "@/components/shared/connection-status-dots";
import { TourButton } from "@/components/tour/tour-button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onOpenPaymentModal?: () => void;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  isDanger?: boolean;
};

type NavGroup = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: NavItem[];
};

// ─── Sidebar inner content (shared between desktop + mobile) ──────
function SidebarInner({
  collapsed,
  onClose,
  onOpenPaymentModal,
}: {
  collapsed: boolean;
  onClose?: () => void;
  onOpenPaymentModal?: () => void;
}) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const st = t.sidebar || {};
  const isSuperadmin = user?.role === "superadmin";

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    admin: true,
    customers: true,
    datasets: true,
    "data-collection": true,
    marketing: true,
    payment: false,
    security: false,
    tutorial: true,
    main: true,
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Admin grouped nav ──
  const adminGroups: (NavGroup & { key: string })[] = [
    {
      key: "admin",
      title: st.adminHeader || (lang === "bn" ? "অ্যাডমিনিস্ট্রেশন" : "Administration"),
      icon: Settings,
      color: "text-cyan-400",
      items: [
        { label: st.adminDashboard || (lang === "bn" ? "এডমিন ড্যাশবোর্ড" : "Admin Dashboard"), href: "/admin", icon: LayoutDashboard },
        { label: st.packageSettings || (lang === "bn" ? "প্যাকেজ সেটিংস" : "Package Settings"), href: "/admin/packages", icon: Coins, iconColor: "text-amber-500" },
        { label: st.requests || (lang === "bn" ? "ডাটা রিকুয়েস্টসমূহ" : "Dataset Requests"), href: "/admin/requests", icon: Inbox, iconColor: "text-amber-500" },
        { label: st.gateway || (lang === "bn" ? "গেটওয়ে ও কিউআর সেটিংস" : "Gateway & QR Settings"), href: "/admin/gateway", icon: Settings, iconColor: "text-cyan-500" },
      ],
    },
    {
      key: "customers",
      title: st.customerManagement || (lang === "bn" ? "গ্রাহক ব্যবস্থাপনা" : "Customer Management"),
      icon: Users,
      color: "text-emerald-400",
      items: [
        { label: st.users || (lang === "bn" ? "গ্রাহক ও ক্রেডিট" : "Customers & Credits"), href: "/users", icon: User },
      ],
    },
    {
      key: "datasets",
      title: st.datasetManagement || (lang === "bn" ? "ডাটাবেস ব্যবস্থাপনা" : "Dataset Management"),
      icon: Database,
      color: "text-purple-400",
      items: [
        { label: st.catalog || (lang === "bn" ? "ডাটা ক্যাটালগ" : "Datasets Catalog"), href: "/catalog", icon: Database },
      ],
    },
    {
      key: "data-collection",
      title: lang === "bn" ? "ডাটা সংগ্রহ ইঞ্জিন" : "Data Collection",
      icon: Search,
      color: "text-cyan-400",
      items: [
        { label: lang === "bn" ? "গুগল ম্যাপস ইঞ্জিন" : "Google Maps Engine", href: "/scraper", icon: Search },
        { label: lang === "bn" ? "দারাজ ইঞ্জিন" : "Daraz Engine", href: "/scraper/daraz", icon: ShoppingCart, iconColor: "text-orange-400" },
      ],
    },
    {
      key: "marketing",
      title: st.marketingCampaigns || (lang === "bn" ? "মার্কেটিং ও ক্যাম্পেইন" : "Marketing & Campaigns"),
      icon: Send,
      color: "text-pink-400",
      items: [
        { label: st.marketing || (lang === "bn" ? "মার্কেটিং পোর্টাল" : "Marketing Portal"), href: "/marketing", icon: Send, iconColor: "text-pink-400" },
      ],
    },
    {
      key: "payment",
      title: st.paymentModule || (lang === "bn" ? "পেমেন্ট মডিউল" : "Payment Module"),
      icon: CreditCard,
      color: "text-amber-400",
      items: [
        { label: st.payments || (lang === "bn" ? "পেমেন্ট ভেরিফিকেশন" : "Payment Verification"), href: "/admin/payments", icon: Coins, iconColor: "text-amber-500" },
        { label: st.upgrade || (lang === "bn" ? "প্যাকেজ আপগ্রেড" : "Upgrade Package"), href: "/upgrade", icon: Zap, iconColor: "text-amber-500" },
      ],
    },
    {
      key: "security",
      title: st.securityManagement || (lang === "bn" ? "নিরাপত্তা ব্যবস্থাপনা" : "Security Management"),
      icon: Lock,
      color: "text-rose-400",
      items: [
        { label: st.security || (lang === "bn" ? "সিকিউরিটি মডিউল" : "Security Module"), href: "/security", icon: Shield, isDanger: true },
      ],
    },
    {
      key: "tutorial",
      title: lang === "bn" ? "সহায়িকা ও টিউটোরিয়াল" : "Guides & Tutorials",
      icon: BookOpen,
      color: "text-cyan-400",
      items: [
        { label: st.tutorial || (lang === "bn" ? "টিউটোরিয়াল ও নির্দেশিকা" : "Tutorial & Guide"), href: "/tutorial", icon: BookOpen, iconColor: "text-cyan-400" },
      ],
    },
  ];

  // ── Regular user nav ──
  const userGroups: (NavGroup & { key: string })[] = [
    {
      key: "main",
      title: st.mainHeader || (lang === "bn" ? "প্রধান নেভিগেশন" : "Main Navigation"),
      icon: LayoutDashboard,
      color: "text-primary",
      items: [
        { label: st.catalog || (lang === "bn" ? "ডাটা ক্যাটালগ" : "Datasets Catalog"), href: "/catalog", icon: Database },
      ],
    },
    {
      key: "data-collection",
      title: lang === "bn" ? "ডাটা সংগ্রহ ইঞ্জিন" : "Data Collection",
      icon: Search,
      color: "text-cyan-400",
      items: [
        { label: lang === "bn" ? "গুগল ম্যাপস ইঞ্জিন" : "Google Maps Engine", href: "/scraper", icon: Search },
        { label: lang === "bn" ? "দারাজ ইঞ্জিন" : "Daraz Engine", href: "/scraper/daraz", icon: ShoppingCart, iconColor: "text-orange-400" },
      ],
    },
    {
      key: "marketing",
      title: st.marketingCampaigns || (lang === "bn" ? "মার্কেটিং ও ক্যাম্পেইন" : "Marketing & Campaigns"),
      icon: Send,
      color: "text-pink-400",
      items: [
        { label: st.marketing || (lang === "bn" ? "মার্কেটিং পোর্টাল" : "Marketing Portal"), href: "/marketing", icon: Send },
        { label: st.upgrade || (lang === "bn" ? "প্যাকেজ আপগ্রেড" : "Upgrade Package"), href: "/upgrade", icon: Zap, iconColor: "text-amber-500" },
        { label: st.tutorial || (lang === "bn" ? "টিউটোরিয়াল ও নির্দেশিকা" : "Tutorial & Guide"), href: "/tutorial", icon: BookOpen, iconColor: "text-cyan-400" },
      ],
    },
  ];

  const groups = isAdmin ? adminGroups : userGroups;

  const getTourIdForHref = (href: string) => {
    if (href === "/catalog") return "sidebar-nav-catalog";
    if (href === "/scraper") return "sidebar-nav-scraper";
    if (href === "/scraper/daraz") return "sidebar-nav-daraz";
    if (href === "/marketing") return "sidebar-nav-marketing";
    if (href === "/upgrade") return "sidebar-nav-upgrade";
    if (href === "/tutorial") return "sidebar-nav-tutorial";
    return undefined;
  };

  // ── Single nav link ──
  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    const Icon = item.icon;
    const tourId = getTourIdForHref(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        data-tour={tourId}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : item.isDanger
            ? "text-rose-400 hover:bg-rose-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            item.iconColor,
            isActive && !item.iconColor && "text-primary"
          )}
        />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {isActive && !collapsed && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        )}
      </Link>
    );
  };

  // Wrap link in tooltip when collapsed
  const renderNavItem = (item: NavItem) => {
    const link = renderLink(item);
    if (!collapsed) return link;
    return (
      <Tooltip key={item.href}>
        <TooltipTrigger>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delay={0}>
      <div
        className={cn(
          "flex flex-col h-screen bg-card/60 backdrop-blur-xl border-r border-border/40 transition-[width] duration-300 overflow-hidden",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* ── Brand Header ── */}
        <div
          data-tour="sidebar-brand"
          className={cn(
            "flex items-center shrink-0 border-b border-border/40",
            collapsed ? "justify-center p-3 h-14" : "justify-between px-4 h-14"
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger>
                <Link href="/catalog" className="flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{APP_NAME}</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Link
                href="/catalog"
                className="flex items-center gap-2 font-bold text-sm tracking-tight hover:opacity-80 min-w-0"
              >
                <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">{APP_NAME}</span>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {isSuperadmin && (
                  <Badge className="bg-purple-600 text-[10px] px-1.5 py-0.5 font-bold">
                    SUPER
                  </Badge>
                )}
                {!isSuperadmin && isAdmin && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 font-bold">
                    ADMIN
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Nav Groups ── */}
        <div className="flex-1 overflow-y-auto py-2">
          {collapsed ? (
            // Icon-only mode: flat list with group dividers
            <div className="px-2 space-y-0.5">
              {groups.map((group) => (
                <div key={group.title} className="pb-2 mb-1 border-b border-border/20 last:border-b-0 space-y-0.5">
                  {group.items.map(renderNavItem)}
                </div>
              ))}
            </div>
          ) : (
            // Expanded mode: collapsible groups
            <div className="px-2 space-y-0.5">
              {groups.map((group) => {
                const GroupIcon = group.icon;
                const isOpen = openGroups[group.key] ?? true;

                return (
                  <Collapsible
                    key={group.key}
                    open={isOpen}
                    onOpenChange={() => toggleGroup(group.key)}
                  >
                    <CollapsibleTrigger
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                        "text-[11px] font-semibold uppercase tracking-wider",
                        "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <GroupIcon className={cn("h-3.5 w-3.5 shrink-0", group.color)} />
                        <span>{group.title}</span>
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      ) : (
                        <ChevronRight className="h-3 w-3 opacity-50" />
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="pl-1 mt-0.5 space-y-0.5">
                        {group.items.map(renderNavItem)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className={cn(
            "shrink-0 border-t border-border/40 bg-card/80",
            collapsed ? "p-2 flex flex-col items-center gap-2" : "p-3 space-y-2"
          )}
        >
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    onClick={onOpenPaymentModal}
                    className="h-8 w-8 bg-amber-500 text-black hover:bg-amber-600"
                  >
                    <Coins className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user?.credits ?? 0} {st.creditsBalance || (lang === "bn" ? "ক্রেডিট" : "Credits")} — {st.buyMore || (lang === "bn" ? "আরও কিনুন" : "Buy More")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={logout}
                    className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{st.logout || (lang === "bn" ? "লগআউট" : "Logout")}</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <div className="space-y-1.5 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLang}
                  className="w-full text-xs h-8 gap-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {st.langSwitchText || (lang === "en" ? "🇧🇩 বাংলা ভাষা" : "🇺🇸 English")}
                </Button>

                <TourButton variant="sidebar" tab="sidebar" />
              </div>

              <div className="pt-0.5 pb-1">
                <ConnectionStatusDots className="w-full justify-between text-[10px] py-1 px-2.5" />
              </div>

              <div data-tour="sidebar-user-credits" className="space-y-2">
                <div
                  className="text-xs text-muted-foreground truncate px-1"
                  title={user?.email}
                >
                  <User className="h-3 w-3 inline mr-1 opacity-60" />
                  {user?.email}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={onOpenPaymentModal}
                    className="flex-1 text-xs h-8 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:from-amber-600 hover:to-amber-700"
                  >
                    <Coins className="h-3.5 w-3.5 mr-1" />
                    {user?.credits ?? 0} CR ➕ {st.buyCredits || (lang === "bn" ? "কিনুন" : "Buy")}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={logout}
                    className="h-8 w-8 text-muted-foreground hover:text-rose-400 shrink-0"
                    title={st.logout || (lang === "bn" ? "লগআউট" : "Logout")}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Main Exported Sidebar ────────────────────────────────────────
export function Sidebar({ onOpenPaymentModal }: SidebarProps) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Desktop: sticky sidebar with collapse toggle */}
      <div className="hidden lg:flex relative shrink-0">
        <aside className="sticky top-0 h-screen">
          <SidebarInner
            collapsed={collapsed}
            onOpenPaymentModal={onOpenPaymentModal}
          />
        </aside>

        {/* Collapse/Expand toggle button */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "absolute top-[52px] -right-3.5 z-50",
            "h-7 w-7 flex items-center justify-center rounded-full",
            "border border-border/60 bg-background text-muted-foreground shadow-md",
            "hover:text-foreground hover:border-primary/50 transition-all duration-200"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Mobile: hamburger button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 bg-background/90 backdrop-blur border-border shadow-md"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile: slide-in Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 w-72 max-w-[85vw] border-r border-border/40"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarInner
            collapsed={false}
            onClose={() => setMobileOpen(false)}
            onOpenPaymentModal={() => {
              setMobileOpen(false);
              onOpenPaymentModal?.();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
