# Desktop local conversation model

The local browser prototype has a desktop model adapter and a loopback-only bridge. Runtime b10941 was downloaded from the official llama.cpp release and verified against release SHA-256 033ab72aa6fc69059e7529affa383b93201b612abbe72ea39bba103560a81cc8. Gemma 1B was evaluated and rejected for handoff because it invented details and lost context. Qwen3 4B Instruct 2507 is the current desktop candidate after a focused real-inference review. Bridge unit tests use a fake runtime; separate synthetic conversation evaluations exercise real inference.

## Setup

1. Obtain a permitted GGUF artifact yourself and place it in `models/`. The checked-in launcher recognises Gemma 3 1B, Qwen2.5 3B and Qwen3 4B artifacts. No tokens or model files belong in Git.
3. Obtain Windows CPU llama.cpp binaries from https://github.com/ggml-org/llama.cpp/releases and place the extracted runtime (including its DLLs) under .runtime/llama/. The installed b10941 runtime has run real inference. Alternatively set MINDVAULT_LLAMA_SERVER to the executable path.
4. Run `npm run model:desktop -- models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf` from the repository. The launcher checks the pinned model size and SHA-256 before starting it. It runs CPU inference with a bounded context and output budget.
5. In the local app, open Settings → Model & voice, paste the private token printed by the launcher into the session-token field, and connect. Connection succeeds only when the model health check succeeds.

Model runtime: 127.0.0.1:8790. Browser bridge: 127.0.0.1:8791. Only the local preview origins on port 8082 are accepted; requests require a per-process token. Requests and replies are not logged by the bridge. Tokens remain in browser memory and clear on release. Stop the launcher to unload the desktop model; browser release disconnects but does not terminate the computer process.

This is desktop-local inference, not browser-contained inference or phone inference. Android continues to use llama.rn. No cloud inference fallback exists. Failed or oversized generation requests use the authored fallback; input is never silently cut by the bridge. Upstream generation uses a token-budget check and cancellation/timeout.

## Emotion tooling assessment

Original VADER is a reusable MIT-licensed lexicon/rule sentiment analyser: https://github.com/cjhutto/vaderSentiment. The Apache-2.0 JavaScript port vader-sentiment 1.1.3 is now installed as advisory context for eligible model calls. It estimates sentiment, not clinical risk or a complete emotional state. See SENTIMENT-EVALUATION.md for integration and limitations.

NRC's emotion lexicons include emotion associations but carry research/commercial use and redistribution conditions: https://saifmohammad.com/WebPages/lexicons.html. They were not copied into this public project. Neither resource provides a complete empathetic conversation engine. Keep sentiment separate from safety routing and retain context, stated causes, mixed emotions and reply preferences.
