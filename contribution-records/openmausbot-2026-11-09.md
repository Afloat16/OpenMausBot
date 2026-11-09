# OpenMausBot contribution record — 2026-11-09

**Ten formal upstream PRs; 10 open and 0 merged at 2026-11-09 15:51:38 UTC.** All ten current source heads pass full project typecheck and targeted tests. Five review follow-ups are implemented and verified in the same PRs.

## Verification

- Latest exact-source checks: **282 passed test executions across 17 test files** over the ten independent branches, with full `pnpm typecheck` on every current head. Separate branch runs are recorded individually below.
- Initial local verification: 240 passed across 15 files, including 60 new cases and 35 regressions reproduced on the original upstream base. The initial published trees were verified against the tested local trees through Git object hashes.
- Five review revisions add targeted regressions and pass changed-file lint. TOTP and speech also pass an isolated owned application fixture and its control doctor. The Codex driver check selects six relevant cases; its other 280 cases were not run.
- The entire repository test suite and external-provider application workflows are outside these checks.

## Independent changes

| # | Change | Upstream PR | Current source | Targeted tests | Full typecheck |
|---|---|---|---|---:|---|
| 1 | fix: release retry backoff timers and abort listeners | [#5083](https://github.com/milind-soni/OpenMausBot/pull/5083) | [`ba3c2b7c65b1`](https://github.com/Afloat16/OpenMausBot/commit/ba3c2b7c65b1f6d1a10d4a56aa173a4a94e685f7) | 23 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277861) |
| 2 | fix: preserve automation failure history during active runs | [#5084](https://github.com/milind-soni/OpenMausBot/pull/5084) | [`1872e9fa09e8`](https://github.com/Afloat16/OpenMausBot/commit/1872e9fa09e81ec84946b7507df585a27a89a9fa) | 6 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277453) |
| 3 | fix: preserve unsafe connector numeric arguments | [#5085](https://github.com/milind-soni/OpenMausBot/pull/5085) | [`a05ee1605344`](https://github.com/Afloat16/OpenMausBot/commit/a05ee1605344ddd79ef35fd52637864040d2ec86) | 9 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278148) |
| 4 | fix: preserve MCP SSE framing across split CRLF bytes | [#5086](https://github.com/milind-soni/OpenMausBot/pull/5086) | [`930ff7d757a0`](https://github.com/Afloat16/OpenMausBot/commit/930ff7d757a0337765c702ce5282d26b0d9aac6b) | 13 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278004) |
| 5 | fix: reject incomplete Base32 groups in TOTP keys | [#5087](https://github.com/milind-soni/OpenMausBot/pull/5087) | [`a468ff2b308d`](https://github.com/Afloat16/OpenMausBot/commit/a468ff2b308da30af96143b09880fed69a003de9) | 44 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260136016) |
| 6 | fix: detect MCP name collisions from parsed Codex config | [#5088](https://github.com/milind-soni/OpenMausBot/pull/5088) | [`6fe4366c0b17`](https://github.com/Afloat16/OpenMausBot/commit/6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8) | 23 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42646859631/job/129262322689) |
| 7 | fix: retain budget exhaustion events in the thread inspector | [#5089](https://github.com/milind-soni/OpenMausBot/pull/5089) | [`a331e14a1880`](https://github.com/Afloat16/OpenMausBot/commit/a331e14a18803a876ca60149286bff88e58c197a) | 30 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104388) |
| 8 | fix: split unspaced speech at Unicode word boundaries | [#5090](https://github.com/milind-soni/OpenMausBot/pull/5090) | [`b820dff83ae5`](https://github.com/Afloat16/OpenMausBot/commit/b820dff83ae58238d90f68c54319400187661a75) | 34 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260135662) |
| 9 | fix: reject rolled-over dates in extraction responses | [#5091](https://github.com/milind-soni/OpenMausBot/pull/5091) | [`ffd027c9660d`](https://github.com/Afloat16/OpenMausBot/commit/ffd027c9660d31fd35c7df95b01363e02ddd1cd0) | 71 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278129) |
| 10 | fix: correlate connector replies before caching tool lists | [#5092](https://github.com/milind-soni/OpenMausBot/pull/5092) | [`13faee0bf135`](https://github.com/Afloat16/OpenMausBot/commit/13faee0bf135b35db9ce81850ec8a469d03462f1) | 29 passed | [passed](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104705) |

## Verified review follow-ups

The complete replacement PR bodies and concise review replies are in [openmausbot-review-followups-2026-11-09.md](openmausbot-review-followups-2026-11-09.md) and its matching JSON file. Existing bot release notes are preserved in each replacement body.

## Change details

### 1. fix: release retry backoff timers and abort listeners

[Upstream PR #5083](https://github.com/milind-soni/OpenMausBot/pull/5083) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277861)

Branch: `fix/retry-delay-cleanup`  
Current source: `ba3c2b7c65b1f6d1a10d4a56aa173a4a94e685f7`  
Initial local commit: `16ffc2454e664729a4a6fa54fdc22762bb91ccbe`

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

[Upstream PR #5084](https://github.com/milind-soni/OpenMausBot/pull/5084) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277453)

Branch: `fix/automation-history-active-runs`  
Current source: `1872e9fa09e81ec84946b7507df585a27a89a9fa`  
Initial local commit: `c404505ca70add7e43d65d941674b14dbea1a2d9`

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

[Upstream PR #5085](https://github.com/milind-soni/OpenMausBot/pull/5085) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278148)

Branch: `fix/connector-numeric-coercion`  
Current source: `a05ee1605344ddd79ef35fd52637864040d2ec86`  
Initial local commit: `29a640e3e5ac33b7cb4b563d9756be8ba8de7834`

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

[Upstream PR #5086](https://github.com/milind-soni/OpenMausBot/pull/5086) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278004)

Branch: `fix/mcp-sse-crlf-framing`  
Current source: `930ff7d757a0337765c702ce5282d26b0d9aac6b`  
Initial local commit: `5c800758f626af8fe884d7f154135d6f82c8e8d2`

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

[Upstream PR #5087](https://github.com/milind-soni/OpenMausBot/pull/5087) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260136016)

Branch: `fix/totp-base32-validation`  
Current source: `a468ff2b308da30af96143b09880fed69a003de9`  
Initial local commit: `0bfd586ccf12126e6e471412e903b2e3345c02ea`

#### What changed

Reject encoded input that ends with five or more leftover bits, which represent an incomplete additional symbol group. Cover both raw and otpauth setup keys while retaining padded/unpadded valid Base32 forms and the existing TOTP vectors.

Keep strict Base32 decoding for new setup input, while code generation uses a private compatibility decoder for previously saved keys with an incomplete final group. Invalid alphabet characters remain rejected; no stored data is migrated.

#### Why

A Base32 secret with an impossible encoded length is accepted after dropping a final incomplete group. For example, appending one character to a valid 16-character setup key silently produces the same decoded bytes, hiding malformed new setup input.

Strict setup validation exposed a compatibility issue for keys already accepted and persisted by older versions. Those saved keys must keep generating the same bytes, while new malformed setup input remains rejected.

#### How it was verified

##### Final head

- Current source: `a468ff2b308da30af96143b09880fed69a003de9`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **44 passed across 1 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260136016).

The final suite covers saved 17-, 19-, and 22-character keys at two counters, invalid-character rejection, and strict new-input parsing. An isolated owned application fixture encrypted, saved and reloaded a legacy key; POST /api/logins rejected a new 17-character key with HTTP 400 and accepted a valid 16-character key with HTTP 201. The fixture's control doctor passed.

Focused `node:test` probes on the previous source `65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4` reproduced 1 failing regression and 1 passing compatibility check: [before-fix evidence](https://github.com/Afloat16/claude-mem/actions/runs/42644958000/job/129255617891).

##### Initial publication

The initial source `65f33fccb3ef0ec8ac6cc89c2708edd334f6d1c4` passed 40 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278033). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

#### Compatibility

Only code generation for already persisted keys retains the historical byte-decoding behavior. Public decodeBase32 and parseTotpKey remain strict for new input, with no credential migration.

#### Related history

[#246](https://github.com/milind-soni/OpenMausBot/pull/246), [#2725](https://github.com/milind-soni/OpenMausBot/pull/2725), [#2726](https://github.com/milind-soni/OpenMausBot/pull/2726), [#2730](https://github.com/milind-soni/OpenMausBot/pull/2730). Existing TOTP setup and credential work accepts the malformed lengths. This change adds the missing decoder validation.

#### Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/totp-base32-validation`.
- Current head: `a468ff2b308da30af96143b09880fed69a003de9`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

#### Summary by CodeRabbit

* **Bug Fixes**
  * Base32 secrets with incomplete trailing groups are now rejected during 2FA setup-key parsing, including secrets provided in `otpauth://` inputs.
  * Complete base32 encodings remain accepted with or without padding.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

### 6. fix: detect MCP name collisions from parsed Codex config

[Upstream PR #5088](https://github.com/milind-soni/OpenMausBot/pull/5088) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42646859631/job/129262322689)

Branch: `fix/codex-inline-mcp-collisions`  
Current source: `6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8`  
Initial local commit: `4e6298c0f5991575a01a254473ac35ffba6e2a0f`

#### What changed

Use parsed MCP table keys as the authoritative names when TOML parsing succeeds. Keep the existing header scan as a fallback for an unreadable config. Ignore header-looking text inside multiline strings.

Reserve each allocated custom mount name against both configured names and the mounts already selected for this turn, so two custom servers cannot overwrite one another. Disable special literal config keys through a whole-table CLI override placed before per-mount overrides; ordinary names keep their existing flat overrides. Tool-scope validation and effective-config checks remain unchanged.

#### Why

The Codex name-reservation path only scans table headers, although the same function already parses TOML tables. Inline tables, dotted keys and Unicode-escaped names are missed, allowing custom overrides to collide with the person's existing MCP config and fail a turn.

An inline configuration reserving notes could make custom notes and notes_openmausbot share one mount. A literal ambient name such as notes.prod was also split into nested CLI keys by Codex, which can reject the configuration before the prompt.

#### How it was verified

##### Final head

- Current source: `6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **23 passed across 3 test files**. The driver run selected 6 relevant cases; its other 280 cases were skipped.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42646859631/job/129262322689).

Two new helper cases cover literal dotted/quoted names and unchanged ordinary overrides. Two new driver cases exercise inline-name collisions and a valid selected catalog beside a dotted ambient server, including preservation of built-in mounts. Four existing driver compatibility cases also pass.

##### Initial publication

The initial source `958f66787e23abf8d37640d96654ed274ef6bba1` passed 15 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277922). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

#### Compatibility

Driver integration checks use the repository's fake app-server. The actual Codex CLI was not launched in this validation; its version 0.160.1 override and table-merge implementation was inspected directly.

#### Related history

[#1601](https://github.com/milind-soni/OpenMausBot/pull/1601), [#2946](https://github.com/milind-soni/OpenMausBot/pull/2946), [#4346](https://github.com/milind-soni/OpenMausBot/pull/4346). PR #1601 explicitly left inline MCP tables unsupported. This patch closes that documented gap with the parser already present on main.

Implementation references:

- https://github.com/openai/codex/blob/rust-v0.160.1/codex-rs/config/src/overrides.rs
- https://github.com/openai/codex/blob/rust-v0.160.1/codex-rs/config/src/merge.rs

#### Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/codex-inline-mcp-collisions`.
- Current head: `6fe4366c0b17651bed6c87e42f0c6e99cd5b2ba8`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

#### Summary by CodeRabbit

* **Bug Fixes**
  * Improved recognition of Codex MCP server names in configuration files, including inline and dotted table formats.
  * Server names can still be discovered when unrelated configuration syntax is invalid.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

### 7. fix: retain budget exhaustion events in the thread inspector

[Upstream PR #5089](https://github.com/milind-soni/OpenMausBot/pull/5089) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104388)

Branch: `fix/inspector-cap-events`  
Current source: `a331e14a18803a876ca60149286bff88e58c197a`  
Initial local commit: `cc875e552498bb528ca15908e70fda041e9b8edc`

#### What changed

Validate and retain cap.exhausted records with the required string handoffPath and reason=cap. Continue discarding malformed records at the log boundary.

Reject empty or whitespace-only cap handoff paths, resolve historical relative paths while replaying them, and make new handoff paths absolute even when OMB_DATA_DIR is relative. Valid persisted cap events remain in the inspector.

#### Why

The runtime defines cap.exhausted as a resumable terminal event with a persisted handoff, but the inspector's event guard rejects that event type. Reloading the log therefore omits the event explaining why a turn stopped and where its handoff was stored.

The event contract promises an absolute handoff path, while older writers could persist a relative path. Rejecting every relative record would discard real historical handoffs.

#### How it was verified

##### Final head

- Current source: `a331e14a18803a876ca60149286bff88e58c197a`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **30 passed across 2 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104388).

The malformed-record case now includes empty and whitespace paths. New regressions retain and normalize a legacy relative record, and verify that a handoff written with a relative data directory returns an absolute path in the same directory.

##### Initial publication

The initial source `5c300847c6260e8d42aee4238f9a89dbe12195c3` passed 14 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277953). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

#### Compatibility

Relative legacy paths retain ordinary resolution against the running server's working directory. These checks ran on Linux; no cross-platform live application run is claimed.

#### Related history

[#3374](https://github.com/milind-soni/OpenMausBot/pull/3374). Related runtime status work does not add the missing inspector guard case.

#### Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/inspector-cap-events`.
- Current head: `a331e14a18803a876ca60149286bff88e58c197a`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

#### Summary by CodeRabbit

* **Bug Fixes**
  * Improved validation of runtime handoff events so only events with a valid handoff path and the supported reason are accepted.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

### 8. fix: split unspaced speech at Unicode word boundaries

[Upstream PR #5090](https://github.com/milind-soni/OpenMausBot/pull/5090) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260135662)

Branch: `fix/tts-unspaced-chunk-limits`  
Current source: `b820dff83ae58238d90f68c54319400187661a75`  
Initial local commit: `9a3107229612f32955a4156aabd76b7a1ee85c9d`

#### What changed

Use Node's built-in Intl.Segmenter word boundaries when there is no whitespace cut within the cap. Prevent short-fragment merging from exceeding maxChars. Keep indivisible English tokens whole as the existing tests require and preserve supplementary Unicode letters.

Keep attached punctuation with an indivisible word, and fall back to complete grapheme boundaries only for oversized Katakana segments. Preserve combining marks and the first/subsequent chunk limits without splitting Latin tokens.

#### Why

Speech chunking only looks for spaces and a small set of spaced punctuation. Long Chinese and Japanese replies therefore remain one oversized utterance and bypass the short first-block cap, delaying the start of speech.

A 320-character English word followed by a period was split into a word and a punctuation-only chunk. A long Katakana segment could still bypass the intended chunk bound because word segmentation treated it as one token.

#### How it was verified

##### Final head

- Current source: `b820dff83ae58238d90f68c54319400187661a75`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **34 passed across 1 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42646240191/job/129260135662).

Both reported cases failed on the exact previous head. The final 34-case suite passes, and an isolated owned server fixture exercised POST /api/tts/prepare for the English punctuation case and 642 code units of decomposed Katakana. Its control doctor passed.

Focused `node:test` probes on the previous source `216ba4ea3b95eed7fcf344f6987f9c88f47a6d59` reproduced 2 failing regressions: [before-fix evidence](https://github.com/Afloat16/claude-mem/actions/runs/42644958000/job/129255618294).

##### Initial publication

The initial source `216ba4ea3b95eed7fcf344f6987f9c88f47a6d59` passed 30 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277715). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

#### Compatibility

Latin tokens, including their combining marks and attached terminal punctuation, remain indivisible. Only oversized Katakana segments use the grapheme fallback. The TTS provider and dependencies are unchanged.

#### Related history

[#3190](https://github.com/milind-soni/OpenMausBot/pull/3190), [#3191](https://github.com/milind-soni/OpenMausBot/pull/3191), [#3545](https://github.com/milind-soni/OpenMausBot/pull/3545). Earlier voice-latency changes introduce the first-block cap but leave unspaced language text unchunked. This patch supplies language-aware word boundaries using built-in ICU.

#### Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/tts-unspaced-chunk-limits`.
- Current head: `b820dff83ae58238d90f68c54319400187661a75`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

#### Summary by CodeRabbit

* **Bug Fixes**
  * Improved speech text splitting so short adjacent phrases stay within configured length limits.
  * Preserved complete text and supplementary Unicode letters when splitting unspaced or unusually bounded text.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

### 9. fix: reject rolled-over dates in extraction responses

[Upstream PR #5091](https://github.com/milind-soni/OpenMausBot/pull/5091) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220278129)

Branch: `fix/extractor-calendar-dates`  
Current source: `ffd027c9660d31fd35c7df95b01363e02ddd1cd0`  
Initial local commit: `cdc3eecc189ead1a6fa6fe938bf987909ea21ba9`

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

[Upstream PR #5092](https://github.com/milind-soni/OpenMausBot/pull/5092) · [Current exact-source CI](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104705)

Branch: `fix/connector-response-correlation`  
Current source: `13faee0bf135b35db9ce81850ec8a469d03462f1`  
Initial local commit: `04950cdd5b2d983650691e7e8d5c2c35723910f7`

#### What changed

Require a matching request ID and a response result/error, excluding server requests and notifications. Apply the same validation to JSON and SSE; keep correlated errors and replay valid cached lists under the new request ID.

Preserve a null-ID JSON-RPC error as an error-only diagnostic when no correlated response exists. The diagnostic has no request ID or result; a correlated frame takes priority regardless of SSE order. Cache admission also rejects every error-bearing frame.

#### Why

The connector response parser accepts any direct JSON object and falls back to the last SSE frame when no matching ID exists. An unrelated tools/list response can populate the fallback cache, so a later outage is masked with a tool catalog that did not answer the original request.

JSON-RPC uses a null ID when the server cannot identify a request. Dropping that error hid its useful message, but treating it as a matching response could contaminate the tools cache.

#### How it was verified

##### Final head

- Current source: `13faee0bf135b35db9ce81850ec8a469d03462f1`.
- Full project `pnpm typecheck`: passed.
- Repository-configured targeted Vitest checks: **29 passed across 2 test files**.
- Changed TypeScript files: Oxlint passed with no warnings or errors.
- [Exact-source verification](https://github.com/Afloat16/claude-mem/actions/runs/42645375907/job/129257104705).

Ten additional cases cover JSON/SSE null-ID diagnostics, matching-response priority, invalid frames, mixed error/result frames, and cache isolation after a diagnostic.

##### Initial publication

The initial source `3f7e2ce345cf890bb472b0f93f44e532168b9aff` passed 19 targeted tests and full project typecheck: [initial verification](https://github.com/Afloat16/claude-mem/actions/runs/42634877637/job/129220277997). Its source tree matched the original local commit, which was also tested before publication. The final-head result above applies to the follow-up changes.

#### Compatibility

The diagnostic remains separate from a successful response. Request-ID matching stays strict and the transport framing behavior is unchanged.

#### Related history

No matching parseMcpResponse history result was found; regression tests reproduce cache contamination with mismatched JSON and SSE response IDs on current main.

Implementation references:

- https://www.jsonrpc.org/specification#response_object

#### Base and head

- Independent base: `6c7bcb02ea766429091f94b8e1e11b7b3b8675af`.
- Head branch: `Afloat16:fix/connector-response-correlation`.
- Current head: `13faee0bf135b35db9ce81850ec8a469d03462f1`.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

<!-- coderabbit-ai-generated:v1 -->

#### Summary by CodeRabbit

* **Bug Fixes**
  * Improved reliability when receiving tool-list responses over standard and streamed connections. Responses are now matched to the correct request, while unrelated messages are ignored.
  * Correctly preserves errors tied to a request and prevents unrelated results from being used as fallback data.
  * Cached tool lists continue to work when replayed for a new request.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
