import assert from "node:assert/strict";
import test from "node:test";
import {
  createSavedChatsLock,
  verifySavedChatsPassword,
} from "../packages/security/savedChatsPasscode.ts";

test("saved chats password stores a salted verifier and rejects a wrong password", async () => {
  const lock = await createSavedChatsLock(
    "forest-quiet",
    "00112233445566778899aabbccddeeff",
  );
  assert.equal(lock.scheme, "pbkdf2-sha256");
  assert.equal(lock.verifier.length, 64);
  assert.equal(await verifySavedChatsPassword("forest-quiet", lock), true);
  assert.equal(await verifySavedChatsPassword("forest-loud", lock), false);
});

test("saved chats password requires at least six characters", async () => {
  await assert.rejects(
    createSavedChatsLock("12345", "00112233445566778899aabbccddeeff"),
    /at least 6 characters/,
  );
});
