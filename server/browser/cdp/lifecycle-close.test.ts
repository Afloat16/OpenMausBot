import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CdpConnection } from "./connection.ts";
import { FrameTree } from "./frames.ts";
import { Navigations } from "./navigations.ts";
import { RefCounter, RefTable } from "./refs.ts";
import type { CdpTransport } from "./transport.ts";
import { Lifecycle, waitFor, type WaitConditions } from "./wait.ts";

function setup() {
  let message: (text: string) => void = () => {};
  let close: (reason: string) => void = () => {};
  const transport: CdpTransport = {
    send() {},
    onMessage(listener) { message = listener; },
    onClose(listener) { close = listener; },
    close() { close("browser stopped"); },
  };
  const connection = new CdpConnection(transport);
  const emit = (value: unknown) => message(JSON.stringify(value));
  const attach = (id: string) => emit({ method: "Target.attachedToTarget", params: { sessionId: id, targetInfo: { targetId: id, type: "page" } } });
  attach("page");
  const session = connection.session("page")!;
  const lifecycle = new Lifecycle(session, "main");
  const context = { frames: new FrameTree(session, "main"), refs: new RefTable(new RefCounter()), lifecycle, url: () => "about:blank" };
  const detach = (id = "page") => emit({ method: "Target.detachedFromTarget", params: { sessionId: id } });
  const event = (name: string, loaderId = "document") => emit({ sessionId: "page", method: "Page.lifecycleEvent", params: { frameId: "main", loaderId, name } });
  return { connection, lifecycle, context, attach, detach, event, emit };
}

function observe(promise: Promise<unknown>) {
  const results: unknown[] = [];
  void promise.then(() => results.push("completed"), (error) => results.push(error));
  return results;
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

it.each(["page", "browser"] as const)("ends pending load and next-document waits when the %s closes", async (kind) => {
  const fixture = setup();
  const load = observe(fixture.lifecycle.waitFor("load", { timeoutMs: 30_000 }));
  const next = observe(fixture.lifecycle.nextDocument(30_000));
  if (kind === "page") fixture.detach();
  else fixture.connection.close();
  await vi.advanceTimersByTimeAsync(0);
  expect(load).toEqual([expect.objectContaining({ name: "DriverError", code: "closed" })]);
  expect(next).toEqual([expect.objectContaining({ name: "DriverError", code: "closed" })]);
  expect(vi.getTimerCount()).toBe(0);
});

it("does not start document waits or reuse old loaded state after the page closes", async () => {
  const { lifecycle, detach } = setup();
  lifecycle.adopt("loaded", true);
  detach();
  const load = observe(lifecycle.waitFor("load", { timeoutMs: 30_000 }));
  const next = observe(lifecycle.nextDocument(30_000));
  await vi.advanceTimersByTimeAsync(0);
  expect(load).toEqual([expect.objectContaining({ code: "closed" })]);
  expect(next).toEqual([expect.objectContaining({ code: "closed" })]);
  expect(vi.getTimerCount()).toBe(0);
});

it.each([
  { ms: 30_000 },
  { urlIncludes: "never", timeoutMs: 30_000 },
  { load: "networkidle", timeoutMs: 30_000 },
] satisfies WaitConditions[])("ends an active page-condition wait on detach: %j", async (conditions) => {
  const { context, detach } = setup();
  const result = observe(waitFor(context, conditions));
  await vi.advanceTimersByTimeAsync(0);
  detach();
  await vi.advanceTimersByTimeAsync(0);
  expect(result).toEqual([expect.objectContaining({ code: "closed" })]);
  expect(vi.getTimerCount()).toBe(0);
});

it("rejects a condition wait on an already closed page even when its old URL matches", async () => {
  const { context, detach } = setup();
  detach();
  await expect(waitFor(context, { urlIncludes: "about:blank" })).rejects.toMatchObject({ code: "closed" });
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps live document and condition waits working and clears their timers", async () => {
  const { lifecycle, context, event } = setup();
  const next = lifecycle.nextDocument(30_000);
  const load = lifecycle.waitFor("load", { timeoutMs: 30_000 });
  event("init");
  await expect(next).resolves.toBe("document");
  event("load");
  await expect(load).resolves.toBeUndefined();
  await expect(waitFor(context, { urlIncludes: "about:blank", load: "load" })).resolves.toBeUndefined();
  const delay = waitFor(context, { ms: 150 });
  await vi.advanceTimersByTimeAsync(150);
  await delay;
  expect(vi.getTimerCount()).toBe(0);
});

it("does not cancel this page's waits when another page closes", async () => {
  const { lifecycle, attach, detach, event } = setup();
  attach("other");
  const result = observe(lifecycle.waitFor("load", { timeoutMs: 30_000 }));
  detach("other");
  await vi.advanceTimersByTimeAsync(0);
  expect(result).toEqual([]);
  event("load");
  await vi.advanceTimersByTimeAsync(0);
  expect(result).toEqual(["completed"]);
  expect(vi.getTimerCount()).toBe(0);
});

it("preserves ordinary timeouts for live pages", async () => {
  const { lifecycle, context } = setup();
  const load = observe(lifecycle.waitFor("load", { timeoutMs: 200 }));
  const next = observe(lifecycle.nextDocument(200));
  const condition = observe(waitFor(context, { urlIncludes: "never", timeoutMs: 200 }));
  await vi.advanceTimersByTimeAsync(200);
  for (const result of [load, next, condition]) expect(result).toEqual([expect.objectContaining({ code: "timeout" })]);
  expect(vi.getTimerCount()).toBe(0);
});

it.each([false, true])("ends a requested-navigation follow when the page closes (already closed: %s)", async (alreadyClosed) => {
  const { context, detach, emit } = setup();
  vi.spyOn(context.frames, "inWorld").mockResolvedValue(undefined);
  const navigation = new Navigations(context.frames.mainSession, context.frames, context.lifecycle);
  const mark = navigation.mark();
  emit({ sessionId: "page", method: "Page.frameRequestedNavigation", params: { frameId: "main", disposition: "currentTab" } });
  if (alreadyClosed) detach();
  const result = observe(navigation.follow(mark, 30_000));
  await vi.advanceTimersByTimeAsync(0);
  if (!alreadyClosed) detach();
  await vi.advanceTimersByTimeAsync(0);
  expect(result).toEqual(["completed"]);
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps following a live requested navigation until it stops loading", async () => {
  const { context, emit } = setup();
  vi.spyOn(context.frames, "inWorld").mockResolvedValue(undefined);
  const navigation = new Navigations(context.frames.mainSession, context.frames, context.lifecycle);
  const mark = navigation.mark();
  emit({ sessionId: "page", method: "Page.frameRequestedNavigation", params: { frameId: "main", disposition: "currentTab" } });
  const result = observe(navigation.follow(mark, 30_000));
  await vi.advanceTimersByTimeAsync(0);
  expect(result).toEqual([]);
  emit({ sessionId: "page", method: "Page.frameStoppedLoading", params: { frameId: "main" } });
  await vi.advanceTimersByTimeAsync(0);
  expect(result).toEqual(["completed"]);
  expect(vi.getTimerCount()).toBe(0);
});
