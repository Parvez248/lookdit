import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { deleteClientSession, insertClientSession } from "@/db/mutations/portal-auth";
import { findPortalSession, type PortalClient } from "@/db/queries/portal";
import {
  generateSessionToken,
  hashSessionToken,
  isWellFormedSessionToken,
} from "@/lib/auth/session-token";

import { portalRoutes } from "./routes";
import { PORTAL_SESSION_COOKIE_NAME, PORTAL_SESSION_TTL_SECONDS } from "./session-cookie";

// The portal's auth data-access layer. Every portal page and portal Server
// Action checks the session here, on each request. It reads only the portal
// cookie and the client_* tables: a staff session never signs anyone in here,
// and requireUser() (src/lib/auth/session.ts) never accepts a client session.

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

/** The signed-in client, or null. Memoized per request, so repeat calls cost one query. */
export const getCurrentClient = cache(async (): Promise<PortalClient | null> => {
  const token = (await cookies()).get(PORTAL_SESSION_COOKIE_NAME)?.value;
  if (!isWellFormedSessionToken(token)) return null;
  return findPortalSession(hashSessionToken(token));
});

/**
 * The signed-in client; anyone else is sent to the portal sign-in page. Portal
 * project reads take their client id from this, never from the request.
 */
export async function requireClient(): Promise<PortalClient> {
  const client = await getCurrentClient();
  if (client === null) redirect(portalRoutes.signIn);
  return client;
}

/** Create a portal session for `accountId` and set its cookie. Server Actions only. */
export async function startClientSession(accountId: string): Promise<void> {
  const token = generateSessionToken();
  const { expiresAt } = await insertClientSession(
    hashSessionToken(token),
    accountId,
    PORTAL_SESSION_TTL_SECONDS,
  );
  (await cookies()).set(PORTAL_SESSION_COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
}

/**
 * Delete this browser's portal session and clear its cookie, even if the delete
 * fails. Leaves any staff session on the same browser alone. Server Actions only.
 */
export async function endClientSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(PORTAL_SESSION_COOKIE_NAME)?.value;
  try {
    if (isWellFormedSessionToken(token)) await deleteClientSession(hashSessionToken(token));
  } finally {
    store.set(PORTAL_SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
  }
}
