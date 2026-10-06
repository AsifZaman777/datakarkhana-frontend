"use client";

import { toast } from "sonner";

class AudioAlertManager {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      console.warn("[AudioAlertManager] Web Audio not available:", e);
      return null;
    }
  }

  /**
   * Unlock audio context on user click/interaction
   */
  public resume(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  /**
   * Pleasant melodic two-tone trading chime (C6 -> G6)
   */
  public playAlertChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: 1046.5 Hz (High C)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: 1567.98 Hz (High G)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1567.98, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.debug("[AudioAlertManager] playAlertChime error:", e);
    }
  }

  /**
   * Rapid ascending chime for price spikes / breakout
   */
  public playSpikeChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      console.debug("[AudioAlertManager] playSpikeChime error:", e);
    }
  }

  /**
   * Crisp confirmation sound
   */
  public playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.debug("[AudioAlertManager] playSuccessChime error:", e);
    }
  }
}

export const alertSound = new AudioAlertManager();

export interface StockAlertOptions {
  title: string;
  message: string;
  ticker?: string;
  ltp?: number;
  percent?: number;
  type?: "target" | "spike" | "drop" | "news" | "success" | "info";
  time?: string;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    try {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    } catch (e) {
      console.debug("Notification permission request error:", e);
      return false;
    }
  }
  return false;
}

export function showBrowserNotification(title: string, body: string, icon = "/favicon.ico") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        icon,
        silent: true, // We already play audio via Web Audio API
      });
      setTimeout(() => notif.close(), 7000);
    } catch (e) {
      console.debug("[showBrowserNotification error]", e);
    }
  }
}

export function triggerStockAlertNotification(options: StockAlertOptions): void {
  // 1. Play sound
  if (options.type === "spike") {
    alertSound.playSpikeChime();
  } else if (options.type === "success") {
    alertSound.playSuccessChime();
  } else {
    alertSound.playAlertChime();
  }

  // 2. Pop up Sonner Toast
  const formattedTitle = options.ticker
    ? `🎯 ${options.ticker}: ${options.title}`
    : options.title;

  const desc = options.message;

  if (options.type === "spike") {
    toast.warning(formattedTitle, {
      description: desc,
      duration: 6000,
    });
  } else if (options.type === "drop") {
    toast.error(formattedTitle, {
      description: desc,
      duration: 6000,
    });
  } else if (options.type === "success") {
    toast.success(formattedTitle, {
      description: desc,
      duration: 5000,
    });
  } else {
    toast.info(formattedTitle, {
      description: desc,
      duration: 6000,
    });
  }

  // 3. Desktop Native Notification
  showBrowserNotification(formattedTitle, desc);
}
