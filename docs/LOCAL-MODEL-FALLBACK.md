# Local conversation fallback status

The orchestrator now permits a loaded model on LOW and MEDIUM turns, and on CLARIFY caused solely by insufficient language understanding. Active safety evidence, safety uncertainty and pending safety state prevent ordinary generation. The decision is made from structured evidence, not matching a displayed fallback sentence.

Recent context includes the last six user/companion turns. Existing full-passage context reduction and output checks remain active. Instructions permit direct small talk, relevant follow-ups and mixed emotions without requiring a question every turn. No-questions preferences are supplied to the model. This does not validate model quality or establish that unknown input is safe.

96 regression tests passed after this change. Model dispatch tests use an injected test adapter, not real inference.

## Runtime not yet active

Android has a native Gemma adapter, but no model has been imported. The browser now has an explicit token-authenticated desktop connection; see DESKTOP-GEMMA-SETUP.md. The runtime executable and model file are still missing, so real inference has not run. The bridge access tests use an injected runtime. The latest suite has 97 passing tests and type checking passes.

The selected artifact remains Google's gemma-3-1b-it-q4_0.gguf. The user must accept its access conditions at https://huggingface.co/google/gemma-3-1b-it-qat-q4_0-gguf before obtaining the file. Artifact size and hash are in FUNCTIONAL-PROTOTYPE.md. Do not report the fallback as active until actual inference has been tested.

The previous architecture document's MEDIUM-only generation restriction is superseded by this permission policy. The public landing remains unchanged.
