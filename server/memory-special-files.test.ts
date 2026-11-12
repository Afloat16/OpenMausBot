import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const dirs: string[] = [];
const botId = "memory-file-probe";
const repo = fileURLToPath(new URL("../", import.meta.url));
const source = `
  import fs from "node:fs";
  import { execFileSync } from "node:child_process";
  import { syncBuiltinESMExports } from "node:module";
  import { join } from "node:path";
  import { readMemoryDoc, memoryOverview, writeMemoryDoc, deleteMemoryDoc } from "./server/memory-store.ts";
  const [operation, relative, swap] = process.argv.slice(1);
  const bot = "memory-file-probe";
  if (swap === "fifo") {
    const file = join(process.env.OMB_DATA_DIR, "workspaces", bot, relative);
    const original = fs.lstatSync;
    let armed = true;
    fs.lstatSync = (...args) => {
      const result = original(...args);
      if (armed && args[0] === file) {
        armed = false;
        fs.unlinkSync(file);
        execFileSync("mkfifo", [file]);
      }
      return result;
    };
    syncBuiltinESMExports();
  }
  try {
    const value = operation === "overview" ? memoryOverview(bot)
      : operation === "write" ? writeMemoryDoc(bot, relative, "replacement")
      : operation === "delete" ? deleteMemoryDoc(bot, relative)
      : readMemoryDoc(bot, relative);
    console.log(JSON.stringify({ value }));
  } catch (error) {
    console.log(JSON.stringify({ name: error.name, code: error.code, status: error.status }));
  }
`;

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "omb-memory-special-"));
  dirs.push(dir);
  const root = join(dir, "workspaces", botId);
  mkdirSync(join(root, "memory"), { recursive: true });
  writeFileSync(join(root, "MEMORY.md"), "ordinary memory\n");
  return { dir, root };
}

function run(dir: string, operation: string, relative: string, swap = "") {
  const child = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "--eval", source, operation, relative, swap], {
    cwd: repo,
    env: { ...process.env, OMB_DATA_DIR: dir },
    encoding: "utf8",
    timeout: 5_000,
  });
  expect(child.error, child.stderr).toBeUndefined();
  expect(child.status, child.stderr).toBe(0);
  return JSON.parse(child.stdout) as { name?: string; code?: string; status?: number; value?: { text: string; exists: boolean } };
}

afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe("memory files through the real filesystem", () => {
  it.skipIf(process.platform === "win32").each(["read", "overview", "write", "delete"])("%s refuses a FIFO without waiting for a writer", (operation) => {
    const { dir, root } = fixture();
    const relative = operation === "overview" ? "MEMORY.md" : "memory/topic.md";
    rmSync(join(root, relative), { force: true });
    execFileSync("mkfifo", [join(root, relative)]);
    expect(run(dir, operation, relative)).toMatchObject({ name: "MemoryStoreError", code: "path", status: 400 });
  }, 10_000);

  it.skipIf(process.platform === "win32")("rejects a FIFO swapped in after the path check", () => {
    const { dir, root } = fixture();
    writeFileSync(join(root, "memory/topic.md"), "ordinary note");
    expect(run(dir, "read", "memory/topic.md", "fifo")).toMatchObject({ name: "MemoryStoreError", code: "path", status: 400 });
  }, 10_000);

  it("refuses directories as memory documents", () => {
    const { dir, root } = fixture();
    mkdirSync(join(root, "memory/topic.md"));
    expect(run(dir, "read", "memory/topic.md")).toMatchObject({ name: "MemoryStoreError", code: "path", status: 400 });
  });

  it("reads regular and missing documents with the existing contract", () => {
    const { dir } = fixture();
    expect(run(dir, "read", "MEMORY.md").value).toMatchObject({ text: "ordinary memory\n", exists: true });
    expect(run(dir, "read", "memory/missing.md").value).toMatchObject({ text: "", exists: false });
  });
});
