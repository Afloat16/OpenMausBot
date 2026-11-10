import { createServer, type TLSSocket } from "node:tls";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testCertificate, trustTestCertificate } from "../testing/fake-smtp.ts";
import { listMessages, searchMessages, type EmailGuard } from "./client.ts";
import type { EmailAccount } from "./store.ts";

const host = "imap.pagination.example";
const certificate = testCertificate([host]);
const close: Array<() => void> = [];
let untrust = () => {};
beforeAll(() => { if (certificate) untrust = trustTestCertificate(certificate.cert); });
afterAll(() => untrust());
afterEach(() => { for (const cleanup of close.splice(0)) cleanup(); });

async function mailbox(uids: number[], total = 10, refuseSearch = false) {
  const commands: string[] = [];
  const sockets = new Set<TLSSocket>();
  const server = createServer(certificate!, socket => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    socket.setEncoding("utf8");
    socket.write("* OK [CAPABILITY IMAP4rev1] ready\r\n");
    let buffer = "";
    socket.on("data", (chunk: string) => {
      buffer += chunk;
      for (let end = buffer.indexOf("\r\n"); end >= 0; end = buffer.indexOf("\r\n")) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const [tag, ...parts] = line.split(" ");
        const command = parts.join(" ");
        if (!command.startsWith("LOGIN ")) commands.push(command);
        if (command === "CAPABILITY") socket.write("* CAPABILITY IMAP4rev1\r\n");
        else if (/^(?:SELECT|EXAMINE) /u.test(command)) {
          socket.write(`* FLAGS (\\Seen)\r\n* ${total} EXISTS\r\n* OK [UIDVALIDITY 1] valid\r\n* OK [UIDNEXT 11] next\r\n`);
        } else if (command.startsWith("UID SEARCH ")) {
          if (refuseSearch) { socket.write(`${tag} NO search is temporarily unavailable\r\n`); continue; }
          if (command.includes("1:0")) { socket.write(`${tag} BAD zero is not a UID\r\n`); continue; }
          socket.write(`* SEARCH${uids.length ? " " + uids.join(" ") : ""}\r\n`);
        } else if (command.startsWith("UID FETCH ")) {
          const requested = command.split(" ")[2].split(",").map(Number);
          for (const uid of uids.filter(uid => requested.includes(uid))) socket.write(`* ${uid} FETCH (UID ${uid} FLAGS () RFC822.SIZE 12)\r\n`);
        } else if (command === "LOGOUT") {
          socket.end(`* BYE logout\r\n${tag} OK done\r\n`);
          continue;
        }
        socket.write(`${tag} OK done\r\n`);
      }
    });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  close.push(() => { for (const socket of sockets) socket.destroy(); server.close(); });
  const account: EmailAccount = {
    address: "reader@pagination.example", username: "reader", password: "fake-pagination-password", connectedAt: 0,
    imap: { host, port: (server.address() as { port: number }).port, secure: true },
  };
  const guard: EmailGuard = async () => ({ host: "127.0.0.1", servername: host });
  return { account, guard, commands };
}

describe.skipIf(!certificate)("mail pagination over TLS", () => {
  it("ends the oldest page at UID 1 without issuing an invalid UID range", async () => {
    const fixture = await mailbox([1]);
    expect(await listMessages(fixture.account, fixture.guard, { mailbox: "INBOX", limit: 20, beforeUid: 1 }))
      .toEqual({ total: 10, messages: [] });
    expect(fixture.commands.some(command => command.startsWith("UID SEARCH") || command.startsWith("UID FETCH"))).toBe(false);
    expect(fixture.commands).toContain("LOGOUT");
  });

  it("returns an empty page when earlier UIDs have been expunged", async () => {
    const fixture = await mailbox([]);
    expect(await listMessages(fixture.account, fixture.guard, { mailbox: "INBOX", limit: 20, beforeUid: 5 }))
      .toEqual({ total: 10, messages: [] });
    expect(fixture.commands.some(command => command.startsWith("UID FETCH"))).toBe(false);
  });

  it("reports a refused older-message search instead of claiming the mailbox ended", async () => {
    const fixture = await mailbox([], 10, true);
    await expect(listMessages(fixture.account, fixture.guard, { mailbox: "INBOX", limit: 20, beforeUid: 5 }))
      .rejects.toMatchObject({ code: "server", message: expect.stringContaining("search") });
    expect(fixture.commands).toContain("LOGOUT");
  });

  it("reports a refused filtered search instead of claiming there are no matches", async () => {
    const fixture = await mailbox([], 10, true);
    await expect(searchMessages(fixture.account, fixture.guard, { mailbox: "INBOX", limit: 20, subject: "invoice" }))
      .rejects.toMatchObject({ code: "server", message: expect.stringContaining("search") });
    expect(fixture.commands).toContain("LOGOUT");
  });

  it("keeps the latest eligible UIDs in newest-first order", async () => {
    const fixture = await mailbox([2, 4, 8]);
    const result = await listMessages(fixture.account, fixture.guard, { mailbox: "INBOX", limit: 2, beforeUid: 10 });
    expect(result.total).toBe(10);
    expect(result.messages.map(message => message.uid)).toEqual([8, 4]);
  });
});
