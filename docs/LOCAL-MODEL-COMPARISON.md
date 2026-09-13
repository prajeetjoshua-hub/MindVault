# Local conversation model evaluation

## Purpose

Compare actual multi-turn conversation quality before inviting further user testing. Passing deterministic regression tests is necessary but does not establish helpful conversation or clinical suitability.

## Artifacts

- Gemma 3 1B Q4_0: official Google artifact, SHA-256 verified by the launcher. Tested locally; rejected for handoff because it invented facts, lost context, and produced repetitive output under one instruction variant.
- Qwen 2.5 3B Instruct Q4_K_M: comparison candidate from https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF at revision 7dabda4d13d513e3e842b20f0d435c732f172cbe. Size 2104932768 bytes; SHA-256 626b4a6678b86442240e33df819e00132d3ba7dddfe1cdc4fbb18e0a9615c62d. Model card labels the licence qwen-research. This evaluation does not approve commercial distribution or replace the native artifact selection.

## Reproduction

Run `node scripts/start-local-model.mjs models/qwen2.5-3b-instruct-q4_k_m.gguf` locally. For the synthetic evaluation script, redirect launcher output to `.runtime/session.log`, then run `node --import tsx scripts/evaluate-desktop-model.ts`. The evaluation reads the private session credential without printing it. Results contain invented scenarios only and remain in ignored `.runtime/conversation-evaluation.json`.

## Handoff criteria

Review complete transcripts for relevant responses, remembering supplied facts, distinguishing fears from events, respecting requests to listen, no fabricated human experiences, no repetitive clarification loop, appropriate urgent-help routing, and acknowledgement when someone reaches physical safety. Add unseen scenarios beyond reported regressions. Check latency and rejection/fallback rates. Do not invite user testing solely because a model loads or automated tests pass.

Neither model is a licensed professional or a validated clinical support service. Offline operation and phone performance need separate device checks.
