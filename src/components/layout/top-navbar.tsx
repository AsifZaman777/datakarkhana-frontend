"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, Laptop, MoreHorizontal, ChevronDown, Menu, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { useIsDesktop } from "@/lib/desktop";
import { ConnectionStatusDots } from "@/components/shared/connection-status-dots";
import { APP_NAME } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  section: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function TopNavbar() {
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryNavItems: NavItem[] = [
    { label: t.nav?.home || (lang === "bn" ? "হোম" : "Home"), href: "/", section: "" },
    { label: t.nav?.download || (lang === "bn" ? "ডাউনলোড অ্যাপ" : "Download App"), href: "/#download", section: "download", icon: Laptop },
    { label: t.nav?.datasets || (lang === "bn" ? "ডাটা ক্যাটালগ" : "Datasets"), href: "/catalog", section: "catalog", icon: Database },
    { label: t.nav?.pricing || (lang === "bn" ? "মূল্যতালিকা (৳)" : "Pricing (BDT ৳)"), href: "/#pricing", section: "pricing" },
  ];

  const moreNavItems: NavItem[] = [
    { label: t.nav?.tutorial || (lang === "bn" ? "টিউটোরিয়াল ও নির্দেশিকা" : "Tutorial & Guide"), href: "/tutorial", section: "tutorial" },
    { label: t.nav?.features || (lang === "bn" ? "ফিচারসমূহ" : "Features"), href: "/#features", section: "features" },
    { label: t.nav?.contact || (lang === "bn" ? "যোগাযোগ" : "Contact"), href: "/#contact", section: "contact" },
  ];

  const allNavItems = [...primaryNavItems, ...moreNavItems];

  const homeHref = isDesktop
    ? user
      ? user.role === "admin" || user.role === "superadmin"
        ? "/admin"
        : "/catalog"
      : "/auth"
    : "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity shrink-0">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="flex items-center gap-2">
            <span>{APP_NAME}</span>
            {isDesktop && (
              <span className="text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                DESKTOP
              </span>
            )}
          </span>
        </Link>

        {/* Website Landing Nav Links — Hidden on Desktop Application */}
        {!isDesktop && (
          <nav className="hidden lg:flex items-center gap-1 shrink min-w-0">
            {/* Always visible on medium/laptop screens */}
            {primaryNavItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("#")[0]) && item.href !== "/";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0
                    ${isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}

            {/* On extra-wide screens: show all links directly */}
            <div className="hidden 2xl:flex items-center gap-1">
              {moreNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href.split("#")[0]) && item.href !== "/";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0
                      ${isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* On laptop / compact screens (lg to 2xl): Three-Dot / More Dropdown */}
            <div className="2xl:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer outline-none border-none bg-transparent"
                  title={t.nav?.more || (lang === "bn" ? "আরও" : "More")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>{t.nav?.more || (lang === "bn" ? "আরও" : "More")}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border/60 shadow-xl p-1.5 space-y-1 z-50">
                  {moreNavItems.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.location.href = item.href;
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer transition-colors text-foreground"
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        )}

        {/* Actions & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {(user || isDesktop) && <ConnectionStatusDots />}
          <LanguageToggle />
          <ThemeToggle />

          {user ? (
            <Link href={user.role === "admin" || user.role === "superadmin" ? "/admin" : "/catalog"}>
              <Button size="sm" className="gap-2 rounded-lg font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user.role === "admin" || user.role === "superadmin"
                    ? (t.nav?.adminPanel || (lang === "bn" ? "এডমিন প্যানেল" : "Admin Panel"))
                    : (t.nav?.dashboard || (lang === "bn" ? "ড্যাশবোর্ড" : "Dashboard"))}
                </span>
              </Button>
            </Link>
          ) : (
            !isDesktop && (
              <Link href="/#download">
                <Button size="sm" className="gap-2 rounded-lg font-bold bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90">
                  <Laptop className="h-4 w-4" />
                  <span>{t.nav?.downloadApp || (lang === "bn" ? "ডাউনলোড অ্যাপ" : "Download App")}</span>
                </Button>
              </Link>
            )
          )}

          {/* Mobile Drawer Trigger (hidden on desktop app) */}
          {!isDesktop && (
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-card border-border/60 p-6 space-y-6">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-base font-bold">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <span>{APP_NAME}</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-1 pt-4">
                    {allNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent/60 transition-colors"
                      >
                        {item.icon && <item.icon className="h-4 w-4 text-primary" />}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border/40 space-y-3">
                    {user ? (
                      <Link
                        href={user.role === "admin" || user.role === "superadmin" ? "/admin" : "/catalog"}
                        onClick={() => setMobileOpen(false)}
                        className="block"
                      >
                        <Button className="w-full gap-2 font-bold bg-primary text-primary-foreground">
                          <LayoutDashboard className="h-4 w-4" />
                          <span>
                            {user.role === "admin" || user.role === "superadmin"
                              ? (t.nav?.adminPanel || (lang === "bn" ? "এডমিন প্যানেল" : "Admin Panel"))
                              : (t.nav?.dashboard || (lang === "bn" ? "মাই ড্যাশবোর্ড" : "My Dashboard"))}
                          </span>
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/#download" onClick={() => setMobileOpen(false)} className="block">
                        <Button className="w-full gap-2 font-bold bg-primary text-primary-foreground">
                          <Laptop className="h-4 w-4" />
                          <span>{t.nav?.downloadApp || (lang === "bn" ? "ডাউনলোড অ্যাপ" : "Download App")}</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

