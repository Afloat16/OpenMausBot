import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";

import { moveMemoryRoute, type MoveMemoryDeps } from "./cloud-send-memory.ts";
import { DATA_DIR } from "./config.ts";
import { json, readBody } from "./harness/http.ts";
import { learnedState, type LearnedFact } from "./profile-learned.ts";

const learnedFile = join(DATA_DIR, "profile-learned.json");
const aboutFile = join(DATA_DIR, "import-about-me.txt");
const fact: LearnedFact = { id: "imported-fact", text: "Lives in Pune", line: "- 2026-11-12 · learned by Nova · Lives in Pune", botId: "b1", botName: "Nova", at: 1 };
let server: Server;
let url: string;
let saveFailure: string | undefined;
let saveCalls: number;
let ownerAllowed: boolean;

async function start() {
  const deps: MoveMemoryDeps = {
    bot: () => undefined,
    teamMemory: { list: () => [], adopt: () => 0 },
    aboutMe: () => readFileSync(aboutFile, "utf8"),
    saveAboutMe(text) {
      saveCalls++;
      if (saveFailure) throw Object.assign(new Error("synthetic profile write failure"), { code: saveFailure });
      writeFileSync(aboutFile, text);
    },
    owner: () => ownerAllowed ? { person: "owner", name: "Owner" } : null,
  };
  server = createServer((req, res) => {
    const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
    void moveMemoryRoute(deps, { req, res, url: requestUrl, path: requestUrl.pathname, method: req.method ?? "GET", auth: { kind: "loopback", scopes: ["admin"] }, json, readBody })
      .catch(() => json(res, 500, { error: "save failed" }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture did not bind");
  url = `http://127.0.0.1:${address.port}/api/cloud-send/memory`;
}

async function stop() {
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
}

async function send(learned = [fact], removed: string[] = []) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ v: 1, about: { learned, removed } }) });
  return { status: response.status, body: await response.json() };
}

beforeEach(async () => {
  mkdirSync(DATA_DIR, { recursive: true });
  rmSync(learnedFile, { recursive: true, force: true });
  writeFileSync(aboutFile, "Runs a shop.");
  saveFailure = undefined;
  saveCalls = 0;
  ownerAllowed = true;
  await start();
});

afterEach(async () => {
  await stop();
  rmSync(learnedFile, { recursive: true, force: true });
  rmSync(aboutFile, { force: true });
});

it.each(["ENOSPC", "EIO", "EPERM"])("keeps learned facts retryable after the profile save fails with %s", async (code) => {
  saveFailure = code;
  expect((await send([fact], ["Removed elsewhere"])).status).toBe(500);
  expect(readFileSync(aboutFile, "utf8")).toBe("Runs a shop.");
  expect(learnedState()).toEqual({ learned: [], removed: [] });

  await stop();
  saveFailure = undefined;
  await start();
  expect(await send([fact], ["Removed elsewhere"])).toMatchObject({ status: 200, body: { about: 1 } });
  expect(readFileSync(aboutFile, "utf8")).toBe(`Runs a shop.\n${fact.line}`);
  expect(learnedState()).toEqual({ learned: [fact], removed: ["Removed elsewhere"] });
  expect(await send([fact], ["Removed elsewhere"])).toMatchObject({ status: 200, body: { about: 0 } });
  expect(saveCalls).toBe(2);
  expect(readFileSync(aboutFile, "utf8")).toBe(`Runs a shop.\n${fact.line}`);
});

it("repairs the learned ledger without duplicating About me after the ledger save fails", async () => {
  mkdirSync(learnedFile);
  expect((await send()).status).toBe(500);
  expect(readFileSync(aboutFile, "utf8")).toBe(`Runs a shop.\n${fact.line}`);
  rmSync(learnedFile, { recursive: true });
  await stop();
  await start();
  expect(await send()).toMatchObject({ status: 200, body: { about: 0 } });
  expect(learnedState().learned).toEqual([fact]);
  expect(readFileSync(aboutFile, "utf8")).toBe(`Runs a shop.\n${fact.line}`);
  expect(saveCalls).toBe(1);
});

it("does not write an unchanged or full profile, and still retains removals on a no-op", async () => {
  writeFileSync(aboutFile, `Runs a shop.\n${fact.line}`);
  expect(await send([fact], ["Removed elsewhere"])).toMatchObject({ status: 200, body: { about: 0 } });
  expect(saveCalls).toBe(0);
  expect(learnedState()).toEqual({ learned: [fact], removed: ["Removed elsewhere"] });

  writeFileSync(aboutFile, "x".repeat(24_000));
  const second = { ...fact, id: "second", text: "Has two dogs", line: "- 2026-11-12 · learned by Nova · Has two dogs" };
  expect(await send([second])).toMatchObject({ status: 200, body: { about: 0, failed: ["about-me"] } });
  expect(saveCalls).toBe(0);
  expect(learnedState().learned).toEqual([fact]);
});

it("keeps the owner gate before either write", async () => {
  ownerAllowed = false;
  expect((await send()).status).toBe(403);
  expect(saveCalls).toBe(0);
  expect(learnedState().learned).toEqual([]);
});
