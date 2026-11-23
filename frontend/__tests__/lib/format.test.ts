import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "@/lib/format";

const NOW = Date.parse("2026-11-17T12:00:00Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

const ago = (ms: number) => new Date(NOW - ms);

describe("formatRelativeTime", () => {
  it.each([
    [0, "just now"],
    [MINUTE - 1, "just now"],
    [MINUTE, "1 min ago"],
    [59 * MINUTE, "59 min ago"],
    [HOUR, "1 hour ago"],
    [2 * HOUR, "2 hours ago"],
    [DAY - 1, "23 hours ago"],
    [DAY, "1 day ago"],
    [29 * DAY, "29 days ago"],
    [MONTH, "1 month ago"],
    [11 * MONTH, "11 months ago"],
    [12 * MONTH - 1, "11 months ago"],
    [12 * MONTH, "more than 1 year ago"],
    [5 * 365 * DAY, "more than 1 year ago"],
  ])("formats %i ms ago as %s", (elapsed, expected) => {
    expect(formatRelativeTime(ago(elapsed), NOW)).toBe(expected);
  });

  it("accepts ISO strings with a timezone offset", () => {
    expect(formatRelativeTime("2026-11-17T13:00:00+02:00", NOW)).toBe(
      "1 hour ago",
    );
  });

  it("treats future dates as just now", () => {
    expect(formatRelativeTime(ago(-HOUR), NOW)).toBe("just now");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatRelativeTime("not a date", NOW)).toBe("");
  });

  it("defaults now to the current time", () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * HOUR))).toBe(
      "3 hours ago",
    );
  });

  it("prepends the given prefix", () => {
    expect(formatRelativeTime(ago(2 * HOUR), NOW, "Uploaded ")).toBe(
      "Uploaded 2 hours ago",
    );
    expect(formatRelativeTime(ago(0), NOW, "Uploaded ")).toBe(
      "Uploaded just now",
    );
  });

  it("returns an empty string for an invalid date even with a prefix", () => {
    expect(formatRelativeTime("not a date", NOW, "Uploaded ")).toBe("");
  });
});
