/**
 * Serialize structured data for a `<script type="application/ld+json">`.
 * "<" is escaped so content can never close the script element.
 */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}
