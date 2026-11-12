import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import type { PathLike, RmOptions } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { CloudSyncStore } from "./cloud-sync-store.ts";
import { createCloudSync, type CloudSync } from "./cloud-sync.ts";

const failures = vi.hoisted(() => new Map<string, Error>());
vi.mock("node:fs", async (importOriginal) => {
  const fs = await importOriginal<typeof import("node:fs")>();
  return { ...fs, rmSync: (path: PathLike, options?: RmOptions) => {
    const error = failures.get(String(path));
    if (error) throw error;
    return fs.rmSync(path, options);
  } };
});

const scratch: string[] = [];
const stores: CloudSyncStore[] = [];
const syncs: CloudSync[] = [];
const identity = { computerId: "3f9c2a4e-8b1d-4c6e-9a7f-2d5e8c1b0a93", computerName: "PC", pcPath: "/notes", name: "notes" };

function setup() {
  const home = mkdtempSync(join(tmpdir(), "omb-trash-recovery-"));
  scratch.push(home);
  const dataDir = join(home, "data");
  const store = new CloudSyncStore({ dataDir, now: () => 1_000 });
  stores.push(store);
  const folder = store.register(identity);
  const source = join(folder.cloudPath, "important.txt");
  writeFileSync(source, "preserve me");
  const entry = store.toTrash(folder, "important.txt", source);
  return { store, dataDir, entry, source, file: store.trashEntry(entry.id)!.file };
}

afterEach(() => {
  failures.clear();
  for (const sync of syncs.splice(0)) sync.close();
  for (const store of stores.splice(0)) store.close();
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it.each(["EPERM", "EBUSY", "EIO"])("retains a trash record and its byte accounting when deletion fails with %s", (code) => {
  const { store, dataDir, entry, file } = setup();
  const error = Object.assign(new Error("cannot remove retained file"), { code });
  failures.set(file, error);
  expect(() => store.dropTrash(entry.id)).toThrow(error);
  expect(readFileSync(file, "utf8")).toBe("preserve me");
  expect(store.trash()).toEqual([entry]);
  expect(store.trashBytes()).toBe(entry.size);

  store.close();
  stores.splice(stores.indexOf(store), 1);
  const reopened = new CloudSyncStore({ dataDir });
  stores.push(reopened);
  expect(reopened.trashEntry(entry.id)?.entry).toEqual(entry);
  expect(reopened.trashBytes()).toBe(entry.size);
  failures.delete(file);
  reopened.dropTrash(entry.id);
  expect(existsSync(file)).toBe(false);
  expect(reopened.trash()).toEqual([]);
  expect(reopened.trashBytes()).toBe(0);
});

it("keeps a failed retention deletion recoverable through the sync restore operation", async () => {
  let now = 1_000;
  const home = mkdtempSync(join(tmpdir(), "omb-trash-restore-"));
  scratch.push(home);
  const sync = createCloudSync({ dataDir: join(home, "data"), now: () => now });
  syncs.push(sync);
  const folder = sync.register(identity);
  const source = join(folder.cloudPath, "important.txt");
  writeFileSync(source, "preserve me");
  const entry = sync.store.toTrash(folder, "important.txt", source);
  const file = sync.store.trashEntry(entry.id)!.file;
  const error = Object.assign(new Error("file is busy"), { code: "EBUSY" });
  failures.set(file, error);
  now += 31 * 86_400_000;
  expect(() => sync.store.sweepTrash()).toThrow(error);
  expect(sync.trash().entries).toEqual([entry]);
  failures.delete(file);
  expect(await sync.restore(entry.id)).toEqual({ folderId: folder.id, path: "important.txt" });
  expect(readFileSync(source, "utf8")).toBe("preserve me");
  expect(sync.trash().entries).toEqual([]);
  expect(sync.store.trashBytes()).toBe(0);
});

it("removes the record when the trash file is already absent after a restore", () => {
  const { store, entry, source, file } = setup();
  renameSync(file, source);
  store.dropTrash(entry.id);
  expect(store.trashEntry(entry.id)).toBeNull();
  expect(store.trashBytes()).toBe(0);
  expect(readFileSync(source, "utf8")).toBe("preserve me");
});

it("removes both the file and the record on successful deletion", () => {
  const { store, entry, file } = setup();
  store.dropTrash(entry.id);
  expect(existsSync(file)).toBe(false);
  expect(store.trashEntry(entry.id)).toBeNull();
  expect(store.trashBytes()).toBe(0);
});
