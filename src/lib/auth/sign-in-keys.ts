import { hmacClientKey } from "../inquiries/client-fingerprint";

// The sign-in throttle's per-email key. The per-IP key is the same client
// fingerprint the inquiry form uses (computeClientFingerprint).
//
// PRIVACY: the attempted email is stored only as an HMAC, so the attempts table
// never holds addresses people typed. The `v1|email|` prefix keeps these values
// in a different domain from the IP fingerprints made with the same secret.

export function emailFingerprint(normalizedEmail: string, secret: string): string {
  return hmacClientKey(`v1|email|${normalizedEmail}`, secret);
}
