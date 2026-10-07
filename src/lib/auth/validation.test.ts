import { describe, expect, it } from "vitest";

import { hmacClientKey } from "../inquiries/client-fingerprint";
import { emailFingerprint } from "./sign-in-keys";
import { parseSignInForm } from "./validation";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("sign-in input", () => {
  it("normalizes the email and keeps the password exactly as typed", () => {
    expect(parseSignInForm(form({ email: "  Team@LookDit.com ", password: " pass word " }))).toEqual({
      email: "team@lookdit.com",
      password: " pass word ",
    });
  });

  it("rejects missing, malformed and oversized input", () => {
    const cases: Record<string, string>[] = [
      {},
      { email: "team@lookdit.com" },
      { password: "secret" },
      { email: "not-an-email", password: "secret" },
      { email: "team@lookdit.com", password: "" },
      { email: "team@lookdit.com", password: "x".repeat(257) },
      { email: `${"a".repeat(250)}@x.co`, password: "secret" },
    ];
    for (const fields of cases) expect(parseSignInForm(form(fields)), JSON.stringify(fields)).toBeNull();
  });
});

describe("email fingerprint", () => {
  const secret = "s".repeat(43);

  it("is a 64-hex HMAC that never contains the address", () => {
    const fingerprint = emailFingerprint("team@lookdit.com", secret);
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprint).not.toContain("lookdit");
  });

  it("depends on the secret and differs from the IP fingerprint domain", () => {
    expect(emailFingerprint("team@lookdit.com", secret)).toBe(emailFingerprint("team@lookdit.com", secret));
    expect(emailFingerprint("team@lookdit.com", "t".repeat(43))).not.toBe(
      emailFingerprint("team@lookdit.com", secret),
    );
    expect(emailFingerprint("team@lookdit.com", secret)).not.toBe(hmacClientKey("team@lookdit.com", secret));
  });
});
