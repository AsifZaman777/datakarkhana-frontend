"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "./language-provider";
import { ProductTour } from "@/components/tour/product-tour";

interface TourContextType {
  isRunning: boolean;
  activeTour: string;
  startTour: (tabName?: string) => void;
  stopTour: () => void;
  hasSeenTour: (tabName: string) => boolean;
  markTourSeen: (tabName: string) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [activeTour, setActiveTour] = useState<string>("sidebar");

  const getTabFromPathname = useCallback((path: string): string => {
    if (path.startsWith("/catalog")) return "catalog";
    if (path.startsWith("/scraper")) return "scraper";
    if (path.startsWith("/marketing")) return "marketing";
    if (path.startsWith("/upgrade")) return "upgrade";
    if (path.startsWith("/tutorial")) return "tutorial";
    return "sidebar";
  }, []);

  const hasSeenTour = useCallback((tabName: string): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(`dk_tour_seen_${tabName}`);
  }, []);

  const markTourSeen = useCallback((tabName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`dk_tour_seen_${tabName}`, "true");
    }
  }, []);

  const startTour = useCallback((tabName?: string) => {
    const targetTab = tabName || getTabFromPathname(pathname);
    setActiveTour(targetTab);
    setIsRunning(true);
  }, [getTabFromPathname, pathname]);

  const stopTour = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleTourEnd = useCallback((tabName: string) => {
    markTourSeen(tabName);
    setIsRunning(false);
  }, [markTourSeen]);

  return (
    <TourContext.Provider
      value={{
        isRunning,
        activeTour,
        startTour,
        stopTour,
        hasSeenTour,
        markTourSeen,
      }}
    >
      {children}
      <ProductTour
        run={isRunning}
        tab={activeTour}
        lang={lang}
        onEnd={() => handleTourEnd(activeTour)}
      />
    </TourContext.Provider>
  );
}

export function useProductTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useProductTour must be used within a TourProvider");
  }
  return context;
}
