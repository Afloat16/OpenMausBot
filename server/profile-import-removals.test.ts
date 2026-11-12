import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";

import { DATA_DIR } from "./config.ts";
import { factIdentity } from "./memory-entries.ts";
import { adoptLearned, learnedState, planLearned, type LearnedFact } from "./profile-learned.ts";

const path = join(DATA_DIR, "profile-learned.json");
const old = Array.from({ length: 500 }, (_, i) => factIdentity(`Old removed fact ${i}`));
const forgotten = "Prefers quiet mornings";
const key = factIdentity(forgotten);
const fact: LearnedFact = { id: "new-fact", text: forgotten, line: `- 2026-11-12 · learned by Nova · ${forgotten}`, botId: "b1", botName: "Nova", at: 1 };

beforeEach(() => {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify({ learned: [], removed: old, forgotten: ["a separate forgotten passage"] }));
});
afterEach(() => rmSync(path, { force: true }));

it("retains a newly imported removal when the bounded ledger was already full", () => {
  expect(adoptLearned([], [key], "About me")).toEqual({ aboutMe: "About me", added: 0 });
  expect(learnedState().removed).toEqual([...old.slice(1), key]);
  expect(JSON.parse(readFileSync(path, "utf8")).forgotten).toEqual(["a separate forgotten passage"]);
  expect(planLearned({ botId: "b2", botName: "Other" }, [forgotten], "About me", "2026-11-12")).toEqual([]);
});

it("does not restore the removed fact when an older server later sends its learned facts", () => {
  expect(adoptLearned([fact], [key], "About me")).toEqual({ aboutMe: "About me", added: 0 });
  expect(adoptLearned([fact], [], "About me")).toEqual({ aboutMe: "About me", added: 0 });
  expect(learnedState().learned).toEqual([]);
});

it("retains the newest 500 unique removals when a batch replaces the entire ledger", () => {
  const incoming = Array.from({ length: 550 }, (_, i) => factIdentity(`Incoming removed fact ${i}`));
  adoptLearned([], incoming, "About me");
  expect(learnedState().removed).toEqual(incoming.slice(-500));
});

it("keeps duplicate-only imports as no-ops and retains normal below-capacity imports", () => {
  const bytes = readFileSync(path, "utf8");
  expect(adoptLearned([], [old[0]!, old[499]!], "About me")).toEqual({ aboutMe: "About me", added: 0 });
  expect(readFileSync(path, "utf8")).toBe(bytes);

  writeFileSync(path, JSON.stringify({ learned: [], removed: [old[0]] }));
  adoptLearned([], [key], "About me");
  expect(learnedState().removed).toEqual([old[0], key]);
});

it("retains the existing capacity behavior when new facts also need to be saved", () => {
  const other = { ...fact, id: "other", text: "Has two cats", line: "- 2026-11-12 · learned by Nova · Has two cats" };
  expect(adoptLearned([other], [key], "About me")?.added).toBe(1);
  expect(learnedState()).toEqual({ learned: [other], removed: [...old.slice(1), key] });
});
