import "server-only";

import { and, eq, lte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { clientSessions, clientSignInAttempts } from "@/db/schema";

// Client portal auth writes: portal sessions and the portal sign-in throttle.
// Same rules as ./auth (staff), on separate tables and a separate lock
// namespace, so neither side can affect the other's sessions or limits. Called
// only from src/app/actions/portal-auth.ts and src/lib/portal/session.ts.

/** Rolling-window limits on portal sign-in attempts (DB clock). Same as staff sign-in. */
export const PORTAL_SIGN_IN_RATE_LIMIT = {
  maxPerEmail: 5,
  maxPerIp: 20,
  windowSeconds: 15 * 60,
} as const;

const LOCK_NAMESPACE = "lookdit:portal-sign-in:";

/**
 * Reserve one portal sign-in attempt, atomically with the window check. Returns
 * the attempt id, or null when either key is at its limit (nothing is inserted,
 * and the password must not be checked). See reserveSignInAttempt in ./auth for
 * why the locks come first and always in the same order.
 */
export async function reserveClientSignInAttempt(
  emailFingerprint: string,
  ipFingerprint: string,
): Promise<string | null> {
  const { maxPerEmail, maxPerIp, windowSeconds } = PORTAL_SIGN_IN_RATE_LIMIT;
  const db = getDb();
  const recent = sql`${clientSignInAttempts.createdAt} >= now() - make_interval(secs => ${windowSeconds})`;

  const [, , insertResult] = await db.batch([
    db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${LOCK_NAMESPACE}email:${emailFingerprint}`}, 0))`,
    ),
    db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`${LOCK_NAMESPACE}ip:${ipFingerprint}`}, 0))`,
    ),
    db.execute<{ id: string }>(sql`
      insert into ${clientSignInAttempts} (${sql.identifier(clientSignInAttempts.emailFingerprint.name)}, ${sql.identifier(clientSignInAttempts.ipFingerprint.name)})
      select ${emailFingerprint}, ${ipFingerprint}
      where (
        select count(*) from ${clientSignInAttempts}
        where ${clientSignInAttempts.emailFingerprint} = ${emailFingerprint} and ${recent}
      ) < ${maxPerEmail}
      and (
        select count(*) from ${clientSignInAttempts}
        where ${clientSignInAttempts.ipFingerprint} = ${ipFingerprint} and ${recent}
      ) < ${maxPerIp}
      returning ${sql.identifier(clientSignInAttempts.id.name)}
    `),
  ]);

  return insertResult.rows[0]?.id ?? null;
}

/** After a successful portal sign-in: forget this email's attempts. IP attempts stay. */
export async function clearClientSignInAttemptsForEmail(emailFingerprint: string): Promise<void> {
  await getDb()
    .delete(clientSignInAttempts)
    .where(eq(clientSignInAttempts.emailFingerprint, emailFingerprint));
}

/**
 * Store a new portal session and drop this account's expired ones. Expiry is
 * computed by the DB clock and returned so the cookie expires at the same moment.
 */
export async function insertClientSession(
  tokenHash: string,
  accountId: string,
  ttlSeconds: number,
): Promise<{ expiresAt: Date }> {
  const db = getDb();
  const [, inserted] = await db.batch([
    db
      .delete(clientSessions)
      .where(and(eq(clientSessions.accountId, accountId), lte(clientSessions.expiresAt, sql`now()`))),
    db
      .insert(clientSessions)
      .values({ tokenHash, accountId, expiresAt: sql`now() + make_interval(secs => ${ttlSeconds})` })
      .returning({ expiresAt: clientSessions.expiresAt }),
  ]);
  const row = inserted[0];
  if (!row) throw new Error("Portal session insert returned no row.");
  return row;
}

export async function deleteClientSession(tokenHash: string): Promise<void> {
  await getDb().delete(clientSessions).where(eq(clientSessions.tokenHash, tokenHash));
}
