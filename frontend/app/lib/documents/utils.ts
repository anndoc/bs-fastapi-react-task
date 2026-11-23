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
