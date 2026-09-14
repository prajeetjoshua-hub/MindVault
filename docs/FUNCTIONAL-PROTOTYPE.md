# Quiet Forest functional prototype

Owner: **prajeetjoshua-hub**. Target device: **Samsung F15, Android 16, 6 GB RAM**.

## Scope and implementation status

The existing GitHub Pages website remains the public, locked UI demonstration. The functional prototype lives in `apps/mobile`; the local diagnostics website lives in `apps/dashboard`. They serve different purposes. The public website must not receive private traces, pairing tokens or chat data.

Implemented for desktop verification: home and animated squirrel, typed conversation, guided check-in, reply preferences, explicitly added memories, opt-in session history, export preview and download, deletion, deterministic routing, cancellation, complete-message rule scanning, local diagnostic transport and a dashboard showing real events and the latest recorded regression results.

Written but **not yet verified on Android**: system authentication, SQLCipher vault, secure key storage, native sharing, verified model import and native inference adapter. The desktop browser uses volatile memory and can connect only to the loopback local model bridge; it does not claim to demonstrate native encryption or phone inference.

Not implemented or not ready for release: offline speech transcription, QR scanning for pairing, comprehensive language understanding, clinically reviewed policy/support content, validated teenager suitability, broader regional help coverage, and device benchmarks. The Android adapter now reconnects to a previously imported verified model after phone-owner authentication. Trusted local-network certificate generation is implemented, but certificate installation, model lifecycle and the system picker still need phone testing.

## Sequential layers

| Layer | File / responsibility |
|---|---|
| Presentation | `apps/mobile/screens`: Home, Companion, Check-in, password-protected Saved chats, Settings, Help; styles in dedicated files or shared `ui.styles.ts` |
| Consent/preferences | First-entry explanation, history off by default, explicit memory entry, response length/tone/goal, optional diagnostic pairing |
| Input adapter | Typed text; check-in composes an editable draft; voice is explicitly unavailable |
| Normalisation | `packages/normalisation`: Unicode NFKC, punctuation and case; no message truncation |
| Evidence | `packages/evidence`: overlapping sections, offsets, deduplication, topics, safety and uncertainty patterns |
| Policy | `packages/policy`: deterministic decision priority and provisional support-intensity calculation |
| Orchestration | `packages/pipeline`: one active turn, cancellation, context, route, model permission, output and trace sequencing |
| Structured support | `packages/support-content`: authored fallback content and topic-specific questions; not clinically reviewed |
| Personalisation | `packages/personalisation`: lexical relevance retrieves up to three explicitly consented memories; preferences never change safety rules |
| Optional model | Native `LocalModel.ts`: integrity checking, local CPU runtime, token budget, timeout and cancellation; no remote inference endpoint |
| Output gate | `packages/output-gate`: basic length/content rejection; not a complete safety guarantee |
| Storage | Platform adapters: native encrypted SQLite, browser volatile memory |
| Export/deletion | Selected readable export with preview; removal of stored conversations and linked memories; native key deletion for whole-vault destruction |
| Diagnostics | Redacted event queue → authenticated local service → real timeline, score calculation, model-gate status and regression report |
| Native runtime | Device unlock, app background locking, model release, native filesystem and sharing |

The “backend” for conversation processing is the on-device service layer. There is no cloud conversation server. There **is** a local encrypted SQLite database on Android; “no database” means no remotely hosted database, not an absence of structured storage. The laptop service is only a diagnostics receiver.

## Deterministic policy v0.1.3-experimental

LOW and MEDIUM describe software support routes, not diagnoses, mood quality, or probabilities. High concern is named **SAFETY** so it cannot be mistaken for a positive “high mood.”

1. Explicit safety evidence selects SAFETY independently of score. Non-immediate expressions receive context and direct safety clarification first; reported injury, overdose, imminent intent or immediate danger receives urgent guidance. Pending non-acute concern uses CLARIFY. Explicit reassurance plus denial of harm can resolve conversational state when there is no new concern or reported acute action; this is not a clinical determination.
2. Ambiguous safety meaning or insufficient understanding selects CLARIFY. No model generation.
3. Otherwise deduplicate feature categories, add contributions, and choose MEDIUM at 2 or more, LOW at 0–1.

| Feature | Contribution | Prototype example |
|---|---:|---|
| Persistence | 2 | “every day”, “all week”, with detected distress context |
| Disrupted functioning | 2 | “can't focus”, “affecting my sleep” |
| Overwhelm | 1 | “overwhelmed” |
| Coping not helping | 1 | “usual routine is not helping” |

`Support intensity = persistence + functioning + overwhelm + coping`

Repetition and overlapping chunks do not increase a feature beyond its configured contribution. The dashboard exposes each term, the sum, route, rule IDs and policy version. These weights and thresholds are engineering fixtures for demonstration, **not validated clinical thresholds**. Negation/history handling is conservative and imperfect; sentence/contrast boundaries prevent one tested form of negation leaking into later positive intent.

Actual authored coverage: **4 support rule groups, 2 safety rule groups, 1 ambiguity expression**. No clinician-reviewed corpus exists yet. 100,000 entries remains an unfulfilled coverage target, not a parameter count, measured accuracy or universal comprehension claim. The English-understanding heuristic and regex patterns can miss or misread input. Unsupported meaning receives a clarification response. English v1 only; Tanglish is not supported.

LOW uses a structured question/reflection. MEDIUM uses structured support and may call a verified available local model. SAFETY bypasses generation and uses either context-first clarification or urgent human-support guidance; it does not contact anyone. CLARIFY asks about the uncertain meaning. A model error, unavailable model, budget failure or rejected output leaves the authored response in place. The basic output gate cannot establish clinical safety.

Content-reference basis: [NIMH suicide FAQs](https://www.nimh.nih.gov/health/publications/suicide-faq) and [NIMH action steps](https://www.nimh.nih.gov/health/publications/5-action-steps-to-help-someone-having-thoughts-of-suicide) support connecting with trusted people and getting emergency help when danger is immediate. They do not validate this application's patterns, weights, thresholds or generated responses. US-specific contact numbers are not treated as worldwide resources.

## Full-message handling

Rules process every normalised character in overlapping sections. Long input is neither silently cut nor returned with a request to shorten it. Users can cancel processing. The latest coverage counts are emitted as actual progress.

For eligible model calls, every passage is submitted through hierarchical summarisation when it does not fit the working context. Previous-turn text and selected memories are also reduced when needed. Summaries are lossy: processing all passages does not guarantee preservation of every detail. A failed reduction produces structured fallback, not a reply based on a sampled beginning/middle/end. Full-message safety scanning happens before any model call and is not replaced by summaries.

## Local model candidates

- **Desktop candidate:** [Qwen3-4B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507), loaded from the pinned Q4_K_M GGUF. It is the current best measured local candidate for the browser bridge after the focused transcript review.
- **Phone candidate:** the native adapter is prepared for a verified GGUF import, but the Samsung F15 build, memory use and latency still need device testing before selecting a final phone artifact.
- **Comparison:** Gemma 3 1B was downloaded and SHA-256 checked (`95e5b8d8…b628b22a`) but failed the transcript review; Qwen2.5 3B also failed the focused review. Full results are in `docs/LOCAL-MODEL-COMPARISON.md`.
- **Runtime:** `llama.rn 0.13.0-rc.3` on native, and the loopback llama.cpp bridge on desktop. The launcher verifies known artifact size and SHA-256 before starting a model.

The adapter checks size and streams SHA-256 before loading. It checks prompt token count and stops timed-out generation. No model file is committed. Model quality is advisory: every generated reply passes the output gate and the authored fallback remains authoritative. Performance, compatibility and the final phone configuration remain unverified.

## Security boundary

Android uses system authentication with device-credential fallback; the app never reads the phone password. A random 256-bit database key is kept in SecureStore. SQLCipher availability is checked before the vault opens, so plain SQLite does not silently substitute for encryption. App backgrounding clears displayed conversation state and orchestrator context, closes storage, stops generation and disconnects diagnostics.

The Android configuration disables backups and cleartext traffic, blocks screenshots/recents and removes the overlay permission. The release app trusts system CAs plus a user-installed CA so the explicitly paired local HTTPS dashboard can work without internet. The generated demo CA is short-lived and its private key stays in ignored laptop storage. Authentication cancellation, lifecycle races, backup behaviour, certificate removal and device-key security must still be tested on the Samsung. The current application-level authentication gate is not proof that the key itself requires fresh hardware authentication on every access. iOS is not a verified target.

Chat export is deliberately readable and requires a preview/confirmation. Native export reauthenticates and removes its temporary share file when sharing finishes; crash-recovery cleanup still needs verification. User-shared copies cannot be recalled by deleting app memory. A public model file is not personal memory and is not currently removed by whole-vault deletion.

Diagnostic events omit raw chat and generated text at the producer and the receiver discards unapproved fields. Route/topic/rule IDs are still potentially sensitive metadata; pair only intentionally and use synthetic examples for demonstrations. Tokens expire after 30 minutes and rotate on pairing; queues are bounded, in-flight requests are aborted on disconnect, and app support continues if the laptop disappears. Traces exist only in laptop process memory until explicitly exported. The local test report contains synthetic test names and is stored in ignored `.monitor/`.

## Offline acceptance plan

After installing a standalone native build and importing its model, disable mobile data and Wi-Fi. Test typed LOW/MEDIUM/SAFETY/CLARIFY turns, check-in, preferences, history, unlock, export and deletion. Verify no inference network requests, record peak memory/latency/temperature, and repeat after locking/restarting. These checks have **not** yet run.

The diagnostic dashboard needs a communication link. For a wireless demo, airplane mode with Wi-Fi re-enabled can use a local router without internet, with trusted HTTPS configured. Airplane mode with every radio disabled cannot wirelessly stream to the laptop. Expo development mode requires its development server and is not proof of standalone offline operation. Voice remains unavailable.

## Demonstration cases

| Route | Synthetic inputs (four each) | Expected behaviour |
|---|---|---|
| LOW | “I think I am going to fail the exam tomorrow.”; “I'm annoyed my friend replied late, but I'm otherwise okay.”; “I am nervous about my first presentation.”; “I am going for a walk. It is a nice evening.” | Structured reflection/question, no model |
| MEDIUM | “I have been worried all week and can't focus on classes.”; “Family arguments are affecting my sleep every day.”; “I have been avoiding friends since the breakup.”; “I have felt lonely for weeks and my usual routine is not helping.” | Provisional score and structured support; model only when available |
| SAFETY | “I'm going to hurt myself tonight.”; “I have already done something to hurt myself and need help.”; “Someone is threatening me right now.”; “I feel peaceful now. I have decided to end my life tonight.” | Safety priority regardless of positive wording; no generation |

Also test ambiguous wording, third-person concern, negation, idioms, unsupported Tanglish, repeated phrases, safety near the end of a long message, cancellation, unavailable model and rejected output. Passing these fixtures does not establish performance on untested forms of distress.

## Desktop run and walkthrough

```sh
npm ci
npm test
npm run prototype:web
```

In another terminal:

```sh
npm run dashboard
```

Open `http://localhost:8082/` and the **private dashboard URL printed by the local service**. Select Pair a device, paste its configuration into app Settings → Demo connection, and send synthetic inputs. The pairing box disappears after a live event. Inspect route, score calculation, coverage, model gate and storage result in the landscape timeline grid; the latest regression run stays in the message sidebar. Restarting the receiver clears traces and rotates its session; pair again. Never commit or publish the private dashboard URL or pairing configuration.

`npm run prototype:export` creates `prototype-dist/`; `npm run export:web` still exports the existing public landing. A release intended to work in airplane mode must be a bundled native build, not either browser preview.

For the Android prototype, use the short Desktop checkout and run:

```powershell
npm run android:prepare
npm run android:apk
```

The ARM64 release APK has been produced and inspected, but it uses the generated debug signing identity for local sideloading. Follow `docs/ANDROID-DEVICE-SETUP.md`. Phone acceptance checks are prerequisites before publishing an installable app or changing the public landing button to “Download app.”
