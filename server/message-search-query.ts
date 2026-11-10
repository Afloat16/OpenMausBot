import type { DatabaseSync } from "node:sqlite";

const searchConnections = new WeakSet<DatabaseSync>();

function matchRange(text: string, needle: string): { start: number; end: number } | null {
  const at = text.toLowerCase().indexOf(needle);
  if (at < 0) return null;
  let original = 0;
  let folded = 0;
  let start = 0;
  for (const character of text) {
    const next = folded + character.toLowerCase().length;
    if (folded <= at && at < next) start = original;
    if (folded < at + needle.length && at + needle.length <= next) return { start, end: original + character.length };
    original += character.length;
    folded = next;
  }
  return null;
}

export interface SearchHit {
  threadId: string;
  messageId: string;
  at: number;
  role: string;
  kind: string;
  snippet: string;
  matchStart: number;
  matchLength: number;
  from?: string;
}

export function searchMessagesInDatabase(database: DatabaseSync, query: string, limit = 40, threadId?: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  if (!searchConnections.has(database)) {
    database.function("search_lower", { deterministic: true }, value => typeof value === "string" ? value.toLowerCase() : null);
    searchConnections.add(database);
  }
  const pattern = `%${needle.replace(/([\\%_])/g, "\\$1")}%`;
  const scope = threadId ? "thread_id = ? AND " : "";
  const statement = database.prepare(
    "SELECT thread_id, id, at, role, kind, text, json_extract(json, '$.tool.name') AS tool_name, json_extract(json, '$.from.name') AS from_name FROM messages " +
      `WHERE ${scope}((kind = 'text' AND text IS NOT NULL AND search_lower(text) LIKE ? ESCAPE '\\') ` +
      "   OR (kind = 'activity' AND tool_name IS NOT NULL AND search_lower(tool_name) LIKE ? ESCAPE '\\')) " +
      "ORDER BY at DESC LIMIT ?",
  );
  const rows = (threadId
    ? statement.all(threadId, pattern, pattern, limit)
    : statement.all(pattern, pattern, limit)) as Array<{
    thread_id: string;
    id: string;
    at: number;
    role: string;
    kind: string;
    text: string | null;
    tool_name: string | null;
    from_name: string | null;
  }>;
  return rows.map((row) => {
    const haystack = row.kind === "activity" ? (row.tool_name ?? "") : (row.text ?? "");
    const hit = matchRange(haystack, needle) ?? { start: 0, end: 0 };
    const start = Math.max(0, hit.start - 60);
    const end = Math.min(haystack.length, hit.end + 90);
    const head = start > 0 ? "…" : "";
    const body = haystack.slice(start, end).replace(/\s+/g, " ").trim();
    const snippet = head + body + (end < haystack.length ? "…" : "");
    const folded = needle.replace(/\s+/g, " ");
    const match = matchRange(snippet, folded);
    return {
      threadId: row.thread_id,
      messageId: row.id,
      at: row.at,
      role: row.role,
      kind: row.kind,
      snippet,
      matchStart: match?.start ?? head.length,
      matchLength: match ? match.end - match.start : 0,
      ...(row.from_name ? { from: row.from_name } : {}),
    };
  });
}
