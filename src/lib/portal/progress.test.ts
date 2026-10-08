import { describe, expect, it } from "vitest";

import { describeTaskProgress, percentOf } from "./progress";

describe("portal progress wording", () => {
  it("says no tasks are set out instead of showing 0 of 0", () => {
    expect(describeTaskProgress(0, 0)).toBe("Tasks not set out yet");
    expect(percentOf(0, 0)).toBe(0);
  });

  it("counts tasks with the right plural", () => {
    expect(describeTaskProgress(0, 1)).toBe("0 of 1 task done");
    expect(describeTaskProgress(3, 8)).toBe("3 of 8 tasks done");
  });

  it("rounds the percentage", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(8, 8)).toBe(100);
  });
});
