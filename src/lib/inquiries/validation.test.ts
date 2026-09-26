import { describe, expect, it } from "vitest";

import {
  INQUIRY_LIMITS,
  type InquiryValidationResult,
  validateInquiryInput,
} from "./validation";

const validInput = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines Ltd",
  message: "We would like a new product website.",
};

function expectIssue(result: InquiryValidationResult, field: string | null, code: string) {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.issues).toContainEqual(expect.objectContaining({ field, code }));
}

describe("validateInquiryInput", () => {
  describe("valid input", () => {
    it("accepts fully valid input unchanged", () => {
      expect(validateInquiryInput(validInput)).toEqual({ ok: true, value: validInput });
    });

    it("accepts input without a company", () => {
      const withoutCompany = {
        name: validInput.name,
        email: validInput.email,
        message: validInput.message,
      };
      expect(validateInquiryInput(withoutCompany)).toEqual({
        ok: true,
        value: { ...withoutCompany, company: null },
      });
    });
  });

  describe("trimming and normalization", () => {
    it("trims name, company and message", () => {
      const result = validateInquiryInput({
        name: "  Ada Lovelace \n",
        email: "ada@example.com",
        company: "\t Analytical Engines Ltd  ",
        message: "\n  Hello there.  \n",
      });
      expect(result).toEqual({
        ok: true,
        value: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          company: "Analytical Engines Ltd",
          message: "Hello there.",
        },
      });
    });

    it("preserves inner whitespace and line breaks in the message", () => {
      const result = validateInquiryInput({ ...validInput, message: " Line one\n\nLine two " });
      expect(result.ok && result.value.message).toBe("Line one\n\nLine two");
    });
  });

  describe("email normalization", () => {
    it("trims and lowercases the email", () => {
      const result = validateInquiryInput({ ...validInput, email: "  Ada.Lovelace@Example.COM  " });
      expect(result.ok && result.value.email).toBe("ada.lovelace@example.com");
    });

    it("accepts plus-addressing and multi-part domains", () => {
      const result = validateInquiryInput({ ...validInput, email: "ada+site@mail.example.co.uk" });
      expect(result.ok && result.value.email).toBe("ada+site@mail.example.co.uk");
    });
  });

  describe("blank required fields", () => {
    it("rejects a whitespace-only name", () => {
      expectIssue(validateInquiryInput({ ...validInput, name: "   \t\n " }), "name", "too_small");
    });

    it("rejects a whitespace-only message", () => {
      expectIssue(validateInquiryInput({ ...validInput, message: " \n\n  " }), "message", "too_small");
    });

    it("rejects a whitespace-only email", () => {
      expectIssue(validateInquiryInput({ ...validInput, email: "   " }), "email", "too_small");
    });

    it.each(["name", "email", "message"] as const)("rejects a missing %s", (field) => {
      const input: Record<string, unknown> = { ...validInput };
      delete input[field];
      expectIssue(validateInquiryInput(input), field, "invalid_type");
    });
  });

  describe("invalid email", () => {
    it.each([
      "not-an-email",
      "missing-at.example.com",
      "ada@",
      "@example.com",
      "ada@example",
      "ada@@example.com",
      "ada lovelace@example.com",
    ])("rejects %j", (email) => {
      expectIssue(validateInquiryInput({ ...validInput, email }), "email", "invalid_format");
    });
  });

  describe("maximum-length boundaries", () => {
    // A syntactically valid address of exactly `length` characters
    // (64-char local part, domain labels of at most 63 characters).
    const emailOfLength = (length: number) =>
      `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(length - 197)}.com`;

    it.each([
      ["name", "n".repeat(INQUIRY_LIMITS.name)],
      ["company", "c".repeat(INQUIRY_LIMITS.company)],
      ["message", "m".repeat(INQUIRY_LIMITS.message)],
    ] as const)("accepts %s at exactly the maximum length", (field, value) => {
      const result = validateInquiryInput({ ...validInput, [field]: value });
      expect(result.ok && result.value[field]).toBe(value);
    });

    it.each([
      ["name", "n".repeat(INQUIRY_LIMITS.name + 1)],
      ["company", "c".repeat(INQUIRY_LIMITS.company + 1)],
      ["message", "m".repeat(INQUIRY_LIMITS.message + 1)],
    ] as const)("rejects %s one character over the maximum", (field, value) => {
      expectIssue(validateInquiryInput({ ...validInput, [field]: value }), field, "too_big");
    });

    it("accepts an email at exactly the maximum length", () => {
      const email = emailOfLength(INQUIRY_LIMITS.email);
      expect(email).toHaveLength(INQUIRY_LIMITS.email);
      const result = validateInquiryInput({ ...validInput, email });
      expect(result.ok && result.value.email).toBe(email);
    });

    it("rejects an email one character over the maximum", () => {
      const email = emailOfLength(INQUIRY_LIMITS.email + 1);
      expect(email).toHaveLength(INQUIRY_LIMITS.email + 1);
      expectIssue(validateInquiryInput({ ...validInput, email }), "email", "too_big");
    });

    it("measures length after trimming", () => {
      const padded = `  ${"n".repeat(INQUIRY_LIMITS.name)}  `;
      const result = validateInquiryInput({ ...validInput, name: padded });
      expect(result.ok && result.value.name).toBe("n".repeat(INQUIRY_LIMITS.name));
    });
  });

  describe("company normalization", () => {
    it.each([
      ["an empty string", ""],
      ["whitespace only", "   \t "],
      ["null", null],
      ["undefined", undefined],
    ])("normalizes %s to null", (_label, company) => {
      const result = validateInquiryInput({ ...validInput, company });
      expect(result.ok && result.value.company).toBeNull();
    });
  });

  describe("NUL character", () => {
    it.each([
      ["name", "Ada\u0000Lovelace"],
      ["company", "Analytical\u0000Engines"],
      ["message", "Hello\u0000there."],
    ] as const)("rejects NUL in %s", (field, value) => {
      expectIssue(validateInquiryInput({ ...validInput, [field]: value }), field, "custom");
    });
  });

  describe("privileged and unknown fields", () => {
    it.each([
      ["status", "replied"],
      ["id", "0190f7e0-0000-7000-8000-000000000000"],
      ["createdAt", "2026-01-01T00:00:00Z"],
      ["updatedAt", "2026-01-01T00:00:00Z"],
      ["ipFingerprint", "a".repeat(64)],
      ["isAdmin", true],
    ])("rejects input containing %s", (field, value) => {
      expectIssue(validateInquiryInput({ ...validInput, [field]: value }), field, "unrecognized_key");
    });

    it("reports every unknown field individually", () => {
      const result = validateInquiryInput({ ...validInput, status: "new", id: "x" });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.issues.map((issue) => issue.field).sort()).toEqual(["id", "status"]);
    });

    it("rejects the input even when all public fields are valid", () => {
      const result = validateInquiryInput({ ...validInput, status: "new" });
      expect(result.ok).toBe(false);
    });
  });

  describe("non-object and malformed input", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["a string", "name=Ada"],
      ["a number", 42],
      ["a boolean", true],
      ["an array", [validInput]],
    ])("rejects %s as a whole-input issue", (_label, input) => {
      expectIssue(validateInquiryInput(input), null, "invalid_type");
    });

    it.each([
      ["name", 123],
      ["email", ["ada@example.com"]],
      ["company", { name: "Acme" }],
      ["message", false],
    ] as const)("rejects a non-string %s", (field, value) => {
      expectIssue(validateInquiryInput({ ...validInput, [field]: value }), field, "invalid_type");
    });
  });

  describe("error messages", () => {
    it("never echoes submitted values", () => {
      const secret = "UNIQUE-SUBMITTED-VALUE";
      const result = validateInquiryInput({
        name: `${secret}${"n".repeat(INQUIRY_LIMITS.name)}`,
        email: `${secret}-not-an-email`,
        company: `${secret}${"c".repeat(INQUIRY_LIMITS.company)}`,
        message: 12,
      });
      expect(result.ok).toBe(false);
      expect(JSON.stringify(result)).not.toContain(secret);
    });
  });
});
