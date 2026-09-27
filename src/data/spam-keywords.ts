/**
 * Comprehensive list of WhatsApp spam/promotional keywords
 * that are known to trigger bans or rate-limits.
 *
 * Sources: WhatsApp Business policy, anti-spam community research.
 * Organized by category for scan & highlight in the ban protection wizard.
 */

export interface SpamKeyword {
  word: string;
  severity: "high" | "medium" | "low";
  category: string;
}

export const SPAM_KEYWORDS: SpamKeyword[] = [
  // ── High severity: almost always flagged ──
  { word: "free", severity: "high", category: "Promotional" },
  { word: "100% free", severity: "high", category: "Promotional" },
  { word: "buy now", severity: "high", category: "Urgency" },
  { word: "order now", severity: "high", category: "Urgency" },
  { word: "act now", severity: "high", category: "Urgency" },
  { word: "limited time", severity: "high", category: "Urgency" },
  { word: "last chance", severity: "high", category: "Urgency" },
  { word: "hurry", severity: "high", category: "Urgency" },
  { word: "urgent", severity: "high", category: "Urgency" },
  { word: "don't miss", severity: "high", category: "Urgency" },
  { word: "expires", severity: "high", category: "Urgency" },
  { word: "winner", severity: "high", category: "Scam Pattern" },
  { word: "congratulations", severity: "high", category: "Scam Pattern" },
  { word: "you have been selected", severity: "high", category: "Scam Pattern" },
  { word: "click here", severity: "high", category: "Link Spam" },
  { word: "click below", severity: "high", category: "Link Spam" },
  { word: "unsubscribe", severity: "high", category: "Mass Mailing" },
  { word: "bulk message", severity: "high", category: "Mass Mailing" },
  { word: "mass message", severity: "high", category: "Mass Mailing" },
  { word: "earn money", severity: "high", category: "Scam Pattern" },
  { word: "make money", severity: "high", category: "Scam Pattern" },
  { word: "work from home", severity: "high", category: "Scam Pattern" },
  { word: "no investment", severity: "high", category: "Scam Pattern" },
  { word: "guaranteed", severity: "high", category: "Promotional" },
  { word: "risk free", severity: "high", category: "Promotional" },
  { word: "double your", severity: "high", category: "Scam Pattern" },

  // ── Medium severity: context-dependent ──
  { word: "discount", severity: "medium", category: "Promotional" },
  { word: "offer", severity: "medium", category: "Promotional" },
  { word: "sale", severity: "medium", category: "Promotional" },
  { word: "deal", severity: "medium", category: "Promotional" },
  { word: "promo", severity: "medium", category: "Promotional" },
  { word: "promo code", severity: "medium", category: "Promotional" },
  { word: "coupon", severity: "medium", category: "Promotional" },
  { word: "voucher", severity: "medium", category: "Promotional" },
  { word: "cashback", severity: "medium", category: "Promotional" },
  { word: "exclusive", severity: "medium", category: "Promotional" },
  { word: "special offer", severity: "medium", category: "Promotional" },
  { word: "flash sale", severity: "medium", category: "Promotional" },
  { word: "mega sale", severity: "medium", category: "Promotional" },
  { word: "clearance", severity: "medium", category: "Promotional" },
  { word: "% off", severity: "medium", category: "Promotional" },
  { word: "save up to", severity: "medium", category: "Promotional" },
  { word: "lowest price", severity: "medium", category: "Promotional" },
  { word: "best price", severity: "medium", category: "Promotional" },
  { word: "price drop", severity: "medium", category: "Promotional" },
  { word: "limited stock", severity: "medium", category: "Urgency" },
  { word: "while supplies last", severity: "medium", category: "Urgency" },
  { word: "today only", severity: "medium", category: "Urgency" },
  { word: "ending soon", severity: "medium", category: "Urgency" },
  { word: "subscribe", severity: "medium", category: "Mass Mailing" },
  { word: "sign up now", severity: "medium", category: "Mass Mailing" },
  { word: "register now", severity: "medium", category: "Mass Mailing" },
  { word: "claim your", severity: "medium", category: "Scam Pattern" },
  { word: "apply now", severity: "medium", category: "Urgency" },
  { word: "call now", severity: "medium", category: "Urgency" },

  // ── Low severity: watch if combined ──
  { word: "gift", severity: "low", category: "Promotional" },
  { word: "bonus", severity: "low", category: "Promotional" },
  { word: "reward", severity: "low", category: "Promotional" },
  { word: "trial", severity: "low", category: "Promotional" },
  { word: "sample", severity: "low", category: "Promotional" },
  { word: "new arrival", severity: "low", category: "Promotional" },
  { word: "launching", severity: "low", category: "Promotional" },
  { word: "introducing", severity: "low", category: "Promotional" },
  { word: "check out", severity: "low", category: "Link Spam" },
  { word: "visit", severity: "low", category: "Link Spam" },
  { word: "shop now", severity: "low", category: "Urgency" },
  { word: "grab", severity: "low", category: "Urgency" },
  { word: "avail", severity: "low", category: "Urgency" },

  // ── Bangla spam keywords ──
  { word: "ফ্রি", severity: "high", category: "Promotional" },
  { word: "বিনামূল্যে", severity: "high", category: "Promotional" },
  { word: "বিজয়ী", severity: "high", category: "Scam Pattern" },
  { word: "অভিনন্দন", severity: "high", category: "Scam Pattern" },
  { word: "জিতেছেন", severity: "high", category: "Scam Pattern" },
  { word: "এখনই কিনুন", severity: "high", category: "Urgency" },
  { word: "সীমিত সময়", severity: "high", category: "Urgency" },
  { word: "শেষ সুযোগ", severity: "high", category: "Urgency" },
  { word: "তাড়াতাড়ি", severity: "medium", category: "Urgency" },
  { word: "ছাড়", severity: "medium", category: "Promotional" },
  { word: "অফার", severity: "medium", category: "Promotional" },
  { word: "ডিসকাউন্ট", severity: "medium", category: "Promotional" },
  { word: "ক্যাশব্যাক", severity: "medium", category: "Promotional" },
  { word: "কুপন", severity: "medium", category: "Promotional" },
  { word: "প্রোমো কোড", severity: "medium", category: "Promotional" },
  { word: "উপহার", severity: "low", category: "Promotional" },
];

/**
 * Scan a message for spam keywords and return matches.
 */
export function scanForSpamKeywords(message: string): SpamKeyword[] {
  if (!message) return [];
  const lower = message.toLowerCase();
  return SPAM_KEYWORDS.filter((kw) => lower.includes(kw.word.toLowerCase()));
}

/**
 * Get a severity score (0-100) for a message.
 * Higher = more spammy.
 */
export function getSpamScore(message: string): number {
  const matches = scanForSpamKeywords(message);
  if (matches.length === 0) return 0;

  let score = 0;
  for (const m of matches) {
    if (m.severity === "high") score += 15;
    else if (m.severity === "medium") score += 8;
    else score += 3;
  }
  return Math.min(100, score);
}
