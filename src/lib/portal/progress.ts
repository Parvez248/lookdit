// Portal wording for progress and due dates. Pure, so the copy rules are testable.

/** "3 of 8 tasks done", or a calm note when no tasks have been set out yet. */
export function describeTaskProgress(done: number, total: number): string {
  if (total === 0) return "Tasks not set out yet";
  return `${done} of ${total} ${total === 1 ? "task" : "tasks"} done`;
}

export function percentOf(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
