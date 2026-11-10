import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { safeAttachmentName, saveAttachment } from "./client.ts";

const folders: string[] = [];
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }); });

it("saves long multibyte names without exceeding the filesystem's component limit", () => {
  const folder = mkdtempSync(join(tmpdir(), "omb-email-name-"));
  folders.push(folder);
  for (const text of ["报告".repeat(100), "𐐀".repeat(100)]) {
    const name = safeAttachmentName(`${text}.pdf`, 0);
    const saved = saveAttachment(folder, name, Buffer.from("complete attachment"));
    expect(readFileSync(saved, "utf8")).toBe("complete attachment");
    expect(Buffer.byteLength(name)).toBeLessThanOrEqual(120);
    expect(name).toMatch(/\.pdf$/u);
    expect(name.isWellFormed()).toBe(true);
  }
});

it.each(["CON", "con.txt", "NUL.pdf", "AUX.doc", "PRN", "COM1.csv", "lpt9.log", "COM¹.txt"])(
  "makes the Windows device name %s a portable attachment name", name => {
    expect(safeAttachmentName(name, 0)).toBe(`_${name}`);
  },
);

it("removes trailing dots and spaces while preserving ordinary names", () => {
  expect(safeAttachmentName("invoice.pdf. ", 0)).toBe("invoice.pdf");
  expect(safeAttachmentName("Rechnung März 2026.pdf", 0)).toBe("Rechnung März 2026.pdf");
  expect(safeAttachmentName("contest.txt", 0)).toBe("contest.txt");
  expect(safeAttachmentName("COM10.txt", 0)).toBe("COM10.txt");
  expect(safeAttachmentName("...", 2)).toBe("attachment-3");
});
