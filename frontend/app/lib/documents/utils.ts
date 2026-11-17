export { cn } from "cn";

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

const SIZE_UNITS = [
  { divisor: GB, unit: "gigabyte" },
  { divisor: MB, unit: "megabyte" },
  { divisor: KB, unit: "kilobyte" },
] as const;

export function formatSize(bytes: number): string {
  const { divisor, unit } =
    SIZE_UNITS.find((candidate) => bytes >= candidate.divisor) ?? SIZE_UNITS[2];
  return new Intl.NumberFormat("en", {
    style: "unit",
    unit,
    maximumFractionDigits: 1,
  }).format(bytes / divisor);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

const UPLOAD_AGES = [
  { divisor: MONTH, unit: "month", plural: "months" },
  { divisor: DAY, unit: "day", plural: "days" },
  { divisor: HOUR, unit: "hour", plural: "hours" },
  { divisor: MINUTE, unit: "min", plural: "min" },
] as const;

export function formatUploaded(date: string | Date, now = Date.now()): string {
  const elapsed = now - new Date(date).getTime();
  if (Number.isNaN(elapsed)) return "";
  if (elapsed < MINUTE) return "Uploaded just now";
  if (elapsed >= 12 * MONTH) return "Uploaded more than 1 year ago";
  const { divisor, unit, plural } =
    UPLOAD_AGES.find((candidate) => elapsed >= candidate.divisor) ??
    UPLOAD_AGES[UPLOAD_AGES.length - 1];
  const count = Math.floor(elapsed / divisor);
  return `Uploaded ${count} ${count === 1 ? unit : plural} ago`;
}
