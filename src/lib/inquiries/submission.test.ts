import { describe, expect, it } from "vitest";

import {
  describeErrorForLog,
  GENERIC_SUBMIT_ERROR_MESSAGE,
  INQUIRY_HONEYPOT_FIELD,
  isHoneypotFilled,
  pickInquiryFields,
  toSubmitInquiryState,
} from "./submission";
import { validateInquiryInput } from "./validation";

function formDataOf(entries: Record<string, string | Blob>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.append(key, value);
  return formData;
}

const validFields = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines Ltd",
  message: "We would like a new product website.",
};

describe("pickInquiryFields", () => {
  it("picks exactly the four public fields", () => {
    expect(pickInquiryFields(formDataOf(validFields))).toEqual(validFields);
  });

  it("ignores Next action keys, the honeypot and injected privileged keys", () => {
    const picked = pickInquiryFields(
      formDataOf({
        ...validFields,
        $ACTION_ID_abc123: "",
        [INQUIRY_HONEYPOT_FIELD]: "",
        status: "replied",
        id: "0190f7e0-0000-7000-8000-000000000000",
        createdAt: "2026-01-01T00:00:00Z",
        ipFingerprint: "a".repeat(64),
      }),
    );
    expect(Object.keys(picked).sort()).toEqual(["company", "email", "message", "name"]);
    // The picked object passes the strict schema, so no extra key slipped through.
    expect(validateInquiryInput(picked).ok).toBe(true);
  });

  it("returns null for missing fields, which validation then rejects", () => {
    const picked = pickInquiryFields(formDataOf({ name: "Ada" }));
    expect(picked).toEqual({ name: "Ada", email: null, company: null, message: null });
    expect(validateInquiryInput(picked).ok).toBe(false);
  });

  it("passes file uploads through so validation rejects them", () => {
    const picked = pickInquiryFields(
      formDataOf({ ...validFields, message: new File(["hello"], "message.txt") }),
    );
    expect(picked.message).toBeInstanceOf(File);
    const result = validateInquiryInput(picked);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ field: "message", code: "invalid_type" }),
      );
    }
  });

  it("takes the first value when a field is repeated", () => {
    const formData = formDataOf(validFields);
    formData.append("name", "Second Name");
    expect(pickInquiryFields(formData).name).toBe("Ada Lovelace");
  });
});

describe("isHoneypotFilled", () => {
  it("is false when the honeypot is absent", () => {
    expect(isHoneypotFilled(formDataOf(validFields))).toBe(false);
  });

  it.each(["", "   ", "\t\n"])("is false for empty or whitespace value %j", (value) => {
    expect(isHoneypotFilled(formDataOf({ ...validFields, [INQUIRY_HONEYPOT_FIELD]: value }))).toBe(
      false,
    );
  });

  it("is true when the honeypot has text", () => {
    expect(
      isHoneypotFilled(formDataOf({ ...validFields, [INQUIRY_HONEYPOT_FIELD]: "https://spam.example" })),
    ).toBe(true);
  });

  it("is true when the honeypot carries a file", () => {
    expect(
      isHoneypotFilled(formDataOf({ [INQUIRY_HONEYPOT_FIELD]: new File(["x"], "x.txt") })),
    ).toBe(true);
  });
});

describe("toSubmitInquiryState", () => {
  it("maps success to a bare success state without id or timestamps", () => {
    // The real createInquiry success shape, including the fields that must be dropped.
    const created = {
      ok: true as const,
      value: { id: "0190f7e0-0000-7000-8000-000000000000", createdAt: new Date() },
    };
    expect(toSubmitInquiryState(created)).toEqual({ status: "success" });
  });

  it("maps validation issues to one message per field", () => {
    const result = validateInquiryInput({
      name: "   ",
      email: "not-an-email",
      company: "c".repeat(161),
      message: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const state = toSubmitInquiryState(result);
    expect(state.status).toBe("invalid");
    if (state.status !== "invalid") return;
    expect(Object.keys(state.fieldErrors).sort()).toEqual(["company", "email", "message", "name"]);
    expect(state.fieldErrors.name).toBe("Name is required.");
    expect(state.fieldErrors.email).toBe("Enter a valid email address.");
  });

  it("keeps the first issue when a field has several", () => {
    const state = toSubmitInquiryState({
      ok: false,
      issues: [
        { field: "email", code: "too_small", message: "First" },
        { field: "email", code: "invalid_format", message: "Second" },
      ],
    });
    expect(state).toEqual({ status: "invalid", fieldErrors: { email: "First" } });
  });

  it("ignores issues for non-form fields", () => {
    const state = toSubmitInquiryState({
      ok: false,
      issues: [
        { field: "status", code: "unrecognized_key", message: "This field is not allowed." },
        { field: "name", code: "too_small", message: "Name is required." },
      ],
    });
    expect(state).toEqual({ status: "invalid", fieldErrors: { name: "Name is required." } });
  });

  it("falls back to the generic error when no issue maps to a form field", () => {
    const state = toSubmitInquiryState({
      ok: false,
      issues: [{ field: null, code: "invalid_type", message: "Invalid input" }],
    });
    expect(state).toEqual({ status: "error", message: GENERIC_SUBMIT_ERROR_MESSAGE });
  });

  it("never echoes submitted values", () => {
    const secret = "UNIQUE-SUBMITTED-VALUE";
    const result = validateInquiryInput({
      name: `${secret}${"n".repeat(200)}`,
      email: `${secret}-not-an-email`,
      company: `${secret}\u0000`,
      message: `${secret}${"m".repeat(6000)}`,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(JSON.stringify(toSubmitInquiryState(result))).not.toContain(secret);
  });
});

describe("describeErrorForLog", () => {
  const secret = "ada@example.com";

  it("reports the SQLSTATE from a wrapped driver error and never the message", () => {
    // Shape of drizzle's DrizzleQueryError: params (inquiry values) in the message,
    // the driver error (with a SQLSTATE code) as the cause.
    const cause = Object.assign(new Error(`violates check constraint, row (${secret})`), {
      code: "23514",
    });
    const error = new Error(`Failed query: insert into "inquiries" params: ${secret}`, { cause });
    const described = describeErrorForLog(error);
    expect(described).toEqual({ type: "Error", code: "23514" });
    expect(JSON.stringify(described)).not.toContain(secret);
  });

  it("reports a top-level SQLSTATE code", () => {
    const error = Object.assign(new Error(secret), { code: "08006" });
    expect(describeErrorForLog(error)).toEqual({ type: "Error", code: "08006" });
  });

  it("ignores codes that are not SQLSTATE-shaped", () => {
    const error = Object.assign(new Error(secret), { code: "ECONNRESET" });
    expect(describeErrorForLog(error)).toEqual({ type: "Error" });
  });

  it("describes non-Error throws by type only", () => {
    expect(describeErrorForLog(secret)).toEqual({ type: "string" });
    expect(describeErrorForLog(null)).toEqual({ type: "object" });
  });

  it("keeps the error subclass name", () => {
    expect(describeErrorForLog(new TypeError(secret))).toEqual({ type: "TypeError" });
  });
});
