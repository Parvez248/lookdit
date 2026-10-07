import { randomBytes, scrypt, type ScryptOptions, timingSafeEqual } from "node:crypto";

// Password hashing with Node's built-in scrypt: no package, memory-hard, and the
// parameters travel inside each stored hash so they can be raised later without
// invalidating existing passwords.
//
// Imports only node:* modules (no `@/` aliases, no `server-only`) so
// scripts/create-admin-user.ts can run it directly under Node.
//
// SECURITY: never log a password or a hash, and never return either to a client.

/** OWASP's scrypt baseline: N = 2^17, r = 8, p = 1 (128 MiB, a few hundred ms). */
const PARAMS = { log2N: 17, r: 8, p: 1 } as const;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

/** Node's default scrypt memory cap (32 MiB) is below what N = 2^17 needs. */
const MAX_MEMORY = 256 * 1024 * 1024;

/** Upper bound before hashing, so a huge input can't make each attempt expensive. */
export const MAX_PASSWORD_LENGTH = 256;
/** For new passwords only; sign-in accepts any length up to the maximum. */
export const MIN_PASSWORD_LENGTH = 12;

function deriveKey(password: string, salt: Buffer, log2N: number, r: number, p: number) {
  const options: ScryptOptions = { N: 2 ** log2N, r, p, maxmem: MAX_MEMORY };
  return new Promise<Buffer>((resolve, reject) => {
    // Async, so the hash runs on the libuv pool instead of blocking the server.
    scrypt(password.normalize("NFKC"), salt, KEY_BYTES, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** `scrypt$17$8$1$<salt base64url>$<key base64url>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, PARAMS.log2N, PARAMS.r, PARAMS.p);
  return ["scrypt", PARAMS.log2N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

type ParsedHash = { log2N: number; r: number; p: number; salt: Buffer; key: Buffer };

const HASH_PATTERN = /^scrypt\$(\d{1,2})\$(\d{1,2})\$(\d{1,2})\$([\w-]{16,})\$([\w-]{43})$/;

function parseHash(stored: string): ParsedHash | null {
  const match = HASH_PATTERN.exec(stored);
  if (!match) return null;
  const [log2N, r, p] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Only accept parameters this code could have written, so a tampered row can't
  // ask for an absurd amount of memory or time.
  if (log2N < 14 || log2N > 20 || r < 1 || r > 16 || p < 1 || p > 4) return null;
  return { log2N, r, p, salt: Buffer.from(match[4], "base64url"), key: Buffer.from(match[5], "base64url") };
}

/** True only when `password` matches `stored`. A malformed hash never matches. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (parsed === null || parsed.key.length !== KEY_BYTES) return false;
  const key = await deriveKey(password, parsed.salt, parsed.log2N, parsed.r, parsed.p);
  return timingSafeEqual(key, parsed.key);
}

/**
 * A real hash of a random password, made once per server instance. Sign-in checks
 * it when the email has no account, so a missing account takes as long as a
 * wrong password and response times don't reveal which emails exist.
 */
let dummyHash: Promise<string> | undefined;
export function getDummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(32).toString("base64url"));
  return dummyHash;
}
