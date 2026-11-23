import { describe, expect, it } from "vitest";
import { formatSize } from "@/lib/documents/utils";

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
