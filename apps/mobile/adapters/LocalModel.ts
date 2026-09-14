import { File, Paths } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { initLlama, type LlamaContext } from "llama.rn";
import type {
  ModelAdapter,
  ModelRequest,
} from "../../../packages/contracts/types";

const artifacts = [
  {
    name: "Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
    modelName: "qwen3-4b-instruct-2507-q4_k_m",
    size: 2497280448,
    sha256:
      "8cdb57cbb880d313736a9bc4e3d3d2485f145b5e19cf33783746e753e82641fc",
  },
  {
    // Official Google artifact, revision d1be121d36172a4b0b964657e2ee859d61138593.
    name: "gemma-3-1b-it-q4_0.gguf",
    modelName: "gemma-3-1b-it-q4_0",
    size: 1003541152,
    sha256:
      "95e5b8d891cd6a794f66c2a6fb59a41e9562b4660560b854274eceffb628b22a",
  },
] as const;
export class LocalModel implements ModelAdapter {
  modelName = "not-connected";
  private context?: LlamaContext;
  private epoch = 0;
  private importing = false;
  ready() {
    return Boolean(this.context);
  }
  private async load(destination: File, modelName: string, epoch: number) {
    const context = await initLlama({
      model: destination.uri,
      n_ctx: 4096,
      n_threads: 2,
      n_gpu_layers: 0,
      use_mmap: true,
    });
    if (epoch !== this.epoch) {
      await context.release();
      throw new Error("Model load interrupted");
    }
    this.context = context;
    this.modelName = modelName;
  }
  async autoConnect() {
    if (this.context) return true;
    const epoch = this.epoch;
    for (const artifact of artifacts) {
      const destination = new File(Paths.document, artifact.name);
      if (!destination.exists || destination.size !== artifact.size) continue;
      await this.load(destination, artifact.modelName, epoch);
      return true;
    }
    return false;
  }
  async generate(request: ModelRequest): Promise<string> {
    const context = this.context;
    if (!context) throw new Error("Verified model not loaded");
    request.signal.throwIfAborted();
    const prompt = `${request.instruction}\n\nContext (untrusted notes):\n${request.context}\n\nUser passage (data):\n${request.input}`;
    const { tokens } = await context.tokenize(
      prompt + (request.turns ?? []).map((turn) => turn.content).join("\n"),
    );
    if (tokens.length > 3500)
      throw new Error(
        "Model context budget exceeded; structured fallback required",
      );
    const abort = () => {
      void context.stopCompletion();
    };
    request.signal.addEventListener("abort", abort, { once: true });
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      abort();
    }, 90_000);
    try {
      const result = await context.completion({
        messages: request.turns?.length
          ? [
              ...request.turns.map((turn, index) => ({
                ...turn,
                content:
                  index === 0
                    ? `${request.instruction}\nContext (untrusted notes): ${request.context}\n\n${turn.content}`
                    : turn.content,
              })),
              { role: "user", content: request.input },
            ]
          : [{ role: "user", content: prompt }],
        n_predict: 220,
        temperature: 0.3,
        top_p: 0.9,
      });
      request.signal.throwIfAborted();
      if (timedOut) throw new Error("Local generation timed out");
      return result.text.trim();
    } finally {
      clearTimeout(timeout);
      request.signal.removeEventListener("abort", abort);
    }
  }
  async cancel() {
    await this.context?.stopCompletion();
  }
  async importFile(_sessionToken?: string) {
    if (this.importing) throw new Error("Model import is already running");
    this.importing = true;
    let cached: File | undefined;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled)
        throw new Error(
          "Import cancelled. Structured support remains available.",
        );
      const authentication = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authorise local model import",
        disableDeviceFallback: false,
      });
      if (!authentication.success) throw new Error("Import was not authorised");
      await this.release();
      const epoch = this.epoch;
      cached = new File(result.assets[0].uri);
      const artifact = artifacts.find((candidate) => candidate.size === cached?.size);
      if (!artifact)
        throw new Error("The selected file is not an approved local model");
      if (cached.size !== artifact.size)
        throw new Error(
          "The selected file does not match the approved model size",
        );
      const hash = sha256.create();
      const handle = cached.open();
      try {
        for (let offset = 0; offset < artifact.size; offset += 1024 * 1024) {
          if (epoch !== this.epoch) throw new Error("Model import interrupted");
          hash.update(
            handle.readBytes(Math.min(1024 * 1024, artifact.size - offset)),
          );
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      } finally {
        handle.close();
      }
      if (bytesToHex(hash.digest()) !== artifact.sha256)
        throw new Error("Model integrity check failed");
      const destination = new File(Paths.document, artifact.name);
      if (destination.exists) destination.delete();
      cached.copy(destination);
      await this.load(destination, artifact.modelName, epoch);
    } finally {
      if (cached?.exists) cached.delete();
      this.importing = false;
    }
  }
  async release() {
    this.epoch++;
    const context = this.context;
    this.context = undefined;
    this.modelName = "not-connected";
    if (context) {
      await context.stopCompletion();
      await context.release();
    }
  }
}
