import { describe, expect, it } from "vitest";
import { formatSize, formatUploaded } from "@/lib/documents/utils";

const NOW = Date.parse("2026-11-17T12:00:00Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

const ago = (ms: number) => new Date(NOW - ms);

describe("formatUploaded", () => {
  it.each([
    [0, "Uploaded just now"],
    [MINUTE - 1, "Uploaded just now"],
    [MINUTE, "Uploaded 1 min ago"],
    [59 * MINUTE, "Uploaded 59 min ago"],
    [HOUR, "Uploaded 1 hour ago"],
    [2 * HOUR, "Uploaded 2 hours ago"],
    [DAY - 1, "Uploaded 23 hours ago"],
    [DAY, "Uploaded 1 day ago"],
    [29 * DAY, "Uploaded 29 days ago"],
    [MONTH, "Uploaded 1 month ago"],
    [11 * MONTH, "Uploaded 11 months ago"],
    [12 * MONTH - 1, "Uploaded 11 months ago"],
    [12 * MONTH, "Uploaded more than 1 year ago"],
    [5 * 365 * DAY, "Uploaded more than 1 year ago"],
  ])("formats %i ms ago as %s", (elapsed, expected) => {
    expect(formatUploaded(ago(elapsed), NOW)).toBe(expected);
  });

  it("accepts ISO strings with a timezone offset", () => {
    expect(formatUploaded("2026-11-17T13:00:00+02:00", NOW)).toBe(
      "Uploaded 1 hour ago",
    );
  });

  it("treats future dates as just now", () => {
    expect(formatUploaded(ago(-HOUR), NOW)).toBe("Uploaded just now");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatUploaded("not a date", NOW)).toBe("");
  });

  it("defaults now to the current time", () => {
    expect(formatUploaded(new Date(Date.now() - 3 * HOUR))).toBe(
      "Uploaded 3 hours ago",
    );
  });
});

describe("formatSize", () => {
  it.each([
    [0, "0 kB"],
    [512, "0.5 kB"],
    [1024, "1 kB"],
    [1536, "1.5 kB"],
    [1048575, "1,024 kB"],
    [1048576, "1 MB"],
    [2621440, "2.5 MB"],
    [1073741824, "1 GB"],
    [1610612736, "1.5 GB"],
  ])("formats %i bytes as %s", (bytes, expected) => {
    expect(formatSize(bytes)).toBe(expected);
  });
});
