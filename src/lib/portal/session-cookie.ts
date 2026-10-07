// The portal's session cookie. Pure, so the separation from the staff cookie is
// testable. Tokens are made and hashed by ../auth/session-token (same rules).

/**
 * Its own name, so a client and a staff member signed in on one browser hold
 * two independent sessions, and each side reads only its own cookie. `__Host-`
 * makes the browser require Secure and Path=/ and refuse a Domain.
 */
export const PORTAL_SESSION_COOKIE_NAME = "__Host-lookdit-portal";

/** Absolute lifetime, as for staff. Sign in again after this. */
export const PORTAL_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
