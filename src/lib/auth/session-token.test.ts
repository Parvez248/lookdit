import { describe, expect, it } from "vitest";

import {
  generateSessionToken,
  hashSessionToken,
  isWellFormedSessionToken,
  SESSION_COOKIE_NAME,
} from "./session-token";

describe("session tokens", () => {
  it("are 256-bit base64url strings and never repeat", () => {
    const tokens = Array.from({ length: 100 }, generateSessionToken);
    for (const token of tokens) expect(isWellFormedSessionToken(token)).toBe(true);
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("are stored as a stable SHA-256 that matches the DB format and isn't the token", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(token)).toBe(hash);
    expect(hash).not.toContain(token);
    expect(hashSessionToken(generateSessionToken())).not.toBe(hash);
  });

  it("rejects cookie values that can't be a token before any lookup", () => {
    const token = generateSessionToken();
    for (const value of [undefined, "", token.slice(1), `${token}A`, `${token.slice(1)}=`, `${token.slice(1)}.`]) {
      expect(isWellFormedSessionToken(value), String(value)).toBe(false);
    }
  });

  it("uses a __Host- cookie, so it is Secure, host-only and site-wide", () => {
    expect(SESSION_COOKIE_NAME.startsWith("__Host-")).toBe(true);
  });
});
