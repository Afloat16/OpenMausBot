# OpenMausBot verified review follow-ups — 2026-11-09

Six existing PRs received verified follow-up fixes. Each published body distinguishes its initial source from its current head and preserves the existing bot release-notes block verbatim. These are updates to the same six PRs, not additional contributions.

## Review follow-up publication

All six updated PR bodies are published and verified against their source heads. Eight tracked review threads are resolved. The two numeric-container policy suggestions have [one explanation](https://github.com/milind-soni/OpenMausBot/pull/5085#discussion_r4515560759) and [one root-argument explanation](https://github.com/milind-soni/OpenMausBot/pull/5085#discussion_r4515566118), and remain unresolved for maintainer input. The original two numeric-loss findings are resolved without duplicate replies. Latest numeric publication verification: 2026-11-09 17:07:43 UTC.

The fitter keeps matching JSON containers with unsafe numeric tokens as original text for validation. Numeric-looking plain text still uses the existing array-wrapping behavior. This boundary is documented in the published PR body and replies.

## PR #5085

[Upstream PR](https://github.com/milind-soni/OpenMausBot/pull/5085) · Current head: `91d75f1d17085115e6ed10e083f98cc71d2c5e7e` · [Final verification](https://github.com/Afloat16/claude-mem/actions/runs/42659914559/job/129308380945)

Publication: body saved and API-verified. The two original numeric-loss threads are resolved. Both policy replies are published; their threads remain unresolved for maintainer input.

### Published PR body

````markdown
## Problem

The argument fitter can change numeric text before the connected tool validates it. Large integers lose digits, extreme decimals underflow to zero or overflow, and a fractional value can round to an integer. Parsing arguments from JSON text can lose the original numeric token before the schema-specific guard runs.

## Change

Keep numeric text unchanged unless its decimal value survives conversion to a finite JavaScript number within the supported integer range. Integer schemas still require an integral value.

Use the original numeric tokens supplied by the JSON reviver in the repository's required Node 24 runtime. If a JSON object or array would lose numeric information, retain its original text for normal tool validation. Check the requested object/array shape before applying that guard, so numeric-looking plain text and non-array JSON text still use the existing string-array and one-field-object wrapping behavior.

## Verification

### Current head

Exact source: `91d75f1d17085115e6ed10e083f98cc71d2c5e7e`.

- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: 54 passed across `server/connector-arguments.test.ts` and `server/connector-proxy.test.ts`.
- Changed TypeScript files: Oxlint with warnings denied, passed with zero warnings or errors.
- Official isolated fake-engine server launch and `control:omb doctor`: passed.

https://github.com/Afloat16/claude-mem/actions/runs/42659914559/job/129308380945

The follow-up adds 24 numeric/compatibility unit cases and one real proxy integration case. The proxy case exercises nine requests through the production child process, schema discovery, stdin JSON-RPC, and an owned loopback HTTP upstream. It checks preserved numeric text, nested JSON, valid conversions, and plain-text array fallback.

### Before-fix evidence

At the initial source `a05ee1605344ddd79ef35fd52637864040d2ec86`, the new numeric suite produced 18 regression failures and four compatibility passes:
https://github.com/Afloat16/claude-mem/actions/runs/42658225446/job/129302398527

The intermediate correction `683d1fe6c6fd6a4827556dc3aee605ba91228c8c` exposed two plain-text array fallback regressions. Both were reproduced before the shape-specific correction:
https://github.com/Afloat16/claude-mem/actions/runs/42659701187/job/129307618961

### Initial publication

The initial source passed nine targeted tests and full project typecheck:
https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278148

## Scope

These checks protect text parsed or coerced by `fitArguments`. A matching JSON container with an unsafe numeric token stays intact for tool validation, so partial field rewrites are not applied to that text. Numeric-looking plain text still uses safe wrapping: `9007199254740993` becomes a string item, while the actual JSON array `[9007199254740993]` remains text because its numeric element cannot be preserved as a Number. Already parsed numeric values retain their existing behavior; precision lost before reaching this function cannot be reconstructed here. The transport fixture uses a local stand-in for the upstream provider.

Related schema-fitting work: #3932 and #3999.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->
<!-- coderabbit-ai-generated:v1 -->

## Summary by CodeRabbit

- **Bug Fixes**
  - Numeric text that is too small, too large, or precision-sensitive is preserved rather than converted to a potentially inaccurate number.
  - This behavior applies to numeric and integer arguments, including values in nested objects, arrays, and JSON text.
  - Safe numeric values, including integral decimal spellings such as `"42.0"`, continue to convert.
  - Quoted numeric-looking strings, ordinary text fallback, and malformed-JSON behavior remain unchanged.
<!-- end of auto-generated comment: release notes by coderabbit.ai -->
````

### Published policy replies

[Reply](https://github.com/milind-soni/OpenMausBot/pull/5085#discussion_r4515560759) to [review comment](https://github.com/milind-soni/OpenMausBot/pull/5085#discussion_r4515492385); unresolved.

> Keeping an unsafe JSON container as its original text is deliberate. The fitter uses JavaScript Numbers for numeric values; these tokens cannot be represented safely that way, and converting them to strings would change their JSON types. Normal tool validation can reject the unchanged input. Safe arrays and numeric-looking plain-text wrapping still work; both are covered in 91d75f1. I am leaving this tradeoff open for maintainer input.

[Reply](https://github.com/milind-soni/OpenMausBot/pull/5085#discussion_r4515566118) to [review comment](https://github.com/milind-soni/OpenMausBot/pull/5085#discussion_r4515492400); unresolved.

> The root-text behavior is intentional: if that JSON cannot be converted without losing a numeric value or changing its type, the complete original argument text goes to validation and no partial rename is reported. Independent fields still fit when the input is already an object; the regression covers a safe timeout beside unsafe nested JSON text. This patch keeps that boundary, with all 54 targeted tests and the real proxy transport passing at 91d75f1.

## PR #5087

Publication: body saved and API-verified; all 1 review thread resolved. No additional reply was needed after the threads were resolved.

[Upstream PR](https://github.com/milind-soni/OpenMausBot/pull/5087) · Current head: `a468ff2b308da30af96143b09880fed69a003de9` · [Final verification](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260136016)

### Published PR body

````markdown
## What changed

Reject encoded input that ends with five or more leftover bits, which represent an incomplete additional symbol group. Cover both raw and otpauth setup keys while retaining padded/unpadded valid Base32 forms and the existing TOTP vectors.

Keep strict Base32 decoding for new setup input, while code generation uses a private compatibility decoder for previously saved keys with an incomplete final group. Invalid alphabet characters remain rejected; no stored data is migrated.

## Why

A Base32 secret with an impossible encoded length is accepted after dropping a final incomplete group. For example, appending one character to a valid 16-character setup key silently produces the same decoded bytes, hiding malformed new setup input.

Strict setup validation exposed a compatibility issue for keys already accepted and persisted by older versions. Those saved keys must keep generating the same bytes, while new malformed setup input remains rejected.

## How it was verified

### Final head

- Current source: `a468ff2b308da30af96143b09880fed69a003de9`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **44 passed across 1 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260136016).

The final suite covers saved 17-, 19-, and 22-character keys at two counters, invalid-character rejection, and strict new-input parsing. An isolated owned application fixture encrypted, saved and reloaded a legacy key; POST /api/logins rejected a new 17-character key with HTTP 400 and accepted a valid 16-character key with HTTP 201. The fixture's control doctor passed.

Focused `node:test` probes on the previous source `65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4` reproduced 1 failing regression and 1 passing compatibility check: [before-fix evidence](https://github.com/Afloat16/claude-mem/actions/runs/42644958000/job/129255617891).

### Initial publication

The initial source `65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4` passed 40 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278033). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

## Compatibility

Only code generation for already persisted keys retains the historical byte-decoding behavior. Public decodeBase32 and parseTotpKey remain strict for new input, with no credential migration.

## Related history

[#246](https://github.com/milind-soni/OpenMausBot/pull/246), [#2725](https://github.com/milind-soni/OpenMausBot/pull/2725), [#2726](https://github.com/milind-soni/OpenMausBot/pull/2726), [#2730](https://github.com/milind-soni/OpenMausBot/pull/2730). Existing TOTP setup and credential work accepts the malformed lengths. This change adds the missing decoder validation.

## Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/totp-base32-validation`.
- Current head: `a468ff2b308da30af96143b09880fed69a003de9`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

## Summary by CodeRabbit

* **Bug Fixes**
  * Base32 secrets with incomplete trailing groups are now rejected during 2FA setup-key parsing, including secrets provided in `otpauth://` inputs.
  * Complete base32 encodings remain accepted with or without padding.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
````

### Verified review reply

````text
Fixed in `a468ff2b308da30af96143b09880fed69a003de9`. Saved TOTP keys retain the byte-decoding behavior used when they were accepted, while parseTotpKey and decodeBase32 still reject incomplete Base32 groups for new input. Regressions cover 17-, 19-, and 22-character saved keys at two counters and invalid-character rejection. An isolated encrypted-vault reload and the real login route also passed; new invalid setup remains rejected. Full typecheck, all 44 tests, changed-file lint and the controlled application fixture pass: https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260136016
````

## PR #5088

Publication: body saved and API-verified; all 1 review thread resolved. [Published review reply](https://github.com/milind-soni/OpenMausBot/pull/5088#discussion_r4514848681).

[Upstream PR](https://github.com/milind-soni/OpenMausBot/pull/5088) · Current head: `6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8` · [Final verification](https://github.com/Afloat16/claude-mem/actions/runs/42646859631/job/129262322689)

### Published PR body

````markdown
## What changed

Use parsed MCP table keys as the authoritative names when TOML parsing succeeds. Keep the existing header scan as a fallback for an unreadable config. Ignore header-looking text inside multiline strings.

Reserve each allocated custom mount name against both configured names and the mounts already selected for this turn, so two custom servers cannot overwrite one another. Disable special literal config keys through a whole-table CLI override placed before per-mount overrides; ordinary names keep their existing flat overrides. Tool-scope validation and effective-config checks remain unchanged.

## Why

The Codex name-reservation path only scans table headers, although the same function already parses TOML tables. Inline tables, dotted keys and Unicode-escaped names are missed, allowing custom overrides to collide with the person's existing MCP config and fail a turn.

An inline configuration reserving notes could make custom notes and notes_openmausbot share one mount. A literal ambient name such as notes.prod was also split into nested CLI keys by Codex, which can reject the configuration before the prompt.

## How it was verified

### Final head

- Current source: `6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **23 passed across 3 test files**. The driver run selected 6 relevant cases; its other 280 cases were skipped.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42646859631/job/129262322689).

Two new helper cases cover literal dotted/quoted names and unchanged ordinary overrides. Two new driver cases exercise inline-name collisions and a valid selected catalog beside a dotted ambient server, including preservation of built-in mounts. Four existing driver compatibility cases also pass.

### Initial publication

The initial source `958f66787e23abf8d37640d96654ed274ef6bba1` passed 15 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277922). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

## Compatibility

Driver integration checks use the repository's fake app-server. The actual Codex CLI was not launched in this validation; its version 0.160.1 override and table-merge implementation was inspected directly.

## Related history

[#1601](https://github.com/milind-soni/OpenMausBot/pull/1601), [#2946](https://github.com/milind-soni/OpenMausBot/pull/2946), [#4346](https://github.com/milind-soni/OpenMausBot/pull/4346). PR #1601 explicitly left inline MCP tables unsupported. This patch closes that documented gap with the parser already present on main.

Implementation references:

- https://github.com/openai/codex/blob/rust-v0.160.1/codex-rs/config/src/overrides.rs
- https://github.com/openai/codex/blob/rust-v0.160.1/codex-rs/config/src/merge.rs

## Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/codex-inline-mcp-collisions`.
- Current head: `6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

## Summary by CodeRabbit

* **Bug Fixes**
  * Improved recognition of Codex MCP server names in configuration files, including inline and dotted table formats.
  * Server names can still be discovered when unrelated configuration syntax is invalid.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
````

### Verified review reply

````text
Fixed in `6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8`. Custom mounts now reserve every chosen name, including earlier custom mounts. Scoped turns disable literal configured names with a whole-table CLI override before adding the selected mounts, so dotted names stay literal and the override cannot erase built-in mount entries. The tool-scope grammar remains unchanged. Full project typecheck, 17 helper/TOML cases, 6 targeted driver cases, and changed-file lint pass: https://github.com/Afloat16/claude-mem/actions/runs/42646859631/job/129262322689
````

## PR #5089

Publication: body saved and API-verified; all 1 review thread resolved. No additional reply was needed after the threads were resolved.

[Upstream PR](https://github.com/milind-soni/OpenMausBot/pull/5089) · Current head: `a331e14a18803a876ca60149286bff88e58c197a` · [Final verification](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104388)

### Published PR body

````markdown
## What changed

Validate and retain cap.exhausted records with the required string handoffPath and reason=cap. Continue discarding malformed records at the log boundary.

Reject empty or whitespace-only cap handoff paths, resolve historical relative paths while replaying them, and make new handoff paths absolute even when OMB_DATA_DIR is relative. Valid persisted cap events remain in the inspector.

## Why

The runtime defines cap.exhausted as a resumable terminal event with a persisted handoff, but the inspector's event guard rejects that event type. Reloading the log therefore omits the event explaining why a turn stopped and where its handoff was stored.

The event contract promises an absolute handoff path, while older writers could persist a relative path. Rejecting every relative record would discard real historical handoffs.

## How it was verified

### Final head

- Current source: `a331e14a18803a876ca60149286bff88e58c197a`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **30 passed across 2 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104388).

The malformed-record case now includes empty and whitespace paths. New regressions retain and normalize a legacy relative record, and verify that a handoff written with a relative data directory returns an absolute path in the same directory.

### Initial publication

The initial source `5c300847c6260e8d42aee4238f9a89dbe12195c3` passed 14 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277953). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

## Compatibility

Relative legacy paths retain ordinary resolution against the running server's working directory. These checks ran on Linux; no cross-platform live application run is claimed.

## Related history

[#3374](https://github.com/milind-soni/OpenMausBot/pull/3374). Related runtime status work does not add the missing inspector guard case.

## Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/inspector-cap-events`.
- Current head: `a331e14a18803a876ca60149286bff88e58c197a`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

## Summary by CodeRabbit

* **Bug Fixes**
  * Improved validation of runtime handoff events so only events with a valid handoff path and the supported reason are accepted.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
````

### Verified review reply

````text
Fixed in `a331e14a18803a876ca60149286bff88e58c197a`. Empty handoff paths are rejected, new handoffs use an absolute directory, and replay resolves existing relative paths instead of dropping those cap events. This preserves relative OMB_DATA_DIR installations while returning an absolute inspector path. Full project typecheck, all 30 thread-event/handoff tests, and changed-file lint pass: https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104388
````

## PR #5090

Publication: body saved and API-verified; all 2 review threads resolved. No additional reply was needed after the threads were resolved.

[Upstream PR](https://github.com/milind-soni/OpenMausBot/pull/5090) · Current head: `b820dff83ae58238d90f68c54319400187661a75` · [Final verification](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260135662)

### Published PR body

````markdown
## What changed

Use Node's built-in Intl.Segmenter word boundaries when there is no whitespace cut within the cap. Prevent short-fragment merging from exceeding maxChars. Keep indivisible English tokens whole as the existing tests require and preserve supplementary Unicode letters.

Keep attached punctuation with an indivisible word, and fall back to complete grapheme boundaries only for oversized Katakana segments. Preserve combining marks and the first/subsequent chunk limits without splitting Latin tokens.

## Why

Speech chunking only looks for spaces and a small set of spaced punctuation. Long Chinese and Japanese replies therefore remain one oversized utterance and bypass the short first-block cap, delaying the start of speech.

A 320-character English word followed by a period was split into a word and a punctuation-only chunk. A long Katakana segment could still bypass the intended chunk bound because word segmentation treated it as one token.

## How it was verified

### Final head

- Current source: `b820dff83ae58238d90f68c54319400187661a75`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **34 passed across 1 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260135662).

Both reported cases failed on the exact previous head. The final 34-case suite passes, and an isolated owned server fixture exercised POST /api/tts/prepare for the English punctuation case and 642 code units of decomposed Katakana. Its control doctor passed.

Focused `node:test` probes on the previous source `216ba4ea3b95eed7fcf344f6987f9c88f47a6d59` reproduced 2 failing regressions: [before-fix evidence](https://github.com/Afloat16/claude-mem/actions/runs/42644958000/job/129255618294).

### Initial publication

The initial source `216ba4ea3b95eed7fcf344f6987f9c88f47a6d59` passed 30 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277715). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

## Compatibility

Latin tokens, including their combining marks and attached terminal punctuation, remain indivisible. Only oversized Katakana segments use the grapheme fallback. The TTS provider and dependencies are unchanged.

## Related history

[#3190](https://github.com/milind-soni/OpenMausBot/pull/3190), [#3191](https://github.com/milind-soni/OpenMausBot/pull/3191), [#3545](https://github.com/milind-soni/OpenMausBot/pull/3545). Earlier voice-latency changes introduce the first-block cap but leave unspaced language text unchunked. This patch supplies language-aware word boundaries using built-in ICU.

## Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/tts-unspaced-chunk-limits`.
- Current head: `b820dff83ae58238d90f68c54319400187661a75`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

## Summary by CodeRabbit

* **Bug Fixes**
  * Improved speech text splitting so short adjacent phrases stay within configured length limits.
  * Preserved complete text and supplementary Unicode letters when splitting unspaced or unusually bounded text.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
````

### Verified review reply

````text
Fixed in `b820dff83ae58238d90f68c54319400187661a75`. Terminal punctuation stays attached to an indivisible word. Oversized Katakana segments fall back to grapheme boundaries, preserving combining marks and the first/subsequent chunk limits; Latin tokens remain indivisible. Both reported cases failed against the previous head and now pass, including the real /api/tts/prepare route. Full typecheck, all 34 tests, changed-file lint and the controlled application fixture pass: https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260135662
````

## PR #5092

Publication: body saved and API-verified; all 1 review thread resolved. [Published review reply](https://github.com/milind-soni/OpenMausBot/pull/5092#discussion_r4514841954).

[Upstream PR](https://github.com/milind-soni/OpenMausBot/pull/5092) · Current head: `13faee0bf135b35db9ce81850ec8a469d03462f1` · [Final verification](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104705)

### Published PR body

````markdown
## What changed

Require a matching request ID and a response result/error, excluding server requests and notifications. Apply the same validation to JSON and SSE; keep correlated errors and replay valid cached lists under the new request ID.

Preserve a null-ID JSON-RPC error as an error-only diagnostic when no correlated response exists. The diagnostic has no request ID or result; a correlated frame takes priority regardless of SSE order. Cache admission also rejects every error-bearing frame.

## Why

The connector response parser accepts any direct JSON object and falls back to the last SSE frame when no matching ID exists. An unrelated tools/list response can populate the fallback cache, so a later outage is masked with a tool catalog that did not answer the original request.

JSON-RPC uses a null ID when the server cannot identify a request. Dropping that error hid its useful message, but treating it as a matching response could contaminate the tools cache.

## How it was verified

### Final head

- Current source: `13faee0bf135b35db9ce81850ec8a469d03462f1`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **29 passed across 2 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104705).

Ten additional cases cover JSON/SSE null-ID diagnostics, matching-response priority, invalid frames, mixed error/result frames, and cache isolation after a diagnostic.

### Initial publication

The initial source `3f7e2ce345cf890bb472b0f93f44e532168b9aff` passed 19 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277997). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

## Compatibility

The diagnostic remains separate from a successful response. Request-ID matching stays strict and the transport framing behavior is unchanged.

## Related history

No matching parseMcpResponse history result was found; regression tests reproduce cache contamination with mismatched JSON and SSE response IDs on current main.

Implementation references:

- https://www.jsonrpc.org/specification#response_object

## Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/connector-response-correlation`.
- Current head: `13faee0bf135b35db9ce81850ec8a469d03462f1`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

## Summary by CodeRabbit

* **Bug Fixes**
  * Improved reliability when receiving tool-list responses over standard and streamed connections. Responses are now matched to the correct request, while unrelated messages are ignored.
  * Correctly preserves errors tied to a request and prevents unrelated results from being used as fallback data.
  * Cached tool lists continue to work when replayed for a new request.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
````

### Verified review reply

````text
Fixed in `13faee0bf135b35db9ce81850ec8a469d03462f1`. Null-ID backend errors now survive as error-only diagnostics without an id or result. A matching response wins over those diagnostics in either SSE order, and neither diagnostics nor other error-bearing frames can populate the tools cache. Full project typecheck, all 29 connector/connected-read tests, and changed-file lint pass: https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104705
````
