import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";
import { emptyData, type AppData } from "../../../packages/contracts/types";
const KEY = "mindvault-vault-key-v1";
const DB = "mindvault-v1.db";
export class Vault {
  readonly persistent = true;
  private db?: SQLite.SQLiteDatabase;
  private queue: Promise<void> = Promise.resolve();
  private opening?: Promise<boolean>;
  async unlock() {
    if (this.opening) return this.opening;
    this.opening = this.authenticateAndOpen();
    try {
      return await this.opening;
    } finally {
      this.opening = undefined;
    }
  }
  private async authenticateAndOpen() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock your MindVault",
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });
    if (!result.success) return false;
    if (this.db) return true;
    let key = await SecureStore.getItemAsync(KEY);
    if (!key) {
      key = Array.from(Crypto.getRandomBytes(32), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      await SecureStore.setItemAsync(KEY, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    const db = await SQLite.openDatabaseAsync(DB);
    try {
      // Key is random hexadecimal, never user text. This configuration is not supported in Expo Go.
      await db.execAsync(`PRAGMA key = "x'${key}'";`);
      const cipher = await db.getFirstAsync<{ cipher_version: string }>(
        "PRAGMA cipher_version",
      );
      if (!cipher?.cipher_version)
        throw new Error(
          "Encrypted storage requires the native development build.",
        );
      await db.execAsync(
        "PRAGMA journal_mode = WAL; PRAGMA secure_delete = ON; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);",
      );
      this.db = db;
      return true;
    } catch (error) {
      await db.closeAsync();
      throw error;
    }
  }
  async load(): Promise<AppData> {
    if (!this.db) throw new Error("Vault is locked");
    const row = await this.db.getFirstAsync<{ data: string }>(
      "SELECT data FROM state WHERE id = 1",
    );
    if (!row) return emptyData();
    const data = JSON.parse(row.data) as AppData;
    if (
      data.version !== 1 ||
      !Array.isArray(data.conversations) ||
      !Array.isArray(data.memories)
    )
      throw new Error("Unsupported vault format");
    return data;
  }
  save(data: AppData) {
    const snapshot = JSON.stringify(data);
    const operation = this.queue.then(async () => {
      if (!this.db) throw new Error("Vault is locked");
      await this.db.runAsync(
        "INSERT OR REPLACE INTO state(id, data) VALUES (1, ?)",
        snapshot,
      );
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
  async lock() {
    await this.queue;
    if (this.db) {
      await this.db.closeAsync();
      this.db = undefined;
    }
  }
  async destroy() {
    await this.lock();
    // Destroy the key first: an interrupted file removal does not restore access to old ciphertext.
    await SecureStore.deleteItemAsync(KEY);
    await SQLite.deleteDatabaseAsync(DB);
  }
}
