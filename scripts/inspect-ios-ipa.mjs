import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const run = (command, args, options = {}) => execFileSync(command, args, { encoding: "utf8", ...options }).trim();

const plistValue = (plist, key) => run("plutil", ["-extract", key, "raw", plist]);

const hasPlistKey = (plist, key) =>
  spawnSync("plutil", ["-extract", key, "raw", plist], { encoding: "utf8" }).status === 0;

const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

export function findAppPrefix(entries) {
  const apps = [...new Set(entries.map((entry) => entry.match(/^(Payload\/[^/]+\.app)\//)?.[1]).filter(Boolean))];
  requireValue(apps.length === 1, `Expected exactly one .app in the IPA, found ${apps.length}`);
  return apps[0];
}

export function classifySignatureVerification(status, output) {
  if (status === 0) return "trusted";
  if (output.includes("CSSMERR_TP_NOT_TRUSTED") && !/modified|invalid resource|not signed|code object is not signed/i.test(output)) {
    return "integrity-checked-local-trust-unavailable";
  }
  throw new Error(`Code signature verification failed: ${output.trim()}`);
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error(`Invalid argument near ${key ?? "end of command"}`);
    options[key.slice(2)] = value;
  }
  requireValue(options.ipa, "Usage: npm run native:ipa:inspect -- --ipa <path> [--build-id <EAS id>] [--git-commit <sha>]");
  return options;
}

export function inspectIpa(options) {
  const ipa = resolve(options.ipa);
  requireValue(ipa.endsWith(".ipa"), "The release artifact must be an .ipa file");
  const entries = run("unzip", ["-Z1", ipa]).split("\n").filter(Boolean);
  const appPrefix = findAppPrefix(entries);
  const extraction = mkdtempSync(join(tmpdir(), "fragments-ipa-"));

  try {
    run("ditto", ["-x", "-k", ipa, extraction]);
    const app = join(extraction, appPrefix);
    const info = join(app, "Info.plist");
    const provision = join(app, "embedded.mobileprovision");
    const provisionPlist = join(extraction, "provision.plist");
    const entitlementsPlist = join(extraction, "entitlements.plist");
    const privacyManifests = entries.filter((entry) => entry.startsWith(`${appPrefix}/`) && entry.endsWith("PrivacyInfo.xcprivacy"));

    requireValue(privacyManifests.includes(`${appPrefix}/PrivacyInfo.xcprivacy`), "Aggregated app PrivacyInfo.xcprivacy is missing");
    requireValue(entries.includes(`${appPrefix}/main.jsbundle`), "Embedded production JavaScript bundle is missing");
    requireValue(entries.includes(`${appPrefix}/embedded.mobileprovision`), "Embedded provisioning profile is missing");

    for (const relativeManifest of privacyManifests) run("plutil", ["-lint", join(extraction, relativeManifest)]);

    const bundleIdentifier = plistValue(info, "CFBundleIdentifier");
    const version = plistValue(info, "CFBundleShortVersionString");
    const buildNumber = plistValue(info, "CFBundleVersion");
    requireValue(bundleIdentifier === "com.nico8156.fragments", `Unexpected bundle identifier: ${bundleIdentifier}`);
    requireValue(plistValue(info, "ITSAppUsesNonExemptEncryption") === "false", "Encryption export declaration must remain false");

    for (const key of [
      "NSFaceIDUsageDescription",
      "NSLocationAlwaysAndWhenInUseUsageDescription",
      "NSLocationAlwaysUsageDescription",
      "NSMicrophoneUsageDescription",
      "UIBackgroundModes",
    ]) {
      requireValue(!hasPlistKey(info, key), `Forbidden iOS capability found in IPA: ${key}`);
    }
    for (const key of ["NSCameraUsageDescription", "NSLocationWhenInUseUsageDescription", "NSPhotoLibraryUsageDescription"]) {
      requireValue(hasPlistKey(info, key), `Required purpose string missing from IPA: ${key}`);
    }

    const provisionXml = execFileSync(
      "openssl",
      ["smime", "-inform", "der", "-verify", "-noverify", "-in", provision],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    writeFileSync(provisionPlist, provisionXml);
    run("plutil", ["-extract", "Entitlements", "xml1", "-o", entitlementsPlist, provisionPlist]);
    const entitlements = JSON.parse(run("plutil", ["-convert", "json", "-o", "-", entitlementsPlist]));
    const applicationIdentifier = entitlements["application-identifier"];
    const teamIdentifier = entitlements["com.apple.developer.team-identifier"];
    requireValue(applicationIdentifier === `${teamIdentifier}.${bundleIdentifier}`, "Provisioning profile does not match the app identifier");
    requireValue(entitlements["get-task-allow"] === false, "Store IPA must not allow debugger attachment");
    requireValue(entitlements["beta-reports-active"] === true, "Store/TestFlight beta reporting entitlement is missing");
    requireValue(entitlements["com.apple.developer.applesignin"]?.[0] === "Default", "Sign in with Apple entitlement is missing");

    const signature = spawnSync("codesign", ["--verify", "--deep", "--strict", "--verbose=4", app], { encoding: "utf8" });
    const signatureOutput = `${signature.stdout ?? ""}\n${signature.stderr ?? ""}`;
    const signatureStatus = classifySignatureVerification(signature.status, signatureOutput);
    const codeDescription = spawnSync("codesign", ["-dvvv", app], { encoding: "utf8" });
    const codeOutput = `${codeDescription.stdout ?? ""}\n${codeDescription.stderr ?? ""}`;
    requireValue(codeOutput.includes(`Identifier=${bundleIdentifier}`), "Code signature identifier does not match the bundle");
    requireValue(codeOutput.includes(`TeamIdentifier=${teamIdentifier}`), "Code signature team does not match the provisioning profile");

    const report = {
      artifact: basename(ipa),
      sha256: createHash("sha256").update(readFileSync(ipa)).digest("hex"),
      easBuildId: options["build-id"] ?? null,
      gitCommit: options["git-commit"] ?? null,
      bundleIdentifier,
      version,
      buildNumber,
      teamIdentifier,
      signatureStatus,
      privacyManifestCount: privacyManifests.length,
      appleSignInEntitlement: true,
      debuggerAttachmentAllowed: false,
    };
    console.log(JSON.stringify(report, null, 2));
    return report;
  } finally {
    rmSync(extraction, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    inspectIpa(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
