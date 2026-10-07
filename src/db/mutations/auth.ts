import "server-only";

import { and, eq, lte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { sessions, signInAttempts } from "@/db/schema";

// Auth writes: sessions and the sign-in throttle. Called only from the auth
// Server Actions in src/app/actions/auth.ts.

/** Rolling-window limits on sign-in attempts (DB clock). */
export const SIGN_IN_RATE_LIMIT = {
  /** Per attempted email: slows guessing one account's password. */
  maxPerEmail: 5,
  /** Per client IP fingerprint: slows trying many accounts from one place. */
  maxPerIp: 20,
  windowSeconds: 15 * 60,
} as const;

const LOCK_NAMESPACE = "lookdit:sign-in:";

/**
 * Reserve one sign-in attempt for this email and client, atomically with the
 * window check. Returns the attempt id, or null when either key is at its limit
 * (nothing is inserted, and the password must not be checked).
 *
 * Same pattern as the inquiry rate limit: one non-interactive transaction (a
 * neon-http batch) takes per-key advisory locks, then a separate INSERT … WHERE
 * count < limit statement sees every attempt the previous lock holder committed.
 * Reserving BEFORE the password check means parallel requests can't all slip
 * past the count. Locks are always taken email first, then IP, so two
 * transactions can never wait on each other in a cycle.
 */
export async function reserveSignInAttempt(
  emailFingerprint: string,
  ipFingerprint: string,
): Promise<string | null> {
  const { maxPerEmail, maxPerIp, windowSeconds } = SIGN_IN_RATE_LIMIT;
  const db = getDb();
  const recent = sql`${signInAttempts.createdAt} >= now() - make_interval(secs => ${windowSeconds})`;

  const [, , insertResult] = await db.batch([
    db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${LOCK_NAMESPACE}email:${emailFingerprint}`}, 0))`,
    ),
    db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${LOCK_NAMESPACE}ip:${ipFingerprint}`}, 0))`,
    ),
    db.execute<{ id: string }>(sql`
      insert into ${signInAttempts} (${sql.identifier(signInAttempts.emailFingerprint.name)}, ${sql.identifier(signInAttempts.ipFingerprint.name)})
      select ${emailFingerprint}, ${ipFingerprint}
      where (
        select count(*) from ${signInAttempts}
        where ${signInAttempts.emailFingerprint} = ${emailFingerprint} and ${recent}
      ) < ${maxPerEmail}
      and (
        select count(*) from ${signInAttempts}
        where ${signInAttempts.ipFingerprint} = ${ipFingerprint} and ${recent}
      ) < ${maxPerIp}
      returning ${sql.identifier(signInAttempts.id.name)}
    `),
  ]);

  return insertResult.rows[0]?.id ?? null;
}

/**
 * After a successful sign-in: forget this email's attempts (the reserved one and
 * earlier failures). IP attempts stay, so one valid account can't reset the
 * per-IP count for guesses against other accounts.
 */
export async function clearSignInAttemptsForEmail(emailFingerprint: string): Promise<void> {
  await getDb().delete(signInAttempts).where(eq(signInAttempts.emailFingerprint, emailFingerprint));
}

/**
 * Store a new session and drop this user's expired ones. Expiry is computed by
 * the DB clock and returned so the cookie expires at the same moment.
 */
export async function insertSession(
  tokenHash: string,
  userId: string,
  ttlSeconds: number,
): Promise<{ expiresAt: Date }> {
  const db = getDb();
  const [, inserted] = await db.batch([
    db.delete(sessions).where(and(eq(sessions.userId, userId), lte(sessions.expiresAt, sql`now()`))),
    db
      .insert(sessions)
      .values({ tokenHash, userId, expiresAt: sql`now() + make_interval(secs => ${ttlSeconds})` })
      .returning({ expiresAt: sessions.expiresAt }),
  ]);
  const row = inserted[0];
  if (!row) throw new Error("Session insert returned no row.");
  return row;
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
