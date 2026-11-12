import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { UsageRow } from "../usage-ledger.ts";
import { ledgerRows } from "./ledger.ts";
import { createTraceService } from "./service.ts";

const at = Date.UTC(2026, 10, 12, 12);
const dirs: string[] = [];
const row = (index: number): UsageRow => ({
  at: new Date(at).toISOString(), botId: "bot", botName: "账本 🐭", threadId: `thread-${index}`,
  turnId: `turn-${index}`, instanceId: "claude", driverKind: "claude", model: "test-model",
  input: 100, output: 20, cachedInput: 50, costUsd: 0.25, trigger: { kind: "owner" },
});

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "omb-trace-offset-"));
  dirs.push(dir);
  mkdirSync(join(dir, "usage"));
  const file = join(dir, "usage", "2026-11.jsonl");
  const read = () => ledgerRows(dir, at - 60_000, at + 60_000);
  return { dir, file, read };
}

afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe("incremental ledger byte offsets", () => {
  it.each(["\n", "\r\n", "\r"])("never rebooks unchanged or appended records with %j line endings", async (ending) => {
    const { file, read } = fixture();
    const rows = Array.from({ length: 1_000 }, (_, index) => row(index));
    writeFileSync(file, rows.map((entry) => JSON.stringify(entry) + ending).join(""));
    expect(await read()).toEqual(rows);
    expect(await read()).toEqual(rows);
    const next = row(rows.length);
    appendFileSync(file, JSON.stringify(next) + ending);
    const expected = [...rows, next];
    const simultaneous = await Promise.all([read(), read()]);
    expect(simultaneous).toEqual([expected, expected]);
    expect(await read()).toEqual(expected);
  });

  it("resumes an unfinished record after CRLF lines exactly once", async () => {
    const { file, read } = fixture();
    const rows = Array.from({ length: 1_000 }, (_, index) => row(index));
    const next = row(rows.length);
    const line = JSON.stringify(next);
    writeFileSync(file, rows.map((entry) => JSON.stringify(entry) + "\r\n").join("") + line.slice(0, 30));
    expect(await read()).toEqual(rows);
    appendFileSync(file, line.slice(30) + "\r\n");
    expect(await read()).toEqual([...rows, next]);
    expect(await read()).toEqual([...rows, next]);
  });

  it("keeps trace costs and tokens stable when the same CRLF ledger is refreshed", async () => {
    const { dir, file } = fixture();
    writeFileSync(file, Array.from({ length: 1_000 }, (_, index) => JSON.stringify(row(index)) + "\r\n").join(""));
    const service = createTraceService({ dataDir: dir, recorder: { liveTurns: () => [] }, liveBot: () => null, messages: () => [], now: () => at });
    const range = { from: new Date(at - 60_000), to: new Date(at + 60_000) };
    const first = await service.list(range, { offset: 0, limit: 10 }, () => true);
    const second = await service.list(range, { offset: 0, limit: 10 }, () => true);
    expect(first.totals).toMatchObject({ costUsd: 250, input: 100_000, output: 20_000 });
    expect(second).toEqual(first);
  });

  it("preserves mixed delimiters, split UTF-8, an EOF CR, and unterminated valid records", async () => {
    const { file, read } = fixture();
    const long = { ...row(0), botName: "账".repeat(30_000) };
    const rows = [long, row(1), row(2), row(3)];
    writeFileSync(file, JSON.stringify(long) + "\r\n" + JSON.stringify(rows[1]) + "\n" + JSON.stringify(rows[2]) + "\r");
    expect(await read()).toEqual(rows.slice(0, 3));
    appendFileSync(file, "\n" + JSON.stringify(rows[3]));
    expect(await read()).toEqual(rows);
    expect(await read()).toEqual(rows);
  });
});
