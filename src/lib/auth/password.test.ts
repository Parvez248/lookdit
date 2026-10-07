import { describe, expect, it } from "vitest";

import { getDummyPasswordHash, hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("stores scrypt with its parameters, a 16-byte salt and a 32-byte key", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).toMatch(/^scrypt\$17\$8\$1\$[\w-]{22}\$[\w-]{43}$/);
    expect(hash).not.toContain("correct horse battery");
  });

  it("salts every hash, so the same password never hashes the same twice", async () => {
    expect(await hashPassword("same password here")).not.toBe(await hashPassword("same password here"));
  });

  it("accepts the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("treats Unicode-equivalent spellings of a password as the same password", async () => {
    const hash = await hashPassword("café au lait 2026");
    expect(await verifyPassword("café au lait 2026", hash)).toBe(true);
  });

  it("never matches a malformed or tampered hash", async () => {
    const hash = await hashPassword("correct horse battery");
    const [, , r, p, salt, key] = hash.split("$");
    const variants = [
      "",
      "plain-text-password",
      hash.replace(/^scrypt/, "bcrypt"),
      // Parameters outside what this code writes (memory / time abuse).
      `scrypt$30$${r}$${p}$${salt}$${key}`,
      `scrypt$17$99$${p}$${salt}$${key}`,
      // Truncated key.
      `scrypt$17$${r}$${p}$${salt}$${key.slice(0, 20)}`,
    ];
    for (const stored of variants) {
      expect(await verifyPassword("correct horse battery", stored), stored).toBe(false);
    }
  });

  it("keeps one dummy hash per instance that no submitted password matches", async () => {
    const dummy = await getDummyPasswordHash();
    expect(await getDummyPasswordHash()).toBe(dummy);
    expect(await verifyPassword("", dummy)).toBe(false);
    expect(await verifyPassword("password", dummy)).toBe(false);
  });
});
