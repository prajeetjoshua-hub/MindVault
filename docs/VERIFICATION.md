# Desktop verification — 12 September 2026

This report covers the local Quiet Forest milestone. It does not certify the Android application or clinical performance.

## Conversation correction

The reported five-message browser conversation exposed a missed safety expression and repeated generic replies. Policy 0.1.1 adds the tested “feel like dying” expressions and related forms. Replies now distinguish overwhelm, everyday purchases, negative updates and criticism of the companion. Consecutive generic fallback replies avoid identical text. Safety and clarification take priority over these conversation responses, and criticism following a safety concern is acknowledged without silently clearing the concern.

The expanded suite has 45 tests. The five reported messages were also replayed in the browser and produced distinct replies; the dying statement displayed a safety response and Help & support button. The composer identifies the browser as a structured reply preview. These are authored response improvements, not evidence of general language understanding or clinical validation.

## Initial milestone results

| Check | Result |
|---|---|
| Regression suite | 34 passed, 0 failed; rerun with `npm test` |
| TypeScript | Passed |
| Functional browser export | Passed, `prototype-dist/` |
| Public landing export | Passed separately, `dist/` |
| Build isolation | Separate Metro cache identities; rebuilt public page visually verified with its original locked cards and phone layout; public and functional bundles differ |
| Home and squirrel | Visually inspected in the desktop browser |
| Guided check-in | Two choices create an editable draft; selected goal shapes the next reply |
| History | Off by default; enabling it saves a synthetic conversation in browser session memory |
| Export | Preview shown; readable `MindVault-conversation.txt` downloaded and its contents checked |
| Live diagnostics | App paired to loopback receiver; actual MEDIUM message produced score 4 = persistence 2 + functioning 2, exam topic, skipped unavailable model and skipped storage |
| Diagnostic sequence | Response followed by storage event with consecutive sequence numbers |
| Regression report in dashboard | Actual recorded 34/34 result visible; labelled desktop-only and timestamped |
| Security tests | Unauthenticated access rejected, malformed token rejected, pairing rotated, oversized event rejected, unknown text fields dropped, duplicate events deduplicated |
| Native/model/airplane mode | Not tested; no Android toolchain/device test or model artifact available |

The regression suite includes four LOW, four MEDIUM and four SAFETY examples, ambiguity, third-person concern, negation, idiom, unsupported language, long-message coverage, repeated evidence, cancellation, output fallback, sticky safety, memory removal and relevant-memory retrieval. It also verifies that a failing diagnostic sink does not prevent local support. Generated-output tests use a mock adapter, not real Gemma inference.

Dependency audit returned 11 moderate entries in the Expo build-tool dependency chain, originating from the transitive `uuid` advisory GHSA-w5hq-g745-h8pq. No high or critical entries were reported. The suggested forced fix would downgrade the Expo stack; it was not applied. Review the upstream fix and build dependencies before a release.

Remaining device acceptance work is listed in [FUNCTIONAL-PROTOTYPE.md](FUNCTIONAL-PROTOTYPE.md), including native compilation, model import/reload lifecycle, storage/key verification, export interruption cleanup, trusted phone-to-dashboard transport and standalone airplane-mode tests. Offline speech remains unimplemented. Do not present this desktop milestone as completing the full offline prototype.

The implementation remains local on `prototype/quiet-forest`. The public website has not been replaced and no installable app has been published.

## 13 September 2026 follow-up
119 regression tests passed; typecheck and both web exports passed. Browser verified local-model connection, the full reported-message replay, food and relationship context handling, breakup and self-harm context handling, privacy wording for “seeing/viewing” questions, context-first clarification, explicit reassurance ending the pending loop, return to listening, help cards and SOS confirmation without placing a call. Qwen3 4B Instruct 2507 passed the focused desktop transcript review; Gemma 1B and Qwen2.5 3B did not. See PROGRESS-2026-09-13.md for scope and remaining device checks.
