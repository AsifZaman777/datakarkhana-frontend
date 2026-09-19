import type { Step } from "react-joyride";

export interface TourStepConfig {
  target: string;
  title: { en: string; bn: string };
  content: { en: string; bn: string };
  placement?: "top" | "bottom" | "left" | "right" | "auto" | "center";
}

export const TOUR_LOCALE = {
  en: {
    back: "Back",
    close: "Close",
    last: "Finish Tour",
    next: "Next",
    open: "Open",
    skip: "Skip Tour",
  },
  bn: {
    back: "পূর্ববর্তী",
    close: "বন্ধ করুন",
    last: "ট্যুর শেষ করুন",
    next: "পরবর্তী",
    open: "খুলুন",
    skip: "স্কিপ করুন",
  },
};

export const TOUR_STEPS_CONFIG: Record<string, TourStepConfig[]> = {
  // ── 1. Global / Sidebar Tour ──
  sidebar: [
    {
      target: '[data-tour="sidebar-brand"]',
      title: {
        en: "Welcome to DataKarkhana! 🚀",
        bn: "ডাটা কারখানায় স্বাগতম! 🚀",
      },
      content: {
        en: "Your all-in-one B2B lead generation, live Google Maps scraping, and direct marketing automation platform across Bangladesh.",
        bn: "বাংলাদেশের সেরা বি২বি লিড জেনারেশন, লাইভ গুগল ম্যাপস স্ক্র্যাপিং এবং ডিরেক্ট মার্কেটিং অটোমেশন প্ল্যাটফর্ম।",
      },
      placement: "right",
    },
    {
      target: '[data-tour="sidebar-nav-catalog"]',
      title: {
        en: "1. Datasets Catalog 🗄️",
        bn: "১. ডাটা ক্যাটালগ 🗄️",
      },
      content: {
        en: "Browse thousands of verified Bangladeshi business leads categorized by industry, division, district, and upazila.",
        bn: "শিল্প, বিভাগ, জেলা এবং থানা ভিত্তিক হাজার হাজার যাচাইকৃত ব্যবসায়িক লিড সহজে অন্বেষণ করুন।",
      },
      placement: "right",
    },
    {
      target: '[data-tour="sidebar-nav-scraper"]',
      title: {
        en: "2. Live Scraper Console ⚡",
        bn: "২. লাইভ স্ক্র্যাপার কনসোল ⚡",
      },
      content: {
        en: "Run automated bots to extract fresh business leads, phones, addresses, and ratings directly from Google Maps in real time.",
        bn: "গুগল ম্যাপস থেকে লাইভ ফোন নম্বর, ঠিকানা এবং রেটিং সহ নতুন লিড সংগ্রহ করতে স্বয়ংক্রিয় রোবট চালান।",
      },
      placement: "right",
    },
    {
      target: '[data-tour="sidebar-nav-marketing"]',
      title: {
        en: "3. Marketing Portal 📨",
        bn: "৩. মার্কেটিং পোর্টাল 📨",
      },
      content: {
        en: "Launch personalized WhatsApp and Email marketing campaigns directly to your collected business leads with anti-ban safety.",
        bn: "সংগৃহীত লিডগুলোতে সরাসরি নিরাপদ হোয়াটসঅ্যাপ এবং ব্রেভো ইমেইল ক্যাম্পেইন পরিচালনা করুন।",
      },
      placement: "right",
    },
    {
      target: '[data-tour="sidebar-nav-upgrade"]',
      title: {
        en: "4. Upgrade & Credits 💎",
        bn: "৪. প্যাকেজ ও ক্রেডিট 💎",
      },
      content: {
        en: "Recharge your credits instantly using bKash, Nagad, or Rocket to unlock unlimited scraping and campaign dispatching.",
        bn: "বিকাশ, নগদ বা রকেটের মাধ্যমে তাৎক্ষণিকভাবে ক্রেডিট রিচার্জ করুন এবং পূর্ণ সুবিধা উপভোগ করুন।",
      },
      placement: "right",
    },
    {
      target: '[data-tour="sidebar-nav-tutorial"]',
      title: {
        en: "5. Guides & Tutorials 📚",
        bn: "৫. সহায়িকা ও টিউটোরিয়াল 📚",
      },
      content: {
        en: "Access step-by-step masterclasses, video tutorials, and best practices to maximize your business outreach.",
        bn: "ভিডিও টিউটোরিয়াল এবং ধাপে ধাপে নির্দেশিকা দেখে প্ল্যাটফর্মের সকল ফিচার সহজে ব্যবহার করা শিখুন।",
      },
      placement: "right",
    },
    {
      target: '[data-tour="sidebar-user-credits"]',
      title: {
        en: "User Profile & Credits 💳",
        bn: "প্রোফাইল ও ক্রেডিট ব্যালেন্স 💳",
      },
      content: {
        en: "Monitor your active credit balance, account license validity, and access quick top-up options at any time.",
        bn: "আপনার বর্তমান ক্রেডিট ব্যালেন্স, লাইসেন্স স্ট্যাটাস এবং অ্যাকাউন্ট সেটিংস যেকোনো সময় এখান থেকে দেখতে পারেন।",
      },
      placement: "right",
    },
  ],

  // ── 2. Catalog Tab Tour ──
  catalog: [
    {
      target: '[data-tour="catalog-tabs"]',
      title: {
        en: "Public & Private Datasets 📑",
        bn: "পাবলিক ও প্রাইভেট ডেটাসেট 📑",
      },
      content: {
        en: "Switch between curated Public Verified Leads and your own Private Scraped Datasets generated from the scraper console.",
        bn: "যাচাইকৃত সার্বজনীন ডাটাবেস এবং স্ক্র্যাপার দিয়ে সংগৃহীত আপনার নিজস্ব প্রাইভেট ডাটাবেসের মধ্যে সুইচ করুন।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="catalog-search"]',
      title: {
        en: "Instant Keyword Search 🔍",
        bn: "তাৎক্ষণিক সার্চ 🔍",
      },
      content: {
        en: "Search any business niche or category in real time (e.g. 'Restaurant', 'Hospital', 'Real Estate').",
        bn: "যেকোনো ব্যবসার নাম বা ধরন দিয়ে নিমিষেই অনুসন্ধান করুন (যেমন: রেস্টুরেন্ট, হাসপাতাল, রিয়েল এস্টেট)।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="catalog-filters"]',
      title: {
        en: "Geographical Filters 🗺️",
        bn: "ভৌগোলিক ফিল্টারসমূহ 🗺️",
      },
      content: {
        en: "Drill down by Division, District, and specific Upazila/Thana across Bangladesh to target leads in specific locations.",
        bn: "বাংলাদেশের বিভাগ, জেলা এবং নির্দিষ্ট উপজেলা বা থানা অনুযায়ী লিড সুনির্দিষ্টভাবে ফিল্টার করুন।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="catalog-grid"]',
      title: {
        en: "Dataset Cards & Lead Inspection 📋",
        bn: "ডেটাসেট কার্ড ও লিড পরিদর্শন 📋",
      },
      content: {
        en: "Click on any dataset card to preview sample rows, check verified contact ratios, and download complete Excel or CSV files.",
        bn: "যেকোনো কার্ডে ক্লিক করে নমুনার ডাটা লাইভ দেখুন, ফোন নম্বরের অনুপাত যাচাই করুন এবং এক্সেল/সিএসভি ফাইল ডাউনলোড করুন।",
      },
      placement: "top",
    },
    {
      target: '[data-tour="catalog-request-btn"]',
      title: {
        en: "Request Custom Datasets 💡",
        bn: "কাস্টম ডাটার অনুরোধ 💡",
      },
      content: {
        en: "Need a specialized dataset not in the catalog? Submit a custom request and our team will extract and verify it for you.",
        bn: "নির্দিষ্ট কোনো ডাটাবেস ক্যাটালগে না থাকলে রিকোয়েস্ট করুন, আমাদের টিম তা সংগ্রহ ও ভেরিফাই করে দেবে।",
      },
      placement: "left",
    },
  ],

  // ── 3. Scraper Tab Tour ──
  scraper: [
    {
      target: '[data-tour="scraper-tabs"]',
      title: {
        en: "Scraper Console Modes ⚙️",
        bn: "স্ক্র্যাপার কনসোল মোড ⚙️",
      },
      content: {
        en: "Switch between launching live Google Maps scraping jobs and tracking your custom dataset requests.",
        bn: "লাইভ গুগল ম্যাপস স্ক্র্যাপিং চালানো এবং কাস্টম ডাটা রিকুয়েস্টের অগ্রগতি দেখার মধ্যে পরিবর্তন করুন।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="scraper-query-input"]',
      title: {
        en: "Search Query & Business Niche 🎯",
        bn: "টার্গেট কিওয়ার্ড ও ব্যবসার ধরন 🎯",
      },
      content: {
        en: "Enter what you want to extract (e.g. 'Coffee Shops in Banani', 'IT Companies'). Multiple comma-separated queries are supported!",
        bn: "যে ধরনের ব্যবসার লিড সংগ্রহ করতে চান তা লিখুন (যেমন: কফি শপ, আইটি কোম্পানি)। কমা দিয়ে একাধিক কিওয়ার্ডও দিতে পারেন!",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="scraper-location-selects"]',
      title: {
        en: "Target Geographic Location 📍",
        bn: "টার্গেট ভৌগোলিক এলাকা 📍",
      },
      content: {
        en: "Select the Division, District, and Upazila/Area to guide the scraper bot directly to the right local businesses.",
        bn: "সুনির্দিষ্ট বিভাগ, জেলা এবং থানা নির্বাচন করুন যাতে স্ক্র্যাপার শুধুমাত্র কাঙ্ক্ষিত এলাকার লিড সংগ্রহ করে।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="scraper-launch-btn"]',
      title: {
        en: "Launch Scraping Bot 🚀",
        bn: "স্ক্র্যাপার বট চালু করুন 🚀",
      },
      content: {
        en: "Click to start the automated Google Maps scraping bot. Required credits and estimated lead count are calculated automatically.",
        bn: "স্বয়ংক্রিয় স্ক্র্যাপার রোবট রান করতে ক্লিক করুন। প্রয়োজনীয় ক্রেডিট এবং আনুমানিক লিড সংখ্যা স্বয়ংক্রিয়ভাবে হিসাব হবে।",
      },
      placement: "top",
    },
    {
      target: '[data-tour="scraper-terminal"]',
      title: {
        en: "Live Terminal & Screen Stream 💻",
        bn: "লাইভ টার্মিনাল ও ভিডিও স্ক্রিন 💻",
      },
      content: {
        en: "Watch real-time browser execution frames and live console logs as the bot parses listings, phone numbers, and addresses.",
        bn: "স্ক্র্যাপার বট কীভাবে ম্যাপস থেকে ফোন নম্বর ও ঠিকানা সংগ্রহ করছে তা লাইভ স্ক্রিন প্রিভিউ ও টার্মিনাল লগে সরাসরি দেখুন।",
      },
      placement: "top",
    },
    {
      target: '[data-tour="scraper-history"]',
      title: {
        en: "Scrape History & Actions 📂",
        bn: "কাজের ইতিহাস ও পরবর্তী পদক্ষেপ 📂",
      },
      content: {
        en: "Access completed jobs, inspect extracted leads in a table modal, download Excel sheets, or directly send to marketing campaigns!",
        bn: "সম্পন্ন কাজের তালিকা দেখুন, সংগৃহীত লিড টেবিল প্রিভিউ করুন, এক্সেল ডাউনলোড করুন অথবা সরাসরি মার্কেটিং ক্যাম্পেইনে পাঠান!",
      },
      placement: "top",
    },
  ],

  // ── 4. Marketing Tab Tour ──
  marketing: [
    {
      target: '[data-tour="marketing-tabs"]',
      title: {
        en: "Marketing Channels 📣",
        bn: "মার্কেটিং চ্যানেলসমূহ 📣",
      },
      content: {
        en: "Switch between Campaign Analytics & History, WhatsApp Messaging Engine, and Brevo AI Email Builder.",
        bn: "ক্যাম্পেইন অ্যানালিটিক্স, হোয়াটসঅ্যাপ মেসেজিং ইঞ্জিন এবং ব্রেভো এআই ইমেইল বিল্ডারের মধ্যে সুইচ করুন।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="marketing-whatsapp-session"]',
      title: {
        en: "WhatsApp Web Connection 📱",
        bn: "হোয়াটসঅ্যাপ ওয়েব কানেকশন 📱",
      },
      content: {
        en: "Scan the QR code once to link your WhatsApp Web session. Anti-ban delays and intelligent throttling ensure account safety.",
        bn: "কিউআর কোড স্ক্যান করে হোয়াটসঅ্যাপ লিংক করুন। স্মার্ট অ্যান্টি-ব্যান বিলম্ব আপনার অ্যাকাউন্টের সম্পূর্ণ সুরক্ষা নিশ্চিত করে।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="marketing-recipient-select"]',
      title: {
        en: "Target Recipient Group 👥",
        bn: "টার্গেট প্রাপক গ্রুপ 👥",
      },
      content: {
        en: "Select any Public Catalog Dataset or your Private Scraped Leads as the target audience for your campaign.",
        bn: "ক্যাটালগ ডেটাসেট অথবা আপনার স্ক্র্যাপ করা প্রাইভেট লিড থেকে প্রাপক গ্রুপ নির্বাচন করুন।",
      },
      placement: "top",
    },
    {
      target: '[data-tour="marketing-inspect-btn"]',
      title: {
        en: "Lead Inspector & Contact Checklist ✅",
        bn: "লিড পরিদর্শক ও ফিল্টার চেকলিস্ট ✅",
      },
      content: {
        en: "Inspect every recipient name and phone number. Easily uncheck or search for contacts before hitting send.",
        bn: "প্রতিটি প্রাপকের নাম ও ফোন নম্বর দেখে নিন। কোনো নম্বর বাদ দিতে চাইলে সহজে আনচেক করুন।",
      },
      placement: "top",
    },
    {
      target: '[data-tour="marketing-send-btn"]',
      title: {
        en: "Dispatch Automated Campaign ⚡",
        bn: "ক্যাম্পেইন শুরু করুন ⚡",
      },
      content: {
        en: "Launch the campaign! DataKarkhana automatically formats phone numbers, inserts brand parameters, and tracks live ETA.",
        bn: "ক্যাম্পেইন শুরু করুন! সিস্টেম স্বয়ংক্রিয়ভাবে মেসেজ পার্সোনালাইজ করবে এবং লাইভ প্রগ্রেস ও আনুমানিক সময় দেখাবে।",
      },
      placement: "top",
    },
  ],

  // ── 5. Upgrade Tab Tour ──
  upgrade: [
    {
      target: '[data-tour="upgrade-packages"]',
      title: {
        en: "Flexible BDT Credit Bundles 💎",
        bn: "সাশ্রয়ী ক্রেডিট প্যাকেজসমূহ 💎",
      },
      content: {
        en: "Choose the package tailored to your business scale — from starter packs to high-volume enterprise bundles.",
        bn: "আপনার ব্যবসার প্রয়োজন অনুসারে স্টার্টার থেকে শুরু করে এন্টারপ্রাইজ প্যাকেজগুলোর মধ্য থেকে বেছে নিন।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="upgrade-payment-methods"]',
      title: {
        en: "Instant bKash, Nagad & Rocket 💳",
        bn: "ইনস্ট্যান্ট বিকাশ, নগদ ও রকেট পেমেন্ট 💳",
      },
      content: {
        en: "Pay seamlessly with Bangladeshi mobile banking. Credits are credited to your account with instant or manual verification.",
        bn: "বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি পেমেন্ট করুন। সাথে সাথেই আপনার অ্যাকাউন্টে ক্রেডিট যুক্ত হয়ে যাবে।",
      },
      placement: "top",
    },
  ],

  // ── 6. Tutorial Tab Tour ──
  tutorial: [
    {
      target: '[data-tour="tutorial-header"]',
      title: {
        en: "Knowledge Base & Masterclasses 🎓",
        bn: "নলেজ বেস ও মাস্টারক্লাস 🎓",
      },
      content: {
        en: "Step-by-step guides, FAQs, and video walkthroughs designed to help you generate maximum ROI from your leads.",
        bn: "ধাপে ধাপে বিস্তারিত গাইড, প্রায়শই জিজ্ঞাসিত প্রশ্ন এবং ভিডিও যা আপনার লিড জেনারেশনকে করবে আরও সফল।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="tutorial-categories"]',
      title: {
        en: "Categorized Learning Paths 📑",
        bn: "বিষয়ভিত্তিক লার্নিং গাইড 📑",
      },
      content: {
        en: "Select a module to learn about Scraping, Datasets, WhatsApp Marketing, Email Verification, or Payment Setup.",
        bn: "স্ক্র্যাপিং, ডেটাসেট, হোয়াটসঅ্যাপ মার্কেটিং বা ইমেইল ভেরিফিকেশন সম্পর্কে বিস্তারিত শিখতে যেকোনো ক্যাটাগরি বেছে নিন।",
      },
      placement: "bottom",
    },
    {
      target: '[data-tour="tutorial-search"]',
      title: {
        en: "Quick Search & Help 💡",
        bn: "দ্রুত সার্চ ও সহায়তা 💡",
      },
      content: {
        en: "Quickly search across all topics to find answers to any questions or troubleshooting steps in seconds.",
        bn: "যেকোনো বিষয়ের সমাধান বা টিপস দ্রুত খুঁজে পেতে সার্চ বক্স ব্যবহার করুন।",
      },
      placement: "bottom",
    },
  ],
};

/**
 * Returns formatted React Joyride Steps for a given tab and language
 */
export function getTourSteps(tab: string, lang: "en" | "bn"): Step[] {
  const configs = TOUR_STEPS_CONFIG[tab] || [];
  return configs.map((c) => ({
    target: c.target,
    title: c.title[lang] || c.title.en,
    content: c.content[lang] || c.content.en,
    placement: c.placement || "auto",
    skipBeacon: true,
  }));
}
