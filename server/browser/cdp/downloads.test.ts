import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { CdpConnection } from "./connection.ts";
import { Downloads } from "./downloads.ts";

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "omb-download-owner-"));
  folders.push(dir);
  const connection = new CdpConnection({ send() {}, close() {}, onMessage() {}, onClose() {} });
  const downloads = new Downloads(connection.root, dir, {
    ownerOf: (frameId) => frameId || null,
    limits: { maxBytes: 1024, perOwner: 1 },
  });
  let next = 0;
  const complete = (owner: string | null) => {
    const guid = `download-${++next}`;
    writeFileSync(join(dir, guid), guid);
    connection.root.emit("Browser.downloadWillBegin", { guid, frameId: owner ?? "", suggestedFilename: "report.txt" });
    connection.root.emit("Browser.downloadProgress", { guid, state: "completed" });
    const download = downloads.list().find((entry) => entry.guid === guid)!;
    expect(download.state).toBe("completed");
    return download;
  };
  return { downloads, complete };
}

describe("download retention ownership", () => {
  it("an unknown-frame download keeps other tabs' retained files", () => {
    const { downloads, complete } = fixture();
    const a = complete("tab-a");
    const b = complete("tab-b");
    const unknown = complete(null);
    expect(downloads.list().map((entry) => entry.id)).toEqual([a.id, b.id, unknown.id]);
    expect(readFileSync(a.path!, "utf8")).toBe(a.guid);
    expect(readFileSync(b.path!, "utf8")).toBe(b.guid);
  });

  it("unknown-frame downloads evict only their own oldest file", () => {
    const { downloads, complete } = fixture();
    const a = complete("tab-a");
    const first = complete(null);
    const second = complete(null);
    expect(existsSync(first.path!)).toBe(false);
    expect(readFileSync(a.path!, "utf8")).toBe(a.guid);
    expect(downloads.list().map((entry) => entry.id)).toEqual([a.id, second.id]);
  });

  it("a known tab evicts only its oldest file and preserves unknown-frame files", () => {
    const { downloads, complete } = fixture();
    const unknown = complete(null);
    const first = complete("tab-a");
    const second = complete("tab-a");
    expect(existsSync(first.path!)).toBe(false);
    expect(readFileSync(unknown.path!, "utf8")).toBe(unknown.guid);
    expect(downloads.list().map((entry) => entry.id)).toEqual([unknown.id, second.id]);
  });
});
