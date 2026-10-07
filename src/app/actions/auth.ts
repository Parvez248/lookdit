"use server";

// Public boundary for admin sign-in and sign-out. Every export of a "use server"
// file is a POST-reachable endpoint, so this file exports only these two.

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { clearSignInAttemptsForEmail, reserveSignInAttempt } from "@/db/mutations/auth";
import { findUserCredentials } from "@/db/queries/auth";
import { computeClientFingerprint, readHmacSecret } from "@/lib/inquiries/client-fingerprint";
import { describeErrorForLog } from "@/lib/inquiries/submission";
import { getDummyPasswordHash, verifyPassword } from "@/lib/auth/password";
import { adminRoutes } from "@/lib/auth/routes";
import { endSession, startSession } from "@/lib/auth/session";
import { emailFingerprint } from "@/lib/auth/sign-in-keys";
import {
  INVALID_CREDENTIALS_MESSAGE,
  RATE_LIMITED_MESSAGE,
  type SignInState,
  UNAVAILABLE_MESSAGE,
} from "@/lib/auth/sign-in-state";
import { parseSignInForm } from "@/lib/auth/validation";

/**
 * Sign in with email and password. Signature matches `useActionState`.
 *
 * - Malformed input, unknown email or wrong password → the same message.
 * - No trusted client IP or HMAC secret → `UNAVAILABLE_MESSAGE` (fail closed).
 * - Over the per-email or per-IP limit → `RATE_LIMITED_MESSAGE`; the password is
 *   not checked.
 * - Success → a new session cookie and a redirect to the dashboard.
 *
 * Logs carry fixed event names only: never the email, password, IP or any key.
 */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
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
    console.error("[auth] sign-in refused", { event: client.ok ? "config_error" : client.reason });
    return fail(UNAVAILABLE_MESSAGE);
  }

  try {
    // Awaited on every path, so the one-off cost of making it lands on whichever
    // request comes first, not only on requests for missing accounts.
    const dummyHash = await getDummyPasswordHash();
    const emailKey = emailFingerprint(input.email, secret);
    const attempt = await reserveSignInAttempt(emailKey, client.fingerprint);
    if (attempt === null) {
      console.warn("[auth] sign-in rate limited", { event: "rate_limited" });
      return fail(RATE_LIMITED_MESSAGE);
    }

    const user = await findUserCredentials(input.email);
    // Always run one scrypt check, so a missing account costs the same time.
    const matches = await verifyPassword(input.password, user?.passwordHash ?? dummyHash);
    if (user === null || !matches) return fail(INVALID_CREDENTIALS_MESSAGE);

    await clearSignInAttemptsForEmail(emailKey);
    await startSession(user.id);
  } catch (error) {
    console.error("[auth] sign-in failed", { event: "error", ...describeErrorForLog(error) });
    return fail(UNAVAILABLE_MESSAGE);
  }

  // Outside the try: redirect() works by throwing.
  redirect(adminRoutes.home);
}

/** Sign out this browser. Safe to call without a session. */
export async function signOut(): Promise<void> {
  try {
    await endSession();
  } catch (error) {
    console.error("[auth] sign-out failed", { event: "error", ...describeErrorForLog(error) });
  }
  redirect(adminRoutes.signIn);
}
