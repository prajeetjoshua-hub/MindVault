import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { spawn } from "node:child_process";
import { createBridge } from "../tools/local-model/bridge.mjs";

const model = path.resolve(process.argv[2] || "models/gemma-3-1b-it-q4_0.gguf");
const isQwen = path.basename(model) === "qwen2.5-3b-instruct-q4_k_m.gguf";
const isQwen3 = path.basename(model) === "Qwen3-4B-Instruct-2507-Q4_K_M.gguf";
const expectedSize = isQwen3 ? 2497280448 : isQwen ? 2104932768 : 1003541152;
const expectedHash = isQwen3
  ? "8cdb57cbb880d313736a9bc4e3d3d2485f145b5e19cf33783746e753e82641fc"
  : isQwen
    ? "626b4a6678b86442240e33df819e00132d3ba7dddfe1cdc4fbb18e0a9615c62d"
    : "95e5b8d891cd6a794f66c2a6fb59a41e9562b4660560b854274eceffb628b22a";
const executable = path.resolve(
  process.env.MINDVAULT_LLAMA_SERVER || ".runtime/llama/llama-server.exe",
);
if (!fs.existsSync(model))
  throw new Error(
    "Gemma file missing. After accepting its licence, place gemma-3-1b-it-q4_0.gguf in models/ or pass its path.",
  );
if (!fs.existsSync(executable))
  throw new Error("Local runtime missing: .runtime/llama/llama-server.exe");
if (fs.statSync(model).size !== expectedSize)
  throw new Error("Unexpected model size");
const hash = crypto.createHash("sha256");
for await (const chunk of fs.createReadStream(model)) hash.update(chunk);
if (hash.digest("hex") !== expectedHash)
  throw new Error("Model integrity check failed");
const runtimeKey = crypto.randomBytes(32).toString("hex");
const token = crypto.randomBytes(32).toString("hex");
const threads = String(Math.max(4, Math.min(8, os.availableParallelism())));
const child = spawn(
  executable,
  [
    "-m",
    model,
    "--host",
    "127.0.0.1",
    "--port",
    "8790",
    "-c",
    "4096",
    "-t",
    threads,
    "-tb",
    threads,
    "-np",
    "1",
    "--log-disable",
  ],
  {
    windowsHide: true,
    stdio: "ignore",
    env: { ...process.env, LLAMA_API_KEY: runtimeKey },
  },
);
const bridge = createBridge({
  token,
  runtimeKey,
  modelName: isQwen3
    ? "qwen3-4b-instruct-2507-q4_k_m"
    : isQwen
      ? "qwen2.5-3b-instruct-q4_k_m"
      : "gemma-3-1b-it-q4_0",
});
const stop = () => {
  bridge.close();
  child.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("error", () => {
  console.error("Local runtime failed to start");
  bridge.close();
  process.exitCode = 1;
});
child.on("exit", (code) => {
  bridge.close();
  process.exitCode = code || 0;
});
bridge.on("error", () => {
  console.error("Local bridge port unavailable");
  child.kill();
  process.exitCode = 1;
});
bridge.listen(8791, "127.0.0.1", () => {
  console.log("Local model is loading: " + path.basename(model));
  console.log("Private session token (do not publish): " + token);
  console.log(
    "Wait for the health check before connecting. Stop this process to unload the model.",
  );
});
