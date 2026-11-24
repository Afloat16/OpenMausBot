import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { launchVerificationServer, runControlOmb } from "../scripts/control-omb.ts";
import { ORGANIZE_MARKER } from "./memory-organize.ts";
import { TIDY_MARKER } from "./memory-tidy.ts";

let fixture: Awaited<ReturnType<typeof launchVerificationServer>>;
let scratch: string;

beforeAll(async () => {
  scratch = mkdtempSync(join(tmpdir(), "omb-memory-duplicates-"));
  const routes = join(scratch, "routes.json");
  writeFileSync(routes, JSON.stringify({ [ORGANIZE_MARKER]: '{"moves":[]}', [TIDY_MARKER]: '{"pairs":[]}' }));
  fixture = await launchVerificationServer({ ...process.env, FAKE_CLAUDE_TEXT_ROUTES: routes });
  expect(await runControlOmb(["doctor", "--url", fixture.info.url])).toMatchObject({ ok: true });
}, 60_000);

afterAll(async () => {
  await fixture?.close();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

async function api<T>(path: string, method = "GET", body?: unknown, status = 200): Promise<T> {
  const response = await fetch(fixture.info.url + path, {
    method, headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  expect(response.status, `${method} ${path}`).toBe(status);
  return response.json() as Promise<T>;
}

async function savedMemory(text: string, path = "MEMORY.md") {
  const { bot } = await api<{ bot: { id: string } }>("/api/bots", "POST", { name: "Memory duplicate verification" }, 201);
  const base = `/api/bots/${bot.id}/memory`;
  const { overview } = await api<{ overview: { workspacePath: string } }>(`${base}/file`, "PUT", { path, text });
  return {
    base,
    tidy: () => api<{ report: { duplicates: number } }>(`${base}/tidy`, "POST"),
    read: async () => (await api<{ text: string }>(`${base}/file?path=${encodeURIComponent(path)}`)).text,
    disk: () => readFileSync(join(overview.workspacePath, path), "utf8"),
  };
}

describe("tidying complete duplicate memory entries", () => {
  it.each(["MEMORY.md", "memory/deploy.md"])("keeps equal headings with distinct details in %s", async (path) => {
    const text = "- 2026-01-01 · Deployment steps\n  deploy --north\n- 2026-01-02 · Deployment steps\n  deploy --south\n";
    const memory = await savedMemory(text, path);
    expect((await memory.tidy()).report.duplicates).toBe(0);
    expect(await memory.read()).toBe(text);
    expect(memory.disk()).toBe(text);
  });

  it.each(["MEMORY.md", "memory/deploy.md"])("removes one full identical entry from %s and Undo restores it", async (path) => {
    const details = "  ```sh\n  deploy --north\n\n  ```\n  Verify the deployment.\n";
    const older = `- 2026-01-01 · Deployment steps\n${details}`;
    const newer = `- 2026-01-02 · Deployment steps.\n${details}`;
    const prefix = "# Memory\n- 2025-12-31 · Keep this separate note\n";
    const before = prefix + older + newer;
    const memory = await savedMemory(before, path);
    expect((await memory.tidy()).report.duplicates).toBe(1);
    expect(await memory.read()).toBe(prefix + newer);
    expect(memory.disk()).toBe(prefix + newer);
    const { entries } = await api<{ entries: Array<{ id: string; path: string; via: string; canRevert: boolean }> }>(`${memory.base}/journal`);
    const changed = entries.find((entry) => entry.path === path && entry.via === "tidy");
    expect(changed).toMatchObject({ canRevert: true });
    await api(`${memory.base}/journal/${changed!.id}/revert`, "POST");
    expect(await memory.read()).toBe(before);
    expect(memory.disk()).toBe(before);
  });

  it("preserves meaningful spaces in code while reading CRLF entries", async () => {
    const text = [
      "- 2026-01-01 · Output format", "  ```python", '  print("north  south")', "  ```",
      "- 2026-01-02 · Output format", "  ```python", '  print("north south")', "  ```", "",
    ].join("\r\n");
    const memory = await savedMemory(text);
    expect((await memory.tidy()).report.duplicates).toBe(0);
    expect(await memory.read()).toBe(text);
    expect(memory.disk()).toBe(text);
  });

  it("does not replace a permanent fact with an expiring copy of its content", async () => {
    const text = "- 2026-01-01 · Deployment steps\n  deploy --north\n- 2026-01-02 · Deployment steps · until 2099-12-31\n  deploy --north\n";
    const memory = await savedMemory(text);
    expect((await memory.tidy()).report.duplicates).toBe(0);
    expect(await memory.read()).toBe(text);
    expect(memory.disk()).toBe(text);
  });

  it("still removes an older single-line duplicate", async () => {
    const newer = "- 2026-01-02 · Prefers short replies\n";
    const memory = await savedMemory("- 2026-01-01 · Prefers short replies.\n" + newer);
    expect((await memory.tidy()).report.duplicates).toBe(1);
    expect(await memory.read()).toBe(newer);
    expect(memory.disk()).toBe(newer);
  });
});
