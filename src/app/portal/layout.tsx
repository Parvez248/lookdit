import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../globals.css";

// The client portal's own root layout: the LOOKDIT tokens and fonts without the
// public site's header and footer. Same font settings as (site)/layout.tsx and
// admin/layout.tsx, so the browser reuses the same font files.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    template: "%s — LOOKDIT Client portal",
    default: "LOOKDIT Client portal",
  },
  // Private: never indexed, whatever a crawler finds linked.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  themeColor: "#06080c",
  colorScheme: "dark",
};

export default function PortalRootLayout({ children }: LayoutProps<"/portal">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
