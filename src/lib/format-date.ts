// Admin timestamps. Shown in UTC, and labelled as such, so a server render never
// silently uses the server's timezone. Pure.

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "7 Oct 2026, 15:25 UTC" */
export function formatDateTimeUtc(date: Date): string {
  return `${dateTime.format(date)} UTC`;
}

/** "7 Oct 2026" */
export function formatDateUtc(date: Date): string {
  return dateOnly.format(date);
}
