import { createNativeOutboxStorage } from "@/app/adapters/secondary/gateways/outbox/nativeOutboxStorage";
import { createNativeReadModelCacheStorage } from "@/app/adapters/secondary/gateways/storage/nativeReadModelCacheStorage";
import { createNativeSyncMetaStorage } from "@/app/adapters/secondary/gateways/storage/syncMetaStorage.native";

const mockInstances = new Map<string, Map<string, string>>();
jest.mock("react-native-mmkv-storage", () => ({
  MMKVLoader: class {
    key = "";
    withInstanceID(key: string) { this.key = key; return this; }
    initialize() {
      if (!mockInstances.has(this.key)) mockInstances.set(this.key, new Map());
      const values = mockInstances.get(this.key)!;
      return { getString: (key: string) => values.get(key),
        setString: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key) };
    }
  },
}));

beforeEach(() => mockInstances.clear());
it("isolates persisted commands and caches from other accounts and legacy data", async () => {
  const outbox = createNativeOutboxStorage();
  const cache = createNativeReadModelCacheStorage();
  const commands = { byId: {}, queue: [], byCommandId: {}, suspended: true };
  const reads = { schemaVersion: 1, updatedAt: "2026-09-11T10:00:00Z", tickets: { byId: {} } } as any;
  await outbox.saveSnapshot(commands);
  await cache.saveSnapshot(reads);
  expect(await outbox.loadSnapshot("B")).toBeNull();
  expect(await cache.loadSnapshot("B")).toBeNull();
  await outbox.saveSnapshot(commands, "A");
  await cache.saveSnapshot(reads, "A");
  expect(await createNativeOutboxStorage().loadSnapshot("A")).toEqual(commands);
  expect(await createNativeReadModelCacheStorage().loadSnapshot("A")).toEqual(reads);
  expect(await outbox.loadSnapshot("B")).toBeNull();
  await outbox.clear("A");
  expect(await outbox.loadSnapshot()).toEqual(commands);
});

it("keeps unreadable commands intact instead of treating corruption as an empty queue", async () => {
  const outbox = createNativeOutboxStorage();
  await outbox.loadSnapshot("A");
  mockInstances.get("app.outbox.account.A")!.set("state", "{broken");
  await expect(outbox.loadSnapshot("A")).rejects.toThrow("Unreadable");
  expect(mockInstances.get("app.outbox.account.A")!.get("state")).toBe("{broken");
});

it("persists an independent SSE cursor per account across adapter recreation", async () => {
  const meta = createNativeSyncMetaStorage();
  await meta.setCursor("legacy");
  await meta.forAccount!("A").setCursor("cursor-A");
  await meta.forAccount!("B").setCursor("cursor-B");
  const restarted = createNativeSyncMetaStorage();
  expect((await restarted.forAccount!("A").loadOrDefault()).cursor).toBe("cursor-A");
  expect((await restarted.forAccount!("B").loadOrDefault()).cursor).toBe("cursor-B");
  expect((await restarted.loadOrDefault()).cursor).toBe("legacy");
});
