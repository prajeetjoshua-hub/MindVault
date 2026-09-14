import { emptyData, type AppData } from "../../../packages/contracts/types";
const KEY = "mindvault-browser-vault";

// Browser preview uses tab-scoped storage. Closing the browser tab clears it;
// this does not claim the native build's encrypted-at-rest protection.
export class Vault {
  readonly persistent = false;
  async unlock() {
    return true;
  }
  async load() {
    try {
      const value = sessionStorage.getItem(KEY);
      return value ? (JSON.parse(value) as AppData) : emptyData();
    } catch {
      return emptyData();
    }
  }
  async save(data: AppData) {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  }
  async destroy() {
    sessionStorage.removeItem(KEY);
  }
  async lock() {}
}
