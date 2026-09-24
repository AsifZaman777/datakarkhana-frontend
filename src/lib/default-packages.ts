import type { PaymentConfig, PaymentPackage } from "@/lib/types";

/**
 * Fallback packages configuration for DataKarkhana.
 * Used exclusively on the frontend as an offline/initial fallback before the live API configuration loads from the database.
 */
export const DEFAULT_PACKAGES: PaymentPackage[] = [
  {
    id: "starter",
    name: "Starter Lead Pack",
    credits: 99,
    price_bdt: 350,
    price_per_credit_bdt: 7,
    popular: false,
    badge: "Starter",
    description: "Ideal for small outreach campaigns & testing.",
    features: [
      "50 Verified Lead Credits",
      "Full Phone & Email Access",
      "Unlimited Public Dataset Access",
      "Generate 10 Private Dataset",
      "Unlimited WhatsApp Campaign (max 250 leads/day)",
      "Standard Support",
    ],
  },
  {
    id: "pro",
    name: "Pro Growth Pack",
    credits: 199,
    price_bdt: 650,
    price_per_credit_bdt: 5.5,
    popular: true,
    badge: "Most Popular",
    save_badge: "🔥 Save 1.5 Taka/Credit",
    description: "Best value! Power your WhatsApp & Email campaigns.",
    features: [
      "200 Verified Lead Credits",
      "Full Phone & Email Access",
      "Global Google map Scraping",
      "Priority Dataset Requests",
      "Unlimited Public Dataset Access",
      "10x cloud sync to access online datasets",
      "Export dateset to Excel/CSV",
      "Generate 5x Private Dataset than STARTER",
      "Unlimited WhatsApp Campaign (max 350 leads/day)",
      "Unlimited Email Campaign (max 250 leads/day)",
      "24/7 Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Mega Pack",
    credits: 899,
    price_bdt: 3500,
    price_per_credit_bdt: 5,
    popular: true,
    badge: "Agency Choice",
    save_badge: "🔥 Save 2.0 Taka/Credit",
    description: "Maximum credits for high-volume agency scraping.",
    features: [
      "500 Verified Lead Credits",
      "Full Phone & Email Access",
      "Global Google map Scraping",
      "Instant Public Catalog Unlocks",
      "Generate 10x Private Dataset than PRO",
      "Unlimited cloud sync to access online datasets",
      "Export dateset to Excel/CSV",
      "Unlimited WhatsApp Campaign (unlimited)",
      "Unlimited Email Campaign (~10000/month)",
      "Dedicated Account Manager",
      "SEO and Digital marketing support",
      "Custom Location & Niche Requests",
    ],
  },
];

export const DEFAULT_CUSTOM_PACKAGE = {
  name: "Custom Upgrade",
  price_per_credit_bdt: 0.32,
  min_credits: 5,
  max_credits: 1000,
  step: 10,
  description: "Select the exact credit amount your team requires:",
  features: [
    "Custom Flexible Credit Top-up",
    "Instant Account Balance Unlocks",
    "Full Access to All Catalogs",
  ],
};

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  bkash_number: "",
  bkash_account_type: "Personal (Send Money)",
  bkash_qr_url: "",
  pathao_number: "",
  pathao_account_type: "Personal / Merchant",
  pathao_qr_url: "",
  packages: DEFAULT_PACKAGES,
  custom_package: DEFAULT_CUSTOM_PACKAGE,
};
