import { describe, expect, it } from "vitest";

import { selectedWork } from "./work";

describe("selectedWork capability maps", () => {
  for (const item of selectedWork.items) {
    it(`${item.slug}: every span runs forwards`, () => {
      for (const span of item.map.spans) {
        expect(span.from).toBeLessThanOrEqual(span.to);
      }
    });

    it(`${item.slug}: each capability appears once`, () => {
      const names = item.map.spans.map((span) => span.capability);
      expect(new Set(names).size).toBe(names.length);
    });
  }
});
