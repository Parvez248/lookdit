import { describe, expect, it } from "vitest";

import {
  clientKeyFromIp,
  computeClientFingerprint,
  DEV_CLIENT_KEY,
  hmacClientKey,
  MIN_HMAC_SECRET_LENGTH,
  readHmacSecret,
  resolveClientKey,
  TRUSTED_CLIENT_IP_HEADER,
} from "./client-fingerprint";

const SECRET = "s".repeat(MIN_HMAC_SECRET_LENGTH);
const OTHER_SECRET = "t".repeat(MIN_HMAC_SECRET_LENGTH);

function headersWith(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

const vercel = { VERCEL: "1", NODE_ENV: "production", INQUIRY_IP_HMAC_SECRET: SECRET };

describe("resolveClientKey", () => {
  it("trusts x-real-ip on Vercel", () => {
    const headers = headersWith({ [TRUSTED_CLIENT_IP_HEADER]: "203.0.113.7" });
    expect(resolveClientKey(headers, vercel)).toBe("v1|4|203.0.113.7");
  });

  it("never falls back to x-forwarded-for on Vercel", () => {
    const headers = headersWith({ "x-forwarded-for": "203.0.113.7" });
    expect(resolveClientKey(headers, vercel)).toBeNull();
  });

  it("fails closed on Vercel when x-real-ip is missing or malformed", () => {
    for (const value of ["", "   ", "not-an-ip", "203.0.113.7, 198.51.100.1", "1.2.3.4.5"]) {
      const headers = headersWith({ [TRUSTED_CLIENT_IP_HEADER]: value });
      expect(resolveClientKey(headers, vercel)).toBeNull();
    }
  });

  it("uses the fixed loopback key in local development and ignores headers", () => {
    const headers = headersWith({ [TRUSTED_CLIENT_IP_HEADER]: "203.0.113.7" });
    expect(resolveClientKey(headers, { NODE_ENV: "development" })).toBe(DEV_CLIENT_KEY);
  });

  it("has no trusted IP when self-hosted, whatever the headers claim", () => {
    const headers = headersWith({
      [TRUSTED_CLIENT_IP_HEADER]: "203.0.113.7",
      "x-forwarded-for": "203.0.113.7",
    });
    expect(resolveClientKey(headers, { NODE_ENV: "production" })).toBeNull();
    expect(resolveClientKey(headers, { NODE_ENV: "test" })).toBeNull();
    expect(resolveClientKey(headers, { VERCEL: "true", NODE_ENV: "production" })).toBeNull();
  });
});

describe("clientKeyFromIp", () => {
  it("keys IPv4 addresses as-is", () => {
    expect(clientKeyFromIp("198.51.100.23")).toBe("v1|4|198.51.100.23");
    expect(clientKeyFromIp(" 198.51.100.23 ")).toBe("v1|4|198.51.100.23");
  });

  it("rejects non-canonical and invalid IPv4", () => {
    expect(clientKeyFromIp("198.051.100.23")).toBeNull();
    expect(clientKeyFromIp("256.1.1.1")).toBeNull();
  });

  it("unwraps IPv4-mapped IPv6 to the IPv4 key", () => {
    expect(clientKeyFromIp("::ffff:198.51.100.23")).toBe("v1|4|198.51.100.23");
    expect(clientKeyFromIp("::FFFF:C633:6417")).toBe("v1|4|198.51.100.23");
  });

  it("buckets IPv6 by /64", () => {
    expect(clientKeyFromIp("2001:db8:1:2:3:4:5:6")).toBe("v1|6|2001:db8:1:2::/64");
    expect(clientKeyFromIp("2001:db8:1:2:ffff::1")).toBe("v1|6|2001:db8:1:2::/64");
    expect(clientKeyFromIp("2001:db8:1:3::1")).toBe("v1|6|2001:db8:1:3::/64");
  });

  it("gives every spelling of one IPv6 address the same key", () => {
    const expected = "v1|6|2001:db8:0:1::/64";
    for (const spelling of [
      "2001:db8:0:1::1",
      "2001:0DB8:0000:0001:0000:0000:0000:0001",
      "2001:db8::1:0:0:0:1",
    ]) {
      expect(clientKeyFromIp(spelling)).toBe(expected);
    }
  });

  it("handles compressed forms at either end", () => {
    expect(clientKeyFromIp("::1")).toBe("v1|6|0:0:0:0::/64");
    expect(clientKeyFromIp("fd00::")).toBe("v1|6|fd00:0:0:0::/64");
  });

  it("rejects zone ids, lists, garbage and overlong values", () => {
    expect(clientKeyFromIp(null)).toBeNull();
    expect(clientKeyFromIp("fe80::1%eth0")).toBeNull();
    expect(clientKeyFromIp("2001:db8::1, 2001:db8::2")).toBeNull();
    expect(clientKeyFromIp("[2001:db8::1]")).toBeNull();
    expect(clientKeyFromIp("2001:db8::1:::")).toBeNull();
    expect(clientKeyFromIp(`${" ".repeat(60)}1.2.3.4`)).toBeNull();
  });
});

describe("hmacClientKey", () => {
  it("returns 64 lowercase hex, deterministically", () => {
    const fingerprint = hmacClientKey("v1|4|198.51.100.23", SECRET);
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(hmacClientKey("v1|4|198.51.100.23", SECRET)).toBe(fingerprint);
  });

  it("differs by secret and by client key", () => {
    const base = hmacClientKey("v1|4|198.51.100.23", SECRET);
    expect(hmacClientKey("v1|4|198.51.100.23", OTHER_SECRET)).not.toBe(base);
    expect(hmacClientKey("v1|4|198.51.100.24", SECRET)).not.toBe(base);
  });

  it("matches a known HMAC-SHA-256 vector (RFC 4231 test case 2)", () => {
    expect(hmacClientKey("what do ya want for nothing?", "Jefe")).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });
});

describe("readHmacSecret", () => {
  it("rejects a missing or short secret", () => {
    expect(readHmacSecret({})).toBeNull();
    expect(readHmacSecret({ INQUIRY_IP_HMAC_SECRET: "" })).toBeNull();
    expect(readHmacSecret({ INQUIRY_IP_HMAC_SECRET: "x".repeat(MIN_HMAC_SECRET_LENGTH - 1) })).toBeNull();
  });

  it("accepts a secret of at least the minimum length", () => {
    expect(readHmacSecret({ INQUIRY_IP_HMAC_SECRET: SECRET })).toBe(SECRET);
  });
});

describe("computeClientFingerprint", () => {
  const ip = "198.51.100.23";
  const headers = headersWith({ [TRUSTED_CLIENT_IP_HEADER]: ip });

  it("fingerprints the trusted client key on Vercel", () => {
    const result = computeClientFingerprint(headers, vercel);
    expect(result).toEqual({ ok: true, fingerprint: hmacClientKey(`v1|4|${ip}`, SECRET) });
  });

  it("never exposes the raw IP or the client key", () => {
    const serialized = JSON.stringify(computeClientFingerprint(headers, vercel));
    expect(serialized).not.toContain(ip);
    expect(serialized).not.toContain("v1|");
  });

  it("fails with config_error when the secret is missing or short", () => {
    expect(computeClientFingerprint(headers, { VERCEL: "1" })).toEqual({
      ok: false,
      reason: "config_error",
    });
    expect(
      computeClientFingerprint(headers, { VERCEL: "1", INQUIRY_IP_HMAC_SECRET: "short" }),
    ).toEqual({ ok: false, reason: "config_error" });
  });

  it("fails with ip_unavailable when there is no trusted IP", () => {
    expect(
      computeClientFingerprint(headersWith({}), vercel),
    ).toEqual({ ok: false, reason: "ip_unavailable" });
    expect(
      computeClientFingerprint(headers, { NODE_ENV: "production", INQUIRY_IP_HMAC_SECRET: SECRET }),
    ).toEqual({ ok: false, reason: "ip_unavailable" });
  });

  it("works in local development with the loopback key", () => {
    expect(
      computeClientFingerprint(headersWith({}), { NODE_ENV: "development", INQUIRY_IP_HMAC_SECRET: SECRET }),
    ).toEqual({ ok: true, fingerprint: hmacClientKey(DEV_CLIENT_KEY, SECRET) });
  });
});
