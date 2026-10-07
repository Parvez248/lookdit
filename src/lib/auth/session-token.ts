import { createHash, randomBytes } from "node:crypto";

// Session tokens. Pure, so the rules are unit-testable. The browser holds the
// token; the database holds only its SHA-256, so a leaked sessions table can't
// be turned back into working cookies. A plain hash is enough here (unlike for
// passwords) because the token is 256 random bits, not something guessable.

/** `__Host-` makes the browser require Secure and Path=/ and refuse a Domain. */
export const SESSION_COOKIE_NAME = "__Host-lookdit-session";

/** Absolute lifetime. Sessions are not extended on use; sign in again after this. */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const TOKEN_BYTES = 32;
/** 32 bytes as base64url without padding is exactly 43 characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Rejects anything that can't be a token before it costs a hash or a query. */
export function isWellFormedSessionToken(value: string | undefined): value is string {
  return value !== undefined && TOKEN_PATTERN.test(value);
}

/** SHA-256 as 64 lowercase hex: the `sessions.token_hash` value. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
