import { describe, expect, it } from "vitest";
import { getFileType } from "@/components/documents/types";

describe("getFileType", () => {
  it.each([
    ["report.pdf", "pdf"],
    ["notes.txt", "txt"],
    ["REPORT.PDF", "pdf"],
    ["Notes.TXT", "txt"],
    ["report.pdf.txt", "txt"],
  ])("maps %s to %s", (fileName, expected) => {
    expect(getFileType(fileName)).toBe(expected);
  });

  it.each(["report.docx", "report.pdfx", "pdf", "", "archive.tar.gz"])(
    "returns undefined for %s",
    (fileName) => {
      expect(getFileType(fileName)).toBeUndefined();
    },
  );
});
