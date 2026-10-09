/**
 * The site's absolute origin, for canonical URLs, Open Graph, the sitemap and
 * robots.txt. On Vercel it is the production domain (Vercel sets
 * `VERCEL_PROJECT_PRODUCTION_URL` on every deployment, previews included, so
 * previews never advertise themselves as canonical). Locally it is the dev server.
 */
export function siteUrl(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(host ? `https://${host}` : "http://localhost:3000");
}
