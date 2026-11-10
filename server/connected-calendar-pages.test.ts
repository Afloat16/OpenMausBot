import { expect, it } from "vitest";
import { CALENDARS_TOOL, CALENDAR_LIST_TOOL, createConnectedReads, type ConnectedReadDeps } from "./connected-reads.ts";

const calendar = (id = "primary") => ({ id, primary: id === "primary", selected: true, accessRole: "owner" });
const event = (id: string) => ({ id, start: { dateTime: "2026-11-10T10:00:00Z" }, end: { dateTime: "2026-11-10T11:00:00Z" } });
const read = (answer: (slug: string, args: Record<string, unknown>) => unknown) => {
  const calls: Array<{ slug: string; args: Record<string, unknown>; session: string | undefined }> = [];
  const deps: ConnectedReadDeps = {
    connected: async () => ({ gmail: false, googlecalendar: true }),
    relay: async (payload, session) => {
      const frame = payload as { id?: unknown; method: string; params?: { arguments: { tools: Array<{ tool_slug: string; arguments: Record<string, unknown> }> } } };
      let result: unknown = {};
      if (frame.method === "tools/call") {
        const { tool_slug: slug, arguments: args } = frame.params!.arguments.tools[0]!;
        calls.push({ slug, args, session });
        const data = answer(slug, args);
        result = { content: [{ type: "text", text: JSON.stringify({ successful: true, data: { results: [{ tool_slug: slug, response: { successful: true, data } }] } }) }] };
      }
      return { status: 200, bytes: new TextEncoder().encode(JSON.stringify({ jsonrpc: "2.0", id: frame.id, result })), transportSessionId: "pages-fixture" };
    },
  };
  return { calls, events: () => createConnectedReads(deps).session().events(0, Date.UTC(2027, 0, 1)) };
};

it("reads all event pages including an empty page that has a continuation token", async () => {
  const { calls, events } = read((slug, args) => {
    if (slug === CALENDARS_TOOL) return { items: [calendar()] };
    if (!args.pageToken) return { items: Array.from({ length: 100 }, (_, index) => event(String(index))), nextPageToken: "empty" };
    if (args.pageToken === "empty") return { response_data: { items: [], nextPageToken: "last" } };
    expect(args.pageToken).toBe("last");
    return { items: [event("last")] };
  });
  expect((await events()).map((one) => one.id)).toEqual([...Array.from({ length: 100 }, (_, index) => String(index)), "last"]);
  const pages = calls.filter((one) => one.slug === CALENDAR_LIST_TOOL);
  expect(pages.map((one) => one.args.pageToken)).toEqual([undefined, "empty", "last"]);
  for (const page of pages) {
    expect(page.args).toMatchObject({ calendarId: "primary", singleEvents: true, orderBy: "startTime", maxResults: 100, showDeleted: true });
    expect(page.session).toBe("pages-fixture");
  }
});

it("finds selected calendars and the primary calendar on later calendar-list pages", async () => {
  const { calls, events } = read((slug, args) => {
    if (slug === CALENDARS_TOOL) return args.page_token ? { items: [calendar(), calendar("later")] }
      : { items: [{ ...calendar("hidden"), selected: false }], nextPageToken: "more-calendars" };
    return { items: [event(String(args.calendarId))] };
  });
  expect((await events()).map((one) => one.id).sort()).toEqual(["later", "primary"]);
  expect(calls.filter((one) => one.slug === CALENDARS_TOOL).map((one) => one.args.page_token)).toEqual([undefined, "more-calendars"]);
  expect(calls.filter((one) => one.slug === CALENDAR_LIST_TOOL)).toHaveLength(2);
});

it("rejects a failed later event page instead of reporting an incomplete calendar", async () => {
  const { events } = read((slug, args) => {
    if (slug === CALENDARS_TOOL) return { items: [calendar()] };
    if (args.pageToken) throw new Error("later page unavailable");
    return { items: [event("first")], nextPageToken: "later" };
  });
  await expect(events()).rejects.toMatchObject({ app: "googlecalendar", message: expect.stringContaining("later page unavailable") });
});

it.each([CALENDARS_TOOL, CALENDAR_LIST_TOOL])("rejects repeated page tokens from %s without returning partial results", async (cycling) => {
  const { calls, events } = read((slug) => {
    const data = slug === CALENDARS_TOOL ? { items: [calendar()] } : { items: [event("first")] };
    return slug === cycling ? { ...data, nextPageToken: "same-secret-token" } : data;
  });
  await expect(events()).rejects.toMatchObject({ app: "googlecalendar", message: expect.stringContaining("repeated page token") });
  expect(calls.filter((one) => one.slug === cycling)).toHaveLength(2);
});

it("bounds an endless sequence of different continuation tokens", async () => {
  let pages = 0;
  const { events } = read((slug) => slug === CALENDARS_TOOL ? { items: [calendar()] }
    : { items: [event(String(pages))], nextPageToken: String(++pages) });
  await expect(events()).rejects.toMatchObject({ app: "googlecalendar", message: expect.stringContaining("too many pages") });
  expect(pages).toBe(100);
});
