const path = require("node:path");

// Expo SDK 54 observers still consume eventsQueue. Metro 0.83.8 (pinned for
// security fixes) emits changes instead. Add the legacy view without replacing
// the modern payload used by Metro's dependency graph and Fast Refresh.
// Remove this bridge when upgrading Expo to a CLI that consumes changes.
function installExpoMetroWatchCompatibility() {
  const cliVersion = require("@expo/cli/package.json").version;
  const metroVersion = require("metro-file-map/package.json").version;
  if (!cliVersion.startsWith("54.") || metroVersion !== "0.83.8") return;

  const FileMap = require("@expo/metro/metro-file-map").default;
  const installed = Symbol.for("fragments.expo54.metroWatchCompatibility");
  if (FileMap.prototype[installed]) return;
  const emit = FileMap.prototype.emit;

  FileMap.prototype.emit = function (name, ...args) {
    const event = args[0];
    if (name === "change" && event?.changes && !event.eventsQueue) {
      const eventsQueue = [];
      for (const [collection, type] of [["addedFiles", "add"], ["modifiedFiles", "change"], ["removedFiles", "delete"]]) {
        for (const [filePath, metadata] of event.changes[collection]) {
          eventsQueue.push({
            type,
            filePath: path.resolve(event.rootDir, filePath),
            metadata: { ...metadata, type: metadata.isSymlink ? "l" : "f" },
          });
        }
      }
      args[0] = { ...event, eventsQueue };
    }
    return emit.call(this, name, ...args);
  };
  Object.defineProperty(FileMap.prototype, installed, { value: true });
}

module.exports = { installExpoMetroWatchCompatibility };
