import { expect, it } from "vitest";
import { eventsFromData } from "../connected-reads.ts";
import { busyTimes, createPersonCalendar } from "./person-calendar.ts";

const start = Date.parse("2026-11-10T10:00:00Z");
const end = Date.parse("2026-11-10T11:00:00Z");
const raw = (id: string, transparency?: string) => ({
  id, summary: "Private appointment", start: { dateTime: new Date(start).toISOString() },
  end: { dateTime: new Date(end).toISOString() }, ...(transparency ? { transparency } : {}),
});

it("keeps recognized calendar transparency without treating unknown values as free", () => {
  const events = eventsFromData({ items: [raw("free", "transparent"), raw("busy", "opaque"), raw("default"), raw("unknown", "other")] }, { id: "primary", owned: true });
  expect(events.map((event) => ({ id: event.id, transparency: Reflect.get(event, "transparency") }))).toEqual([
    { id: "free", transparency: "transparent" }, { id: "busy", transparency: "opaque" },
    { id: "default", transparency: undefined }, { id: "unknown", transparency: undefined },
  ]);
});

it("does not let a timed free event bridge separate busy intervals", () => {
  const [free] = eventsFromData({ items: [raw("free", "transparent")] }, { id: "primary", owned: true });
  expect(busyTimes([free!])).toEqual([]);
  expect(busyTimes([
    { ...free!, id: "before", start: start - 60_000, end: start, transparency: "opaque" },
    free!, { ...free!, id: "after", start: end, end: end + 60_000, transparency: "opaque" },
  ])).toEqual([{ start: start - 60_000, end: start }, { start: end, end: end + 60_000 }]);
});

it("respects free events from the member's own connected calendar relay", async () => {
  const calendar = createPersonCalendar({
    access: () => ({ url: "https://broker.test", token: "fixture-member" }), connected: async () => true,
    relay: async (payload, _session, _signal, access) => {
      expect(access.token).toBe("fixture-member");
      const frame = payload as { id?: unknown; method: string; params?: { arguments?: { tools?: Array<{ tool_slug: string }> } } };
      let result: unknown = {};
      if (frame.method === "tools/call") {
        const slug = frame.params!.arguments!.tools![0]!.tool_slug;
        const data = slug === "GOOGLECALENDAR_EVENTS_LIST" ? { items: [raw("free", "transparent")] }
          : { items: [{ id: "primary", primary: true, accessRole: "owner" }] };
        result = { content: [{ type: "text", text: JSON.stringify({ successful: true, data: { results: [{ tool_slug: slug, response: { successful: true, data } }] } }) }] };
      }
      return { status: 200, bytes: new TextEncoder().encode(JSON.stringify({ jsonrpc: "2.0", id: frame.id, result })), transportSessionId: "fixture-session" };
    },
  });
  expect(await calendar.busy("fixture-person", start, end)).toEqual([]);
});
