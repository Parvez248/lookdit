import { createHmac } from "node:crypto";
import { isIP } from "node:net";

// Trusted client identification for inquiry rate limiting. Pure: headers and env
// are passed in, so every trust decision is unit-testable. Nothing here logs.
//
// PRIVACY: the raw IP, the derived client key, the fingerprint and the secret
// must never be logged or returned to the frontend. Only the fingerprint leaves
// this module, and only towards the database.

/**
 * On Vercel, the edge sets `x-real-ip` from the TCP connection and overwrites any
 * client-supplied value (it is what `@vercel/functions`' `ipAddress()` reads).
 * Assumes no other proxy/CDN sits in front of Vercel.
 */
export const TRUSTED_CLIENT_IP_HEADER = "x-real-ip";

/** Local `next dev`: every submission shares one bucket, so the full path runs. */
export const DEV_CLIENT_KEY = "v1|4|127.0.0.1";

/** Longest textual IPv6 is 45 chars; anything longer is not a single address. */
const MAX_IP_HEADER_LENGTH = 64;

/**
 * 32 random bytes encode to at least 43 characters (base64 without padding;
 * `openssl rand -base64 32` gives 44, `openssl rand -hex 32` gives 64). Length is
 * the only property checkable at runtime; randomness is a deployment rule.
 */
export const MIN_HMAC_SECRET_LENGTH = 43;

export type ClientFingerprintEnv = {
  readonly VERCEL?: string | undefined;
  readonly NODE_ENV?: string | undefined;
  readonly INQUIRY_IP_HMAC_SECRET?: string | undefined;
};

type HeaderReader = { get(name: string): string | null };

export type ClientFingerprintResult =
  | { ok: true; fingerprint: string }
  | { ok: false; reason: "config_error" | "ip_unavailable" };

/**
 * The trusted client key for this request, or null when there is no trusted
 * source (caller must fail closed).
 */
export function resolveClientKey(headers: HeaderReader, env: ClientFingerprintEnv): string | null {
  if (env.VERCEL === "1") return clientKeyFromIp(headers.get(TRUSTED_CLIENT_IP_HEADER));
  if (env.NODE_ENV === "development") return DEV_CLIENT_KEY;
  // Self-hosted or unknown: every forwarding header is client-controlled.
  return null;
}

/**
 * Normalize one textual IP into a versioned client key:
 * - IPv4 → `v1|4|a.b.c.d`
 * - IPv4-mapped IPv6 (`::ffff:a.b.c.d`) → the IPv4 key
 * - other IPv6 → its /64 prefix, `v1|6|xxxx:xxxx:xxxx:xxxx::/64`, because one
 *   host usually controls a whole /64 and could otherwise rotate addresses.
 * Anything else (missing, list, zone id, garbage) → null.
 */
export function clientKeyFromIp(raw: string | null): string | null {
  if (raw === null || raw.length > MAX_IP_HEADER_LENGTH) return null;
  const value = raw.trim();

  const version = isIP(value);
  // Node's isIPv4 only accepts canonical dotted decimal (no leading zeros).
  if (version === 4) return `v1|4|${value}`;
  // Zone ids (`fe80::1%eth0`) never belong to a public client.
  if (version !== 6 || value.includes("%")) return null;

  const hextets = parseIpv6(value);
  if (hextets === null) return null;

  const isIpv4Mapped = hextets.slice(0, 5).every((h) => h === 0) && hextets[5] === 0xffff;
  if (isIpv4Mapped) {
    const [high, low] = [hextets[6] ?? 0, hextets[7] ?? 0];
    return `v1|4|${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
  }
  return `v1|6|${hextets.slice(0, 4).map((h) => h.toString(16)).join(":")}::/64`;
}

/** Eight numeric hextets of a valid IPv6 address, or null. */
function parseIpv6(address: string): number[] | null {
  let canonical: string;
  try {
    // The WHATWG URL IPv6 serializer canonicalizes: lowercase hex, no leading
    // zeros, and embedded dotted IPv4 rewritten as hex.
    canonical = new URL(`http://[${address}]`).hostname.slice(1, -1);
  } catch {
    return null;
  }
  const [head = "", tail] = canonical.split("::");
  const headParts = head === "" ? [] : head.split(":");
  const tailParts = tail === undefined || tail === "" ? [] : tail.split(":");
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 0 || (tail === undefined && missing !== 0)) return null;

  const hextets = [...headParts, ...Array<string>(missing).fill("0"), ...tailParts].map((part) =>
    Number.parseInt(part, 16),
  );
  return hextets.every((h) => Number.isInteger(h) && h >= 0 && h <= 0xffff) ? hextets : null;
}

/** HMAC-SHA-256(secret, clientKey) as 64 lowercase hex; never a plain hash. */
export function hmacClientKey(clientKey: string, secret: string): string {
  return createHmac("sha256", secret).update(clientKey, "utf8").digest("hex");
}

/** The HMAC secret if it is configured and long enough, else null. */
export function readHmacSecret(env: ClientFingerprintEnv): string | null {
  const secret = env.INQUIRY_IP_HMAC_SECRET;
  return secret !== undefined && secret.length >= MIN_HMAC_SECRET_LENGTH ? secret : null;
}

/**
 * Fingerprint for this request, or why none can be produced. Either failure
 * means the caller must fail closed (no insert).
 */
export function computeClientFingerprint(
  headers: HeaderReader,
  env: ClientFingerprintEnv,
): ClientFingerprintResult {
  const secret = readHmacSecret(env);
  if (secret === null) return { ok: false, reason: "config_error" };

  const clientKey = resolveClientKey(headers, env);
  if (clientKey === null) return { ok: false, reason: "ip_unavailable" };

  return { ok: true, fingerprint: hmacClientKey(clientKey, secret) };
}
