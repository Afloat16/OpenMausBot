# OpenMausBot contribution record — 2026-11-09

**Ten independent upstream pull requests are open: #5083–#5092. No PR in this batch is merged at the latest verification.** Each published head matches its original locally tested source tree and the exact source SHA used by remote CI.

## Verification

- All ten published source heads pass full `pnpm typecheck` and targeted Vitest suites using the repository's actual configuration: **240 passed test executions across 15 files**. [Workflow run](https://github.com/Afloat16/claude-mem/actions/runs/42634877637).
- The original local targeted run also passed all 240 tests, including 60 new cases and 35 regressions reproduced on the unchanged upstream base. Node 24.22.1; Vitest 4.1.11.
- All changed TypeScript files passed Oxlint 1.80.0 with the repository configuration. Every independent branch passed `git diff --check`.
- The complete repository test suite and application workflow were outside these targeted checks.
- Latest upstream PR state and branch/SHA verification: 2026-11-09 15:13:18 UTC.

## Independent changes

| # | Change | Upstream PR | State | Exact source | Targeted tests | Full typecheck |
|---|---|---|---|---|---:|---|
| 1 | fix: release retry backoff timers and abort listeners | [#5083](https://github.com/milind-soni/OpenMausBot/pull/5083) | open | [`ba3c2b7c65b1`](https://github.com/Afloat16/OpenMausBot/commit/ba3c2b7c65b1f6d1a10d4a56aa173a4a94e685f7) | 23 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277861) |
| 2 | fix: preserve automation failure history during active runs | [#5084](https://github.com/milind-soni/OpenMausBot/pull/5084) | open | [`1872e9fa09e8`](https://github.com/Afloat16/OpenMausBot/commit/1872e9fa09e81ec84946b7507df585a27a89a9fa) | 6 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277453) |
| 3 | fix: preserve unsafe connector numeric arguments | [#5085](https://github.com/milind-soni/OpenMausBot/pull/5085) | open | [`a05ee1605344`](https://github.com/Afloat16/OpenMausBot/commit/a05ee1605344ddd79ef35fd52637864040d2ec86) | 9 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278148) |
| 4 | fix: preserve MCP SSE framing across split CRLF bytes | [#5086](https://github.com/milind-soni/OpenMausBot/pull/5086) | open | [`930ff7d757a0`](https://github.com/Afloat16/OpenMausBot/commit/930ff7d757a0337765c702ce5282d26b0d9aac6b) | 13 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278004) |
| 5 | fix: reject incomplete Base32 groups in TOTP keys | [#5087](https://github.com/milind-soni/OpenMausBot/pull/5087) | open | [`65f33fccb3ef`](https://github.com/Afloat16/OpenMausBot/commit/65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4) | 40 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278033) |
| 6 | fix: detect MCP name collisions from parsed Codex config | [#5088](https://github.com/milind-soni/OpenMausBot/pull/5088) | open | [`958f66787e23`](https://github.com/Afloat16/OpenMausBot/commit/958f66787e23abf8d37640d96654ed274ef6bba1) | 15 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277922) |
| 7 | fix: retain budget exhaustion events in the thread inspector | [#5089](https://github.com/milind-soni/OpenMausBot/pull/5089) | open | [`5c300847c626`](https://github.com/Afloat16/OpenMausBot/commit/5c300847c6260e8d42aee4238f9a89dbe12195c3) | 14 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277953) |
| 8 | fix: split unspaced speech at Unicode word boundaries | [#5090](https://github.com/milind-soni/OpenMausBot/pull/5090) | open | [`216ba4ea3b95`](https://github.com/Afloat16/OpenMausBot/commit/216ba4ea3b95eed7fcf344f6987f9c88f47a6d59) | 30 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277715) |
| 9 | fix: reject rolled-over dates in extraction responses | [#5091](https://github.com/milind-soni/OpenMausBot/pull/5091) | open | [`ffd027c9660d`](https://github.com/Afloat16/OpenMausBot/commit/ffd027c9660d31fd35c7df95b01363e02ddd1cd0) | 71 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278129) |
| 10 | fix: correlate connector replies before caching tool lists | [#5092](https://github.com/milind-soni/OpenMausBot/pull/5092) | open | [`3f7e2ce345cf`](https://github.com/Afloat16/OpenMausBot/commit/3f7e2ce345cf890bb472b0f93f44e532168b9aff) | 19 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277997) |

## Change details and verification

### 1. fix: release retry backoff timers and abort listeners

[Upstream PR #5083](https://github.com/milind-soni/OpenMausBot/pull/5083) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277861)

Branch: `fix/retry-delay-cleanup`  
Published source: `ba3c2b7c65b1f6d1a10d4a56aa173a4a94e685f7`  
Original local commit: `16ffc2454e664729a4a6fa54fdc22762bb91ccbe`

#### What changed

Settle every backoff through a shared cleanup path that clears its timer and detaches its abort listener. Already aborted signals cancel without scheduling a timer. Preserve the elapsed/cancelled result and idempotent cancellation.

#### Why

Elapsed and manually cancelled retry backoffs leave abort listeners attached to the turn, while an already aborted signal still creates a live timer. Repeated retry waits retain stale closures and can produce listener warnings.

#### How it was verified

- Added 5 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 3 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **23 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/drivers/retry-delay.test.ts`, `server/drivers/retry.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `ba3c2b7c65b1f6d1a10d4a56aa173a4a94e685f7` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **23 passed across 2 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277861).

#### Related history

[#388](https://github.com/milind-soni/OpenMausBot/pull/388), [#1198](https://github.com/milind-soni/OpenMausBot/pull/1198), [#5042](https://github.com/milind-soni/OpenMausBot/pull/5042). The earlier PRs implement retry scheduling and stop propagation. This patch fixes cleanup after the existing delay settles.

#### Compatibility

Does not change the retry schedule or error classification.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/retry-delay-cleanup`.
- Independent local commit: `16ffc2454e664729a4a6fa54fdc22762bb91ccbe`.
- Published fork commit: `ba3c2b7c65b1f6d1a10d4a56aa173a4a94e685f7`.
- Published tree `70a2408541deb71299087a3677e55a215085bb6c` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 2. fix: preserve automation failure history during active runs

[Upstream PR #5084](https://github.com/milind-soni/OpenMausBot/pull/5084) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277453)

Branch: `fix/automation-history-active-runs`  
Published source: `1872e9fa09e81ec84946b7507df585a27a89a9fa`  
Original local commit: `c404505ca70add7e43d65d941674b14dbea1a2d9`

#### What changed

Exclude every active status from the settled-run boundary. Keep the existing per-automation retention limit and reach back through failures until an actual settled non-problem run.

#### Why

A running or waiting automation is currently marked as the last settled success when building the app's history window. After five runs, older acknowledged failures and the preceding successful run disappear, so the displayed failure streak lacks its history.

#### How it was verified

- Added 3 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 2 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **6 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/routine-run-window.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `1872e9fa09e81ec84946b7507df585a27a89a9fa` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **6 passed across 1 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277453).

#### Related history

[#4151](https://github.com/milind-soni/OpenMausBot/pull/4151), [#4837](https://github.com/milind-soni/OpenMausBot/pull/4837). The earlier history-window and progress-write changes do not distinguish running/waiting from a settled success at this boundary.

#### Compatibility

Only the startup run window changes; the stored history and scheduler are unchanged.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/automation-history-active-runs`.
- Independent local commit: `c404505ca70add7e43d65d941674b14dbea1a2d9`.
- Published fork commit: `1872e9fa09e81ec84946b7507df585a27a89a9fa`.
- Published tree `950f96e716580ba1d0b76c6407a66208f06b472b` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 3. fix: preserve unsafe connector numeric arguments

[Upstream PR #5085](https://github.com/milind-soni/OpenMausBot/pull/5085) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278148)

Branch: `fix/connector-numeric-coercion`  
Published source: `a05ee1605344ddd79ef35fd52637864040d2ec86`  
Original local commit: `29a640e3e5ac33b7cb4b563d9756be8ba8de7834`

#### What changed

Only coerce finite numeric values, preserve integral values outside the safe integer range as text, and require integral values for integer schemas. Leave rejected text available for the tool's normal validation instead of silently altering its value.

#### Why

The connector argument fitter converts any decimal-looking string with Number(). Large identifiers can be rounded, very large values become Infinity and serialize as null, and fractional strings are converted even for an integer schema.

#### How it was verified

- Added 3 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 3 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **9 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/connector-arguments.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `a05ee1605344ddd79ef35fd52637864040d2ec86` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **9 passed across 1 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278148).

#### Related history

[#3932](https://github.com/milind-soni/OpenMausBot/pull/3932), [#3999](https://github.com/milind-soni/OpenMausBot/pull/3999). The earlier PR introduced schema fitting. It does not guard the loss of precision or numeric overflow reproduced here.

#### Compatibility

Safely representable integer and fractional number conversions remain supported.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/connector-numeric-coercion`.
- Independent local commit: `29a640e3e5ac33b7cb4b563d9756be8ba8de7834`.
- Published fork commit: `a05ee1605344ddd79ef35fd52637864040d2ec86`.
- Published tree `b9638b3b41d33bf7c36a6e1b9986d64aec54c97a` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 4. fix: preserve MCP SSE framing across split CRLF bytes

[Upstream PR #5086](https://github.com/milind-soni/OpenMausBot/pull/5086) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278004)

Branch: `fix/mcp-sse-crlf-framing`  
Published source: `930ff7d757a0337765c702ce5282d26b0d9aac6b`  
Original local commit: `5c800758f626af8fe884d7f154135d6f82c8e8d2`

#### What changed

Carry the trailing-CR state between decoded chunks and suppress its paired LF. Preserve LF and lone-CR framing and streaming UTF-8 decoding.

#### Why

Normalizing CRLF separately for each network chunk turns a CR at one chunk's end and LF at the next chunk's start into a blank line. A valid multiline JSON-RPC event is dispatched prematurely and the request fails with an event-stream protocol error.

#### How it was verified

- Added 4 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 1 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **13 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/mcp-http-framing.test.ts`, `server/mcp-http.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `930ff7d757a0337765c702ce5282d26b0d9aac6b` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **13 passed across 2 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278004).

#### Related history

[#326](https://github.com/milind-soni/OpenMausBot/pull/326), [#569](https://github.com/milind-soni/OpenMausBot/pull/569). Related SSE work was inspected; no matching fix for the readSse chunk-boundary normalization was found. The current base reproduces the failure with one-byte chunks.

#### Compatibility

Tests use an injected in-memory stream and the existing local fake MCP server; no live connector credentials are used.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/mcp-sse-crlf-framing`.
- Independent local commit: `5c800758f626af8fe884d7f154135d6f82c8e8d2`.
- Published fork commit: `930ff7d757a0337765c702ce5282d26b0d9aac6b`.
- Published tree `3fb13d76321d207259b860e4d60602fc7fa9501d` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 5. fix: reject incomplete Base32 groups in TOTP keys

[Upstream PR #5087](https://github.com/milind-soni/OpenMausBot/pull/5087) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278033)

Branch: `fix/totp-base32-validation`  
Published source: `65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4`  
Original local commit: `0bfd586ccf12126e6e471412e903b2e3345c02ea`

#### What changed

Reject encoded input that ends with five or more leftover bits, which represent an incomplete additional symbol group. Cover both raw and otpauth setup keys while retaining padded/unpadded valid Base32 forms and the existing TOTP vectors.

#### Why

A Base32 secret with an impossible encoded length is accepted after dropping a final incomplete group. For example, appending one character to a valid 16-character setup key silently produces the same decoded bytes, hiding a malformed saved 2FA secret.

#### How it was verified

- Added 9 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 3 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **40 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/totp.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **40 passed across 1 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278033).

#### Related history

[#246](https://github.com/milind-soni/OpenMausBot/pull/246), [#2725](https://github.com/milind-soni/OpenMausBot/pull/2725), [#2726](https://github.com/milind-soni/OpenMausBot/pull/2726), [#2730](https://github.com/milind-soni/OpenMausBot/pull/2730). Existing TOTP setup and credential work accepts the malformed lengths. This change adds the missing decoder validation.

#### Compatibility

Previously accepted malformed-length saved keys will now be rejected and need correction. Valid setup keys and RFC code vectors remain supported.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/totp-base32-validation`.
- Independent local commit: `0bfd586ccf12126e6e471412e903b2e3345c02ea`.
- Published fork commit: `65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4`.
- Published tree `95043b98309c238b6172d3965ddb22eca32e5bc7` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 6. fix: detect MCP name collisions from parsed Codex config

[Upstream PR #5088](https://github.com/milind-soni/OpenMausBot/pull/5088) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277922)

Branch: `fix/codex-inline-mcp-collisions`  
Published source: `958f66787e23abf8d37640d96654ed274ef6bba1`  
Original local commit: `4e6298c0f5991575a01a254473ac35ffba6e2a0f`

#### What changed

Use parsed MCP table keys as the authoritative names when TOML parsing succeeds. Keep the existing header scan as a fallback for an unreadable config. Ignore header-looking text inside multiline strings.

#### Why

The Codex name-reservation path only scans table headers, although the same function already parses TOML tables. Inline tables, dotted keys and Unicode-escaped names are missed, allowing custom overrides to collide with the person's existing MCP config and fail a turn.

#### How it was verified

- Added 5 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 4 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **15 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/drivers/codex-mcp-names.test.ts`, `server/toml-lite.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `958f66787e23abf8d37640d96654ed274ef6bba1` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **15 passed across 2 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277922).

#### Related history

[#1601](https://github.com/milind-soni/OpenMausBot/pull/1601), [#2946](https://github.com/milind-soni/OpenMausBot/pull/2946), [#4346](https://github.com/milind-soni/OpenMausBot/pull/4346). PR #1601 explicitly left inline MCP tables unsupported. This patch closes that documented gap with the parser already present on main.

#### Compatibility

The fallback for malformed TOML is preserved; no Codex CLI or external config is changed by the tests.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/codex-inline-mcp-collisions`.
- Independent local commit: `4e6298c0f5991575a01a254473ac35ffba6e2a0f`.
- Published fork commit: `958f66787e23abf8d37640d96654ed274ef6bba1`.
- Published tree `5958d22d1176d235f18f19366ffca7176df4b07c` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 7. fix: retain budget exhaustion events in the thread inspector

[Upstream PR #5089](https://github.com/milind-soni/OpenMausBot/pull/5089) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277953)

Branch: `fix/inspector-cap-events`  
Published source: `5c300847c6260e8d42aee4238f9a89dbe12195c3`  
Original local commit: `cc875e552498bb528ca15908e70fda041e9b8edc`

#### What changed

Validate and retain cap.exhausted records with the required string handoffPath and reason=cap. Continue discarding malformed records at the log boundary.

#### Why

The runtime defines cap.exhausted as a resumable terminal event with a persisted handoff, but the inspector's event guard rejects that event type. Reloading the log therefore omits the event explaining why a turn stopped and where its handoff was stored.

#### How it was verified

- Added 1 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 1 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **14 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/thread-events.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `5c300847c6260e8d42aee4238f9a89dbe12195c3` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **14 passed across 1 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277953).

#### Related history

[#3374](https://github.com/milind-soni/OpenMausBot/pull/3374). Related runtime status work does not add the missing inspector guard case.

#### Compatibility

Only log-reading validation changes; no runtime budget or persistence behavior is altered.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/inspector-cap-events`.
- Independent local commit: `cc875e552498bb528ca15908e70fda041e9b8edc`.
- Published fork commit: `5c300847c6260e8d42aee4238f9a89dbe12195c3`.
- Published tree `e2eb088705e17f151c8d973c28deda0ba1552f0e` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 8. fix: split unspaced speech at Unicode word boundaries

[Upstream PR #5090](https://github.com/milind-soni/OpenMausBot/pull/5090) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277715)

Branch: `fix/tts-unspaced-chunk-limits`  
Published source: `216ba4ea3b95eed7fcf344f6987f9c88f47a6d59`  
Original local commit: `9a3107229612f32955a4156aabd76b7a1ee85c9d`

#### What changed

Use Node's built-in Intl.Segmenter word boundaries when there is no whitespace cut within the cap. Prevent short-fragment merging from exceeding maxChars. Keep indivisible English tokens whole as the existing tests require and preserve supplementary Unicode letters.

#### Why

Speech chunking only looks for spaces and a small set of spaced punctuation. Long Chinese and Japanese replies therefore remain one oversized utterance and bypass the short first-block cap, delaying the start of speech.

#### How it was verified

- Added 3 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 3 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **30 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/tts/speech-text.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `216ba4ea3b95eed7fcf344f6987f9c88f47a6d59` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **30 passed across 1 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277715).

#### Related history

[#3190](https://github.com/milind-soni/OpenMausBot/pull/3190), [#3191](https://github.com/milind-soni/OpenMausBot/pull/3191), [#3545](https://github.com/milind-soni/OpenMausBot/pull/3545). Earlier voice-latency changes introduce the first-block cap but leave unspaced language text unchunked. This patch supplies language-aware word boundaries using built-in ICU.

#### Compatibility

No dependency or TTS-provider change. Existing English token behavior remains covered.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/tts-unspaced-chunk-limits`.
- Independent local commit: `9a3107229612f32955a4156aabd76b7a1ee85c9d`.
- Published fork commit: `216ba4ea3b95eed7fcf344f6987f9c88f47a6d59`.
- Published tree `23b38690d288154fa13e29b77b991fb46e556147` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 9. fix: reject rolled-over dates in extraction responses

[Upstream PR #5091](https://github.com/milind-soni/OpenMausBot/pull/5091) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278129)

Branch: `fix/extractor-calendar-dates`  
Published source: `ffd027c9660d31fd35c7df95b01363e02ddd1cd0`  
Original local commit: `cdc3eecc189ead1a6fa6fe938bf987909ea21ba9`

#### What changed

Require the parsed UTC date to round-trip to the exact YYYY-MM-DD input. Cover month lengths, leap years and century exceptions; update the shared relay fixtures with rejected rollover dates and a valid leap-century date.

#### Why

JavaScript accepts dates such as 2026-02-30 by rolling them into the next month. The extraction contract tests only for a parseable date and then returns the original impossible deadline, allowing malformed model output into inbox and extraction values.

#### How it was verified

- Added 18 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 7 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **71 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/extractor/contract-dates.test.ts`, `server/extractor/extractor.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `ffd027c9660d31fd35c7df95b01363e02ddd1cd0` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **71 passed across 2 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278129).

#### Related history

[#3385](https://github.com/milind-soni/OpenMausBot/pull/3385). The original contract tests only grossly invalid dates such as month 13. Valid-looking dates normalized by Date.parse were not covered.

#### Compatibility

The shared relay fixture is updated in this PR. The separate Cloud Admin should consume that fixture when synchronizing its copy of the contract.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/extractor-calendar-dates`.
- Independent local commit: `cdc3eecc189ead1a6fa6fe938bf987909ea21ba9`.
- Published fork commit: `ffd027c9660d31fd35c7df95b01363e02ddd1cd0`.
- Published tree `08360137cfcdbf9b7eca131280472261d9fcf45d` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.


### 10. fix: correlate connector replies before caching tool lists

[Upstream PR #5092](https://github.com/milind-soni/OpenMausBot/pull/5092) · [Exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277997)

Branch: `fix/connector-response-correlation`  
Published source: `3f7e2ce345cf890bb472b0f93f44e532168b9aff`  
Original local commit: `04950cdd5b2d983650691e7e8d5c2c35723910f7`

#### What changed

Require a matching request ID and a response result/error, excluding server requests and notifications. Apply the same validation to JSON and SSE; keep correlated errors and replay valid cached lists under the new request ID.

#### Why

The connector response parser accepts any direct JSON object and falls back to the last SSE frame when no matching ID exists. An unrelated tools/list response can populate the fallback cache, so a later outage is masked with a tool catalog that did not answer the original request.

#### How it was verified

- Added 9 regression/compatibility test cases. On upstream base `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`, 8 targeted tests fail before the source fix.
- Targeted Vitest 4.1.11 run on Node 24.22.1: **19 passed**, using a temporary Node-only test configuration with one worker.
- Test files: `server/connector-tools-list.test.ts`, `server/connected-reads.test.ts`.
- `git diff --check` passes. Changed TypeScript files pass Oxlint 1.80.0 with the repository configuration.
- The published source head `3f7e2ce345cf890bb472b0f93f44e532168b9aff` also passes the full project `pnpm typecheck` and the repository's actual Vitest configuration: **19 passed across 2 files**, with `--environment node --maxWorkers=1 --no-file-parallelism`. [Exact-source CI check](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277997).

#### Related history

Exact-function and defect-term searches. No matching parseMcpResponse history result was found; regression tests reproduce cache contamination with mismatched JSON and SSE response IDs on current main.

#### Compatibility

Malformed or unrelated frames now return null rather than being used as replies. Valid connector responses remain covered by connected-read fixtures.

#### Base and head

- Base: `milind-soni/OpenMausBot:main` at `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head: `Afloat16:fix/connector-response-correlation`.
- Independent local commit: `04950cdd5b2d983650691e7e8d5c2c35723910f7`.
- Published fork commit: `3f7e2ce345cf890bb472b0f93f44e532168b9aff`.
- Published tree `9b688c99db4ce1d70ba1e24bd2883816c8c50fc1` is identical to the tested local commit's tree; all source and regression-test bytes were verified with Git object hashes before publishing.

