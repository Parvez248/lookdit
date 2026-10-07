import { describe, expect, it } from "vitest";

import { formatDateTimeUtc, formatDateUtc } from "./format-date";

describe("admin date formatting", () => {
  it("always renders UTC, labelled, whatever the server timezone", () => {
    const date = new Date("2026-10-07T23:05:00Z");
    expect(formatDateTimeUtc(date)).toBe("7 Oct 2026, 23:05 UTC");
    expect(formatDateUtc(date)).toBe("7 Oct 2026");
  });
});
