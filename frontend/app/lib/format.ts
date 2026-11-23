const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;

const AGES = [
  { divisor: MONTH, unit: "month", plural: "months" },
  { divisor: DAY, unit: "day", plural: "days" },
  { divisor: HOUR, unit: "hour", plural: "hours" },
  { divisor: MINUTE, unit: "min", plural: "min" },
] as const;

export function formatRelativeTime(
  date: string | Date,
  now = Date.now(),
  prefix = "",
): string {
  const elapsed = now - new Date(date).getTime();
  if (Number.isNaN(elapsed)) return "";
  if (elapsed < MINUTE) return `${prefix}just now`;
  if (elapsed >= 12 * MONTH) return `${prefix}more than 1 year ago`;
  const { divisor, unit, plural } =
    AGES.find((candidate) => elapsed >= candidate.divisor) ??
    AGES[AGES.length - 1];
  const count = Math.floor(elapsed / divisor);
  return `${prefix}${count} ${count === 1 ? unit : plural} ago`;
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
