import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";

// Auth reads. Called only from src/lib/auth (the DAL and the sign-in action);
// pages read the signed-in user through the DAL, never from here directly.

/** What the admin UI may know about the signed-in user. Never the password hash. */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/** The user behind an unexpired session, or null. Expiry uses the DB clock. */
export async function findSessionUser(tokenHash: string): Promise<SessionUser | null> {
  const [row] = await getDb()
    .select({ id: users.id, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, sql`now()`)))
    .limit(1);
  return row ?? null;
}

/** Sign-in only: the id and stored hash for a normalized email, or null. */
export async function findUserCredentials(
  email: string,
): Promise<{ id: string; passwordHash: string } | null> {
  const [row] = await getDb()
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row ?? null;
}
