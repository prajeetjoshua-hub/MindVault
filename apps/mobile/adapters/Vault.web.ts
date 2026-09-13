import { emptyData, type AppData } from "../../../packages/contracts/types";
// Browser preview never persists sensitive content or claims native encryption.
export class Vault {
  readonly persistent = false;
  private data: AppData = emptyData();
  async unlock() {
    return true;
  }
  async load() {
    return structuredClone(this.data);
  }
  async save(data: AppData) {
    this.data = structuredClone(data);
  }
  async destroy() {
    this.data = emptyData();
  }
  async lock() {}
}
