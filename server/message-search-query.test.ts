import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { searchMessagesInDatabase } from "./message-search-query.ts";

let database: DatabaseSync;

beforeEach(() => {
  database = new DatabaseSync(":memory:");
  database.exec("CREATE TABLE messages(thread_id TEXT, id TEXT, at INTEGER, role TEXT, kind TEXT, text TEXT, json TEXT)");
});
afterEach(() => database.close());

function add(id: string, text: string, kind = "text", thread = "thread") {
  database.prepare("INSERT INTO messages VALUES(?, ?, ?, 'user', ?, ?, ?)").run(
    thread, id, Number(id), kind, kind === "text" ? text : null,
    JSON.stringify(kind === "activity" ? { tool: { name: text } } : { text }),
  );
}

it.each([
  ["ÉCOLE", "école"],
  ["ПРИВЕТ", "привет"],
  ["ΑΘΉΝΑ", "αθήνα"],
])("matches non-ASCII case variants in text and tool names: %s", (text, query) => {
  add("1", text);
  add("2", text, "activity");
  const hits = searchMessagesInDatabase(database, query);
  expect(hits.map(hit => hit.messageId)).toEqual(["2", "1"]);
  for (const hit of hits) expect(hit.snippet.slice(hit.matchStart, hit.matchStart + hit.matchLength)).toBe(text);
});

it("keeps literal LIKE characters, result limits and thread scopes", () => {
  add("1", "ÉCOLE 10%_\\", "text", "first");
  add("2", "ÉCOLE 10xx", "text", "first");
  add("3", "ÉCOLE 10%_\\", "text", "second");
  expect(searchMessagesInDatabase(database, "école 10%_\\", 1).map(hit => hit.messageId)).toEqual(["3"]);
  expect(searchMessagesInDatabase(database, "école 10%_\\", 1, "first").map(hit => hit.messageId)).toEqual(["1"]);
  expect(searchMessagesInDatabase(database, "  ")).toEqual([]);
});

it("maps expanded lowercase offsets back to the displayed text", () => {
  add("1", "İ before ÉCOLE");
  const hit = searchMessagesInDatabase(database, "école")[0];
  expect(hit).toBeDefined();
  expect(hit.snippet.slice(hit.matchStart, hit.matchStart + hit.matchLength)).toBe("ÉCOLE");
});

it("highlights the original character when lowercase expands inside the match", () => {
  add("1", "İSTANBUL");
  const hit = searchMessagesInDatabase(database, "i\u0307stanbul")[0];
  expect(hit).toBeDefined();
  expect(hit.snippet.slice(hit.matchStart, hit.matchStart + hit.matchLength)).toBe("İSTANBUL");
});
