import { describe, expect, it } from "vitest";

import { clientListHref, parseClientListParams } from "./status";
import { parseClientForm } from "./validation";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("client form", () => {
  it("normalizes a full form", () => {
    const result = parseClientForm(
      form({
        name: "  Amira Haddad ",
        company: " Northwind Studio ",
        email: " Amira@Northwind.Example ",
        phone: "+44 (0)20 7946-0958",
        website: "northwind.example/about",
        notes: " Met at the October workshop. ",
        status: "active",
        // Unknown fields are ignored, never stored.
        id: "x",
        createdAt: "2000-01-01",
      }),
    );
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Amira Haddad",
        company: "Northwind Studio",
        email: "amira@northwind.example",
        phone: "+44 (0)20 7946-0958",
        website: "https://northwind.example/about",
        notes: "Met at the October workshop.",
        status: "active",
      },
    });
  });

  it("turns empty optional fields into null", () => {
    const result = parseClientForm(form({ name: "Mei Chen", company: " ", email: "", phone: "", website: "", notes: "", status: "lead" }));
    expect(result).toEqual({
      ok: true,
      value: { name: "Mei Chen", company: null, email: null, phone: null, website: null, notes: null, status: "lead" },
    });
  });

  it("reports one message per invalid field", () => {
    const result = parseClientForm(
      form({ name: " ", email: "not-an-email", phone: "call me", website: "javascript:alert(1)", status: "vip" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["email", "name", "phone", "status", "website"]);
  });

  it("accepts only http(s) websites with a real host", () => {
    for (const website of ["ftp://example.com", "https://localhost", "data:text/html,hi", "http://"]) {
      const result = parseClientForm(form({ name: "X", website, status: "lead" }));
      expect(result.ok, website).toBe(false);
    }
    const ok = parseClientForm(form({ name: "X", website: "http://example.com", status: "lead" }));
    expect(ok.ok && ok.value.website).toBe("http://example.com/");
  });

  it("enforces length limits and rejects NUL", () => {
    expect(parseClientForm(form({ name: "x".repeat(121), status: "lead" })).ok).toBe(false);
    expect(parseClientForm(form({ name: "a\u0000b", status: "lead" })).ok).toBe(false);
    expect(parseClientForm(form({ name: "ok", notes: "n".repeat(5001), status: "lead" })).ok).toBe(false);
  });
});

describe("client list params", () => {
  it("round-trips status and page, and falls back for junk", () => {
    expect(parseClientListParams({ status: "past", page: "2" })).toEqual({ status: "past", page: 2 });
    expect(parseClientListParams({ status: "vip", page: "0" })).toEqual({ status: null, page: 1 });
    expect(clientListHref("active", 3)).toBe("/admin/clients?status=active&page=3");
    expect(clientListHref(null)).toBe("/admin/clients");
  });
});
