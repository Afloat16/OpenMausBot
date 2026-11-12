// The usage ledger read for traces: streamed, and cached per month file. The ledger only grows, so a later read parses just
// the lines appended since the last one.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { isUsageRow, monthsBetween, type UsageRow } from "../usage-ledger.ts";

interface CachedMonth {
  size: number;
  rows: UsageRow[];
}

const MAX_CACHED_MONTHS = 24;
const cache = new Map<string, CachedMonth>();
const loading = new Map<string, Promise<UsageRow[]>>();

async function readFrom(file: string, start: number, into: UsageRow[]): Promise<number> {
  const stream = createReadStream(file, { encoding: "utf8", start });
  let consumed = start;
  // A line that does not parse is counted only once another follows it: the last one may still be mid-append.
  let unparsed = 0;
  const accept = (line: string, bytes: number) => {
    consumed += unparsed;
    unparsed = 0;
    if (!line) {
      consumed += bytes;
      return;
    }
    try {
      const value: unknown = JSON.parse(line);
      if (isUsageRow(value)) into.push(value);
      consumed += bytes;
    } catch {
      unparsed = bytes;
    }
  };
  // readline removes the terminator; assuming one byte for it rewinds the cache into already-booked CRLF records.
  let pending = "";
  for await (const chunk of stream) {
    pending += chunk;
    let cursor = 0;
    for (const ending of pending.matchAll(/\r\n|\r|\n/g)) {
      // Keep a final CR until its possible LF arrives in the next chunk.
      if (ending[0] === "\r" && ending.index === pending.length - 1) break;
      const line = pending.slice(cursor, ending.index);
      accept(line, Buffer.byteLength(line) + ending[0].length);
      cursor = ending.index + ending[0].length;
    }
    pending = pending.slice(cursor);
  }
  if (pending) accept(pending.endsWith("\r") ? pending.slice(0, -1) : pending, Buffer.byteLength(pending));
  return Math.min(consumed, start + stream.bytesRead);
}

/** One read per file at a time: two overlapping reads would both append the same new lines to the cached rows. */
function monthRows(file: string): Promise<UsageRow[]> {
  const pending = loading.get(file);
  if (pending) return pending;
  const read = loadMonth(file).finally(() => loading.delete(file));
  loading.set(file, read);
  return read;
}

async function loadMonth(file: string): Promise<UsageRow[]> {
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    cache.delete(file);
    return [];
  }
  const cached = cache.get(file);
  if (cached && cached.size === size) return cached.rows;
  const rows = cached && cached.size < size ? cached.rows : [];
  const consumed = await readFrom(file, cached && cached.size < size ? cached.size : 0, rows);
  cache.delete(file);
  cache.set(file, { size: consumed, rows });
  if (cache.size > MAX_CACHED_MONTHS) cache.delete(cache.keys().next().value as string);
  return rows;
}

/** Ledger rows booked between `from` and `to`, oldest first. */
export async function ledgerRows(dataDir: string, from: number, to: number): Promise<UsageRow[]> {
  const out: UsageRow[] = [];
  for (const month of monthsBetween(new Date(from), new Date(to))) {
    for (const row of await monthRows(join(dataDir, "usage", `${month}.jsonl`))) {
      const at = Date.parse(row.at);
      if (at >= from && at <= to) out.push(row);
    }
  }
  return out;
}
