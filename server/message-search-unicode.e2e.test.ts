import { expect, it } from "vitest";
import { launchVerificationServer, runControlOmb } from "../scripts/control-omb.ts";

it("finds a sent Unicode message through the owned fixture search route", async () => {
  const fixture = await launchVerificationServer();
  try {
    expect(await runControlOmb(["doctor", "--url", fixture.info.url])).toMatchObject({ ok: true });
    const created = await runControlOmb(["new-bot", "--name", "Unicode search probe", "--url", fixture.info.url]) as {
      bot: { id: string; activeTaskId: string };
    };
    await runControlOmb(["send", "--bot", created.bot.id, "--text", "İ before ÉCOLE ПРИВЕТ ΑΘΉΝΑ", "--url", fixture.info.url]);
    await runControlOmb(["wait", "--bot", created.bot.id, "--timeout", "30", "--url", fixture.info.url]);
    for (const [query, original] of [["école", "ÉCOLE"], ["привет", "ПРИВЕТ"], ["αθήνα", "ΑΘΉΝΑ"]]) {
      const params = new URLSearchParams({ q: query, threadId: created.bot.activeTaskId });
      const response = await fetch(`${fixture.info.url}/api/search?${params}`);
      expect(response.status).toBe(200);
      const { hits } = await response.json() as { hits: Array<{ snippet: string; matchStart: number; matchLength: number; onActivePath: boolean }> };
      expect(hits).toHaveLength(1);
      expect(hits[0].onActivePath).toBe(true);
      expect(hits[0].snippet.slice(hits[0].matchStart, hits[0].matchStart + hits[0].matchLength)).toBe(original);
    }
  } finally {
    await fixture.close();
  }
}, 60_000);
