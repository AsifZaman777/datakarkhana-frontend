"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, User, Laptop, MoreHorizontal, ChevronDown, Menu, Sparkles, LogIn, LayoutDashboard } from "lucide-react";
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
import { APP_NAME } from "@/lib/constants";

export function TopNavbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryNavItems = [
    { label: t.nav.home, href: "/", section: "" },
    { label: "Download", href: "/#download", section: "download", icon: Laptop },
    { label: t.nav.datasets, href: "/catalog", section: "catalog", icon: Database },
    { label: t.nav.pricing, href: "/#pricing", section: "pricing" },
  ];

  const moreNavItems = [
    { label: t.nav.features, href: "/#features", section: "features" },
    { label: t.nav.contact, href: "/#contact", section: "contact" },
  ];

  const allNavItems = [...primaryNavItems, ...moreNavItems];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity shrink-0">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        {/* Desktop & Laptop Nav Links with Three-Dot Overflow */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Always visible on medium/laptop screens */}
          {primaryNavItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("#")[0]) && item.href !== "/";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0
                  ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}

          {/* On extra-wide screens: show all links directly */}
          <div className="hidden xl:flex items-center gap-1">
            {moreNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href.split("#")[0]) && item.href !== "/";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* On laptop / compact screens (md to xl): Three-Dot / More Dropdown */}
          <div className="xl:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer outline-none border-none bg-transparent"
                title="More Pages"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>More</span>
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

        {/* Actions & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageToggle />
          <ThemeToggle />

          {user ? (
            <Link href={user.role === "admin" || user.role === "superadmin" ? "/admin" : "/catalog"}>
              <Button size="sm" className="gap-2 rounded-lg font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{user.role === "admin" || user.role === "superadmin" ? "Admin Panel" : "Dashboard"}</span>
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="gap-2 rounded-lg font-bold bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90">
                <LogIn className="h-4 w-4" />
                <span>{t.nav.loginRegister}</span>
              </Button>
            </Link>
          )}

          {/* Mobile Drawer Trigger */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
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
                        <span>{user.role === "admin" || user.role === "superadmin" ? "Admin Panel" : "My Dashboard"}</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/auth" onClick={() => setMobileOpen(false)} className="block">
                      <Button className="w-full gap-2 font-bold bg-primary text-primary-foreground">
                        <LogIn className="h-4 w-4" />
                        <span>{t.nav.loginRegister}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
