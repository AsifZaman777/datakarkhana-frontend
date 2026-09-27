import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { LanguageProvider } from "@/providers/language-provider";
import { LocalModelsProvider } from "@/providers/local-models-provider";
import { ModelManagerModal } from "@/components/models/model-manager-modal";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MARKETING OSTAD • Verified B2B Leads & Automation Platform",
  description:
    "Access Bangladesh's premier verified lead marketplace, real-time Google Maps web scraper, and multi-channel WhatsApp & Email marketing engines.",
  keywords: ["B2B Leads", "Google Maps Scraper", "WhatsApp Automation", "Bangladesh Business Data"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <LocalModelsProvider>
                {children}
                <ModelManagerModal />
                <Toaster position="bottom-right" richColors closeButton />
              </LocalModelsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
