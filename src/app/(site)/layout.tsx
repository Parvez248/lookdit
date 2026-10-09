import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { hero } from "@/content/site";
import { siteUrl } from "@/lib/site-url";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Mono only sets small labels, so it isn't worth a preload on the critical path.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  // Resolves relative canonical and Open Graph URLs to the production domain.
  metadataBase: siteUrl(),
  title: {
    template: "%s — LOOKDIT",
    default: "LOOKDIT — SEO, Digital Marketing & Web Apps Development",
  },
  description: hero.supporting,
  openGraph: { siteName: "LOOKDIT", type: "website", locale: "en_US" },
  // "summary" until there is a default share image; case studies with a hero still show it via og:image.
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  themeColor: "#06080c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
