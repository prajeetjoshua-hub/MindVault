import assert from "node:assert/strict";
import test from "node:test";
import {
  createSavedChatsLock,
  verifySavedChatsPassword,
} from "../packages/security/savedChatsPasscode.ts";

test("saved chats PIN stores a salted verifier and rejects a wrong PIN", async () => {
  const lock = await createSavedChatsLock(
    "2468",
    "00112233445566778899aabbccddeeff",
  );
  assert.equal(lock.scheme, "pbkdf2-sha256");
  assert.equal(lock.verifier.length, 64);
  assert.equal(await verifySavedChatsPassword("2468", lock), true);
  assert.equal(await verifySavedChatsPassword("1357", lock), false);
});

test("saved chats PIN requires exactly four digits", async () => {
  await assert.rejects(
    createSavedChatsLock("12345", "00112233445566778899aabbccddeeff"),
    /exactly four digits/,
  );
  await assert.rejects(
    createSavedChatsLock("abcd", "00112233445566778899aabbccddeeff"),
    /exactly four digits/,
  );
});
