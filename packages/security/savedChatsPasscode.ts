import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import type { SavedChatsLock } from "../contracts/types.ts";

const DEFAULT_ITERATIONS = 120_000;

function equalHex(left: string, right: string) {
  if (left.length !== right.length) return false;
  let different = 0;
  for (let index = 0; index < left.length; index++)
    different |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return different === 0;
}

async function derive(password: string, salt: string, iterations: number) {
  return bytesToHex(
    await pbkdf2Async(sha256, password.normalize("NFKC"), hexToBytes(salt), {
      c: iterations,
      dkLen: 32,
      asyncTick: 8,
    }),
  );
}

export async function createSavedChatsLock(
  password: string,
  salt: string,
): Promise<SavedChatsLock> {
  if (password.length < 6)
    throw new Error("Use at least 6 characters for your saved-chats password.");
  return {
    scheme: "pbkdf2-sha256",
    salt,
    verifier: await derive(password, salt, DEFAULT_ITERATIONS),
    iterations: DEFAULT_ITERATIONS,
  };
}

export async function verifySavedChatsPassword(
  password: string,
  lock: SavedChatsLock,
) {
  if (
    lock.scheme !== "pbkdf2-sha256" ||
    !/^[a-f0-9]{32}$/.test(lock.salt) ||
    !/^[a-f0-9]{64}$/.test(lock.verifier) ||
    lock.iterations < 100_000
  )
    return false;
  return equalHex(
    await derive(password, lock.salt, lock.iterations),
    lock.verifier,
  );
}
