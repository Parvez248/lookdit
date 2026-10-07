import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";

import { brand } from "@/demo/ecommerce/brand";
import { DisclosureBanner } from "@/demo/ecommerce/components/DisclosureBanner";

import "@/demo/ecommerce/styles/demo.css";

// The demo's own root layout: a separate <html> from LOOKDIT's (site) root, so the two never
// share fonts, tokens or global CSS. Navigating between the roots is a full page load.

// Weight axis only: adding the optical-size axis took this file from about 87 KB to 132 KB,
// which breaks the 150 KB font budget for both families together.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: `%s — ${brand.name} · LOOKDIT concept demo`,
    default: `${brand.name} · LOOKDIT concept demo`,
  },
  description: `${brand.about} A LOOKDIT concept demo: nothing is for sale.`,
  // Every demo route stays out of search results; child routes inherit this.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f1ea",
  colorScheme: "light",
};

export default function DemoRootLayout({ children }: LayoutProps<"/demo/ecommerce">) {
  return (
    <html lang="en" className={`${newsreader.variable} ${instrumentSans.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <DisclosureBanner />
        {children}
      </body>
    </html>
  );
}
