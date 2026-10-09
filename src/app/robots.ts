import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

/** Crawl the public site; keep the staff admin and the client portal out (they are noindex too). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/portal"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
