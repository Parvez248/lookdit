"use server";

// Public boundary for client portal sign-in and sign-out. Every export of a
// "use server" file is a POST-reachable endpoint, so this file exports only these
// two. Same rules as the staff actions in ./auth, against the portal's own
// accounts, sessions and throttle.

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearClientSignInAttemptsForEmail,
  reserveClientSignInAttempt,
} from "@/db/mutations/portal-auth";
import { findClientAccountCredentials } from "@/db/queries/portal";
import { getDummyPasswordHash, verifyPassword } from "@/lib/auth/password";
import { emailFingerprint } from "@/lib/auth/sign-in-keys";
import {
  INVALID_CREDENTIALS_MESSAGE,
  RATE_LIMITED_MESSAGE,
  type SignInState,
  UNAVAILABLE_MESSAGE,
} from "@/lib/auth/sign-in-state";
import { parseSignInForm } from "@/lib/auth/validation";
import { computeClientFingerprint, readHmacSecret } from "@/lib/inquiries/client-fingerprint";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import { portalRoutes } from "@/lib/portal/routes";
import { endClientSession, startClientSession } from "@/lib/portal/session";

/**
 * Sign a client in with email and password. Signature matches `useActionState`.
 *
 * - Malformed input, unknown email or wrong password → the same message.
 * - No trusted client IP or HMAC secret → `UNAVAILABLE_MESSAGE` (fail closed).
 * - Over the per-email or per-IP limit → `RATE_LIMITED_MESSAGE`; the password is
 *   not checked.
 * - Success → a new portal session cookie and a redirect to the portal home.
 *
 * Logs carry fixed event names only: never the email, password, IP or any key.
 */
export async function portalSignIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  if (!(formData instanceof FormData)) {
    return { status: "error", message: UNAVAILABLE_MESSAGE, email: "" };
  }
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.slice(0, 254) : "";
  const fail = (message: string): SignInState => ({ status: "error", message, email });

  const input = parseSignInForm(formData);
  if (input === null) return fail(INVALID_CREDENTIALS_MESSAGE);

  const secret = readHmacSecret(process.env);
  const client = computeClientFingerprint(await headers(), process.env);
  if (secret === null || !client.ok) {
    console.error("[portal-auth] sign-in refused", { event: client.ok ? "config_error" : client.reason });
    return fail(UNAVAILABLE_MESSAGE);
  }

  try {
    const dummyHash = await getDummyPasswordHash();
    const emailKey = emailFingerprint(input.email, secret);
    const attempt = await reserveClientSignInAttempt(emailKey, client.fingerprint);
    if (attempt === null) {
      console.warn("[portal-auth] sign-in rate limited", { event: "rate_limited" });
      return fail(RATE_LIMITED_MESSAGE);
    }

    const account = await findClientAccountCredentials(input.email);
    // Always run one scrypt check, so a missing account costs the same time.
    const matches = await verifyPassword(input.password, account?.passwordHash ?? dummyHash);
    if (account === null || !matches) return fail(INVALID_CREDENTIALS_MESSAGE);

    await clearClientSignInAttemptsForEmail(emailKey);
    await startClientSession(account.id);
  } catch (error) {
    console.error("[portal-auth] sign-in failed", { event: "error", ...describeErrorForLog(error) });
    return fail(UNAVAILABLE_MESSAGE);
  }

  // Outside the try: redirect() works by throwing.
  redirect(portalRoutes.home);
}

/** Sign this browser out of the portal. Safe to call without a session. */
export async function portalSignOut(): Promise<void> {
  try {
    await endClientSession();
  } catch (error) {
    console.error("[portal-auth] sign-out failed", { event: "error", ...describeErrorForLog(error) });
  }
  redirect(portalRoutes.signIn);
}
