import { describe, expect, it, vi } from "vitest";

import { createCacheKeepWarm, PING_AFTER_MS, type KeepWarmPingResult, type KeepWarmTarget } from "./cache-keepwarm.ts";

describe("an in-flight cache ping's usage", () => {
  it("books the original instance after a later turn changes the window's instance", async () => {
    let now = 0;
    let fire!: () => void;
    let finish!: (value: KeepWarmPingResult) => void;
    const pending = new Promise<KeepWarmPingResult>((resolve) => { finish = resolve; });
    const ping = vi.fn(() => pending);
    const book = vi.fn();
    const keepWarm = createCacheKeepWarm({
      now: () => now,
      after: (_ms, run) => { fire = run; return { cancel: () => undefined }; },
      windowMs: () => 3 * 60 * 60_000, ineligible: () => null, busy: () => false, overBudget: () => false,
      ping, book, hold: () => undefined, changed: () => undefined,
    });
    const first: KeepWarmTarget = { threadId: "thread", botId: "bot", instanceId: "original-account" };
    const next = { ...first, instanceId: "new-account" };
    const turn = { ok: true, contextTokens: 100_000 };
    const result: KeepWarmPingResult = { ok: true, input: 4, cacheRead: 100_000, cacheWrite: 20, output: 2, costUsd: 0.05, model: "model" };
    keepWarm.noteTurnCompleted(first, turn);
    now += PING_AFTER_MS;
    fire();
    expect(ping).toHaveBeenCalledWith(first, expect.any(AbortSignal));
    keepWarm.noteTurnStarted(first.threadId);
    keepWarm.noteTurnCompleted(next, turn);
    finish(result);
    await pending;
    expect(book).toHaveBeenCalledExactlyOnceWith(first, result);
    expect(keepWarm.status(first.threadId)?.last).toBeUndefined();
    keepWarm.dispose();
  });
});
