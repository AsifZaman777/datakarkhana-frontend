"use client";

import { useEffect, useState } from "react";
import { Joyride, STATUS, ACTIONS, EVENTS, type EventData } from "react-joyride";
import { getTourSteps, TOUR_LOCALE } from "@/lib/tours";

interface ProductTourProps {
  run: boolean;
  tab: string;
  lang: "en" | "bn";
  onEnd: () => void;
}

export function ProductTour({ run, tab, lang, onEnd }: ProductTourProps) {
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset stepIndex whenever a new tour is launched or tab changes
  useEffect(() => {
    if (run) {
      setStepIndex(0);
    }
  }, [run, tab]);

  if (!mounted) return null;

  const steps = getTourSteps(tab, lang);
  if (!steps || steps.length === 0) return null;

  const handleJoyrideCallback = (data: EventData) => {
    const { status, action, type, index } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onEnd();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      locale={TOUR_LOCALE[lang]}
      options={{
        arrowColor: "#0f172a",
        backgroundColor: "#0f172a",
        overlayColor: "rgba(0, 0, 0, 0.75)",
        primaryColor: "#06b6d4",
        textColor: "#f8fafc",
        width: 380,
        zIndex: 10000,
        showProgress: true,
        skipBeacon: true,
        overlayClickAction: false,
      }}
      styles={{
        tooltip: {
          borderRadius: "16px",
          border: "1px solid rgba(6, 182, 212, 0.35)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(6, 182, 212, 0.2)",
          padding: "20px",
          backdropFilter: "blur(16px)",
        },
        tooltipTitle: {
          fontSize: "15px",
          fontWeight: 700,
          color: "#38bdf8",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        },
        tooltipContent: {
          fontSize: "13px",
          lineHeight: "1.6",
          color: "#e2e8f0",
          padding: "4px 0 12px 0",
        },
        buttonPrimary: {
          backgroundColor: "#06b6d4",
          color: "#020617",
          fontSize: "12px",
          fontWeight: 700,
          borderRadius: "8px",
          padding: "8px 16px",
          outline: "none",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
          transition: "all 0.2s ease",
        },
        buttonBack: {
          color: "#94a3b8",
          fontSize: "12px",
          fontWeight: 600,
          marginRight: "10px",
          outline: "none",
          cursor: "pointer",
        },
        buttonSkip: {
          color: "#64748b",
          fontSize: "11px",
          fontWeight: 500,
          outline: "none",
          cursor: "pointer",
        },
        buttonClose: {
          color: "#94a3b8",
          padding: "10px",
        },
      }}
    />
  );
}
