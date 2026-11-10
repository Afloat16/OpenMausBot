import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { launchVerificationServer, runControlOmb } from "../scripts/control-omb.ts";

it("rejects invalid one-time dates through the routine API without changing saved schedules", async () => {
  const fixture = await launchVerificationServer();
  const api = (method: string, path: string, body: unknown) => fetch(`${fixture.info.url}${path}`, {
    method, headers: { "content-type": "application/json", origin: fixture.info.url }, body: JSON.stringify(body),
  });
  try {
    expect(await runControlOmb(["doctor", "--url", fixture.info.url])).toMatchObject({ ok: true });
    const { bot } = await runControlOmb(["new-bot", "--name", "Date range probe", "--url", fixture.info.url]) as { bot: { id: string } };
    const input = { botId: bot.id, name: "Valid once", prompt: "Fixture work", enabled: false, schedule: { type: "once", at: Date.now() + 86_400_000 } };
    const created = await api("POST", "/api/routines", input);
    expect(created.status).toBe(201);
    const { routine } = await created.json() as { routine: { id: string } };
    const saved = () => readFileSync(join(fixture.info.dataDir, "routines.json"), "utf8");
    const before = saved();
    for (const at of [1e100, -1e100]) {
      for (const [method, path, body] of [
        ["POST", "/api/routines", { ...input, name: "Invalid once", schedule: { type: "once", at } }],
        ["PATCH", `/api/routines/${routine.id}`, { schedule: { type: "once", at } }],
      ] as const) {
        const response = await api(method, path, body);
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ error: expect.stringContaining("valid date and time") });
      }
    }
    expect(saved()).toBe(before);
  } finally { await fixture.close(); }
}, 60_000);
