// Sign-in form state, shared by the Server Action and the client form. Pure.

export type SignInState =
  | { status: "idle" }
  | { status: "error"; message: string; email: string };

export const initialSignInState: SignInState = { status: "idle" };

/**
 * One message for an unknown email, a wrong password and malformed input, so the
 * form never reveals which accounts exist.
 */
export const INVALID_CREDENTIALS_MESSAGE = "That email and password don't match an account.";

/** Keyed on the attempted email and the client, so it reveals nothing about accounts. */
export const RATE_LIMITED_MESSAGE =
  "Too many sign-in attempts. Wait 15 minutes, then try again.";

export const UNAVAILABLE_MESSAGE = "Sign-in isn't available right now. Try again shortly.";
