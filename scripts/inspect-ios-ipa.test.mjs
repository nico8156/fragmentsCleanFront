import assert from "node:assert/strict";
import { test } from "node:test";

import { classifySignatureVerification, findAppPrefix } from "./inspect-ios-ipa.mjs";

test("finds exactly one application bundle", () => {
  assert.equal(findAppPrefix(["Payload/Fragments.app/Info.plist", "Payload/Fragments.app/main.jsbundle"]), "Payload/Fragments.app");
  assert.throws(() => findAppPrefix([]), /exactly one/);
  assert.throws(() => findAppPrefix(["Payload/A.app/Info.plist", "Payload/B.app/Info.plist"]), /found 2/);
});

test("accepts a valid signature or a locally unavailable Apple trust chain only", () => {
  assert.equal(classifySignatureVerification(0, "valid on disk"), "trusted");
  assert.equal(classifySignatureVerification(1, "CSSMERR_TP_NOT_TRUSTED"), "integrity-checked-local-trust-unavailable");
  assert.throws(() => classifySignatureVerification(1, "code object is not signed at all"), /verification failed/);
  assert.throws(() => classifySignatureVerification(1, "CSSMERR_TP_NOT_TRUSTED; modified resources"), /verification failed/);
});
