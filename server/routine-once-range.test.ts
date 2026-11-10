import { expect, it } from "vitest";
import { cleanSchedule, loadSchedule } from "./routine-schedules.ts";
import { MAX_DATE_MS } from "./routine-intervals.ts";

it.each([MAX_DATE_MS + 1, -MAX_DATE_MS - 1, Number.MAX_VALUE, -Number.MAX_VALUE])(
  "rejects an unrepresentable one-time schedule timestamp %s", at => {
    expect(() => cleanSchedule({ type: "once", at }, 0)).toThrow("valid date and time");
    expect(loadSchedule({ type: "once", at }, 0)).toBeNull();
  },
);

it.each([-MAX_DATE_MS, 0, 1_798_349_400_123, MAX_DATE_MS])("preserves the valid one-time timestamp %s exactly", at => {
  expect(cleanSchedule({ type: "once", at }, 0)).toEqual({ type: "once", at });
  expect(loadSchedule({ type: "once", at }, 0)).toEqual({ type: "once", at });
});

it("keeps numeric-string compatibility and rejects non-finite timestamps", () => {
  expect(cleanSchedule({ type: "once", at: "1798349400123" as unknown as number }, 0)).toEqual({ type: "once", at: 1_798_349_400_123 });
  for (const at of [NaN, Infinity, -Infinity]) expect(() => cleanSchedule({ type: "once", at }, 0)).toThrow("valid date and time");
});
