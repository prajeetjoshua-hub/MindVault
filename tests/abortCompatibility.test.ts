import assert from "node:assert/strict";
import test from "node:test";
import { throwIfAborted } from "../packages/utils/throwIfAborted.ts";

test("cancellation works when React Native AbortSignal lacks throwIfAborted", () => {
  assert.doesNotThrow(() =>
    throwIfAborted({ aborted: false } as AbortSignal),
  );
  assert.throws(
    () => throwIfAborted({ aborted: true } as AbortSignal),
    (error: unknown) => error instanceof Error && error.name === "AbortError",
  );
});
