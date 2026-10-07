import { describe, expect, it } from "vitest";

import {
  INQUIRY_STATUSES,
  inquiryListHref,
  isInquiryId,
  isInquiryStatus,
  parseInquiryListParams,
} from "./status";

describe("inquiry statuses", () => {
  it("accept only the five statuses the DB allows", () => {
    for (const status of INQUIRY_STATUSES) expect(isInquiryStatus(status)).toBe(true);
    for (const value of ["", "New", "deleted", null, undefined, 1, ["new"]]) {
      expect(isInquiryStatus(value), String(value)).toBe(false);
    }
  });

  it("accept only canonical lowercase UUIDs as ids", () => {
    expect(isInquiryId("0199b8a2-3c4d-7e5f-8a9b-0c1d2e3f4a5b")).toBe(true);
    for (const value of ["", "1", "0199B8A2-3C4D-7E5F-8A9B-0C1D2E3F4A5B", "0199b8a2-3c4d-7e5f-8a9b-0c1d2e3f4a5b'", undefined]) {
      expect(isInquiryId(value), String(value)).toBe(false);
    }
  });
});

describe("inquiry list params", () => {
  it("reads a valid status and page", () => {
    expect(parseInquiryListParams({ status: "replied", page: "3" })).toEqual({ status: "replied", page: 3 });
  });

  it("falls back to all statuses and page 1 for anything else", () => {
    for (const params of [{}, { status: "nope", page: "0" }, { status: ["new", "spam"], page: "-2" }, { page: "1e3" }, { page: "9999999" }]) {
      expect(parseInquiryListParams(params), JSON.stringify(params)).toEqual({ status: null, page: 1 });
    }
  });

  it("builds short URLs that round-trip", () => {
    expect(inquiryListHref(null)).toBe("/admin/inquiries");
    expect(inquiryListHref("new", 1)).toBe("/admin/inquiries?status=new");
    const href = inquiryListHref("spam", 4);
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(parseInquiryListParams(params)).toEqual({ status: "spam", page: 4 });
  });
});
