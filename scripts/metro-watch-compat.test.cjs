const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const path = require("node:path");
const { test } = require("node:test");

require("../metro.config.js");
const FileMap = require("metro-file-map").default;
const observers = require(path.join(path.dirname(require.resolve("@expo/cli/package.json")), "build/src/start/server/metro/waitForMetroToObserveTypeScriptFile.js"));

function nativeWatcherBoundary() {
  // Real Metro emit + real Expo observers; only filesystem notifications are supplied by the test.
  const watcher = Object.setPrototypeOf(new EventEmitter(), FileMap.prototype);
  const server = new EventEmitter();
  const runner = { metro: { getBundler: () => ({ getBundler: () => ({ getWatcher: () => watcher }) }) }, server };
  return { watcher, server, runner };
}
function fileChange() {
  return { rootDir: process.cwd(), logger: null, changes: {
    addedFiles: new Map([["app/new.ts", { isSymlink: false, modifiedTime: 1 }]]),
    modifiedFiles: new Map([[".env", { isSymlink: false, modifiedTime: 2 }]]),
    removedFiles: new Map([["app/old.ts", { isSymlink: false, modifiedTime: 3 }]]),
  } };
}

test("Expo can iterate Metro's file changes without altering Metro's own payload", () => {
  const { watcher, server, runner } = nativeWatcherBoundary();
  let received;
  let metroPayload;
  observers.observeAnyFileChanges(runner, events => { received = [...events]; });
  watcher.once("change", payload => { metroPayload = payload; });
  const event = fileChange();
  assert.doesNotThrow(() => watcher.emit("change", event));
  assert.deepEqual(received.map(({ type, filePath }) => [type, filePath]), [
    ["add", path.join(process.cwd(), "app/new.ts")],
    ["change", path.join(process.cwd(), ".env")],
    ["delete", path.join(process.cwd(), "app/old.ts")],
  ]);
  assert.equal(metroPayload.changes, event.changes);
  assert.equal(metroPayload.rootDir, event.rootDir);
  assert.equal(event.eventsQueue, undefined);
  server.emit("close");
  assert.equal(watcher.listenerCount("change"), 0);
});

test("Expo still reloads observed files and stops observing on server close", () => {
  const { watcher, server, runner } = nativeWatcherBoundary();
  let calls = 0;
  observers.observeFileChanges(runner, [path.join(process.cwd(), ".env")], () => { calls++; });
  watcher.emit("change", fileChange());
  assert.equal(calls, 1);
  server.emit("close");
  watcher.emit("change", fileChange());
  assert.equal(calls, 1);
});

test("TypeScript discovery remains one-shot and legacy events pass through", () => {
  const { watcher, runner } = nativeWatcherBoundary();
  let discoveries = 0;
  observers.waitForMetroToObserveTypeScriptFile(process.cwd(), runner, () => { discoveries++; });
  watcher.emit("change", fileChange());
  watcher.emit("change", fileChange());
  assert.equal(discoveries, 1);
  const legacy = { eventsQueue: [{ type: "add", filePath: "/example.ts", metadata: { type: "f" } }] };
  let received;
  observers.observeAnyFileChanges(runner, events => { received = events; });
  watcher.emit("change", legacy);
  assert.equal(received, legacy.eventsQueue);
});

test("installation is idempotent and unrelated Metro events are unchanged", () => {
  const { installExpoMetroWatchCompatibility } = require("./metro-watch-compat.cjs");
  const emit = FileMap.prototype.emit;
  installExpoMetroWatchCompatibility();
  assert.equal(FileMap.prototype.emit, emit);
  const { watcher } = nativeWatcherBoundary();
  const status = { type: "watcher_ready" };
  let received;
  watcher.on("status", event => { received = event; });
  assert.equal(watcher.emit("status", status), true);
  assert.equal(received, status);
});
