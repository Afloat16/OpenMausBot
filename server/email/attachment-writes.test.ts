import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";

const writes = vi.hoisted(() => ({ mode: "short" as "short" | "zero" | "fail", calls: 0 }));
vi.mock("node:fs", async (importOriginal) => {
  const fs = await importOriginal<typeof import("node:fs")>();
  return { ...fs, writeSync: (fd: number, buffer: Buffer, offset = 0, length = buffer.length - offset) => {
    writes.calls++;
    if (writes.mode === "zero") return 0;
    if (writes.mode === "fail" && writes.calls > 1) throw Object.assign(new Error("fixture disk full"), { code: "ENOSPC" });
    return fs.writeSync(fd, buffer, offset, Math.min(length, 7));
  } };
});
import { saveAttachment } from "./client.ts";

const folders: string[] = [];
function folder() {
  const path = mkdtempSync(join(tmpdir(), "omb-attachment-writes-"));
  folders.push(path);
  return path;
}
afterEach(() => {
  writes.mode = "short";
  writes.calls = 0;
  for (const path of folders.splice(0)) rmSync(path, { recursive: true, force: true });
});

it("writes every attachment byte when the filesystem accepts only part of each buffer", () => {
  const content = Buffer.from(Array.from({ length: 257 }, (_, index) => index % 256));
  const path = saveAttachment(folder(), "full.bin", content);
  expect(readFileSync(path)).toEqual(content);
  expect(writes.calls).toBeGreaterThan(1);
});

it("fails without leaving an incomplete file when a write makes no progress", () => {
  const dir = folder();
  writes.mode = "zero";
  expect(() => saveAttachment(dir, "empty.bin", Buffer.from("data"))).toThrow(/write/i);
  expect(readdirSync(dir)).toEqual([]);
});

it("removes only its newly created partial file after a later write fails", () => {
  const dir = folder();
  const existing = saveAttachment(dir, "report.bin", Buffer.from("keep"));
  writes.mode = "fail";
  writes.calls = 0;
  expect(() => saveAttachment(dir, "report.bin", Buffer.from("attachment bytes that need several writes"))).toThrow("fixture disk full");
  expect(readdirSync(dir)).toEqual(["report.bin"]);
  expect(readFileSync(existing, "utf8")).toBe("keep");
  writes.mode = "short";
  expect(saveAttachment(dir, "report.bin", Buffer.from("retry"))).toBe(join(dir, "1-report.bin"));
});

it("still creates a legitimate zero-byte attachment without writing", () => {
  const path = saveAttachment(folder(), "zero.bin", Buffer.alloc(0));
  expect(readFileSync(path)).toEqual(Buffer.alloc(0));
});
