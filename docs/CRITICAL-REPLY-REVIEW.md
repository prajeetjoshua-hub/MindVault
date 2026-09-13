# Reply regression review — 13 September 2026

The submitted transcript exposed serious false negatives. The prototype is not ready to be represented as an emergency detection service or a validated emotional-support system.

## Changes

- Added colloquial dying-language coverage and restricted the thank-you response to standalone gratitude.
- Scoped negation to the matched action: “don't understand” must not negate a later safety concern.
- Added physical-assault evidence and retained the context for short pain follow-ups. These turns bypass model generation and receive injury/physical-safety wording.
- Added small-talk typo handling, monitor purchase without the word “new”, and contextual enthusiasm replies.
- Added an authored privacy answer that cannot be replaced with model speculation.

## Verification

120 automated tests passed, including the newly reported critical messages, a full replay of the reported browser transcripts, breakup context, self-harm method wording, explicit self-harm recovery, food and relationship coverage, privacy questions phrased as “seeing/viewing,” duplicate identity questions, sleep-related worry, feedback after a safety phrase, assault followed by pain, model output quality guards, persistent family conflict with sleep loss, and ordinary idioms that should not trigger safety. TypeScript checks passed. These tests cover explicit fixtures, not all possible language or clinical accuracy.

The browser initially served stale code and reproduced the old thank-you failure. After restarting the development server with its cache cleared, browser verification confirmed that the exact “better go die” message receives safety clarification and “my mom slapped me” receives physical-safety wording. Enter submitted both messages successfully.

## Model status and remaining work

The official llama.cpp desktop runtime is installed and its version was verified. The local bridge and advisory VADER integration exist. Gemma 1B was downloaded and evaluated, then rejected for handoff because it invented details and lost context. Qwen3 4B Instruct 2507 was downloaded, integrity-checked and evaluated as the current desktop candidate; it produced relevant multi-turn replies in the focused review, with CPU latency still requiring device-specific measurement.

Assault-state resolution, broader contextual coverage, model output quality, device encryption, Android performance and airplane-mode operation require additional testing. A passing fixture suite does not establish these properties.

## Product claims

Describe the project as an experimental companion designed around local processing and user-controlled memory. Do not claim it is the first private companion, understands everything, guarantees safety, or provides emergency monitoring. One million entries is not a quality metric. Evaluate unseen multi-turn conversations, missed safety signals, false alarms, repetition, context retention, latency and data flows.

Ambulance availability/booking and health tracking are future projects, requiring provider integrations and separate validation. Offline conversation does not imply offline dispatch or booking.
