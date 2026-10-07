import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { deleteSession, insertSession } from "@/db/mutations/auth";
import { findSessionUser, type SessionUser } from "@/db/queries/auth";

import { adminRoutes } from "./routes";
import {
  generateSessionToken,
  hashSessionToken,
  isWellFormedSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "./session-token";

// The auth data-access layer. Every admin page and every admin Server Action
// checks the session here, on the server, on each request; layouts alone are
// not a guard because they don't re-run on client navigation.

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

/** The signed-in user, or null. Memoized per request, so repeat calls cost one query. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!isWellFormedSessionToken(token)) return null;
  return findSessionUser(hashSessionToken(token));
});

/** The signed-in user; anyone else is sent to the sign-in page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user === null) redirect(adminRoutes.signIn);
  return user;
}

/** Create a session for `userId` and set its cookie. Server Actions only. */
export async function startSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const { expiresAt } = await insertSession(hashSessionToken(token), userId, SESSION_TTL_SECONDS);
  (await cookies()).set(SESSION_COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
}

/**
 * Delete this browser's session row and clear its cookie. The cookie is cleared
 * even if the delete fails, and the attributes match the original so the
 * browser accepts the `__Host-` overwrite. Server Actions only.
 */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  try {
    if (isWellFormedSessionToken(token)) await deleteSession(hashSessionToken(token));
  } finally {
    store.set(SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
  }
}
