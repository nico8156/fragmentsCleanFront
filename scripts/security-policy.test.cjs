const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkAudit, checkSourceMaps } = require('./security-policy.cjs');
const NOW = Date.parse('2026-10-08T12:00:00Z');
function fixture() {
  const audit = { auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 0, total: 3 } } };
  const lock = { packages: {} };
  for (const [name, version, id] of [['braces', '3.0.3', 'GHSA-vfj7-8cjw-p6xm'], ['node-forge', '1.4.0', 'GHSA-86w9-cpqp-85rv']]) {
    audit.vulnerabilities[name] = { name, severity: 'high', nodes: ['node_modules/' + name], via: [{ name, severity: 'high', url: 'https://github.com/advisories/' + id }] };
    lock.packages['node_modules/' + name] = { version };
  }
  audit.vulnerabilities.expo = { name: 'expo', severity: 'high', via: ['node-forge'] };
  return { audit, lock };
}
test('accepts only the two reviewed advisories including propagated parents', () => {
  const { audit, lock } = fixture();
  assert.equal(checkAudit(audit, lock, NOW).length, 2);
});
for (const [label, change, expected] of [
  ['new high on an already excepted package', a => a.vulnerabilities.braces.via.push({name:'braces', severity:'high', url:'https://github.com/advisories/NEW'}), /Unapproved/],
  ['critical escalation', a => a.vulnerabilities.braces.severity = 'critical', /Critical/],
  ['critical advisory with misleading parent severity', a => a.vulnerabilities.braces.via[0].severity = 'critical', /Unapproved/],
  ['unknown graph reference', a => a.vulnerabilities.expo.via = ['missing'], /Unknown/],
  ['unexplained high cycle', a => a.vulnerabilities.expo.via = ['expo'], /Unexplained/],
  ['registry error', a => a.error = {code:'E503'}, /Invalid/],
  ['incorrect metadata', a => a.metadata.vulnerabilities.total++, /Inconsistent/],
  ['changed advisory identity', a => a.vulnerabilities.braces.via[0].name = 'other', /Unapproved/],
  ['missing via', a => a.vulnerabilities.expo.via = [], /Malformed/],
]) test('blocks ' + label, () => {
  const { audit, lock } = fixture(); change(audit);
  assert.throws(() => checkAudit(audit, lock, NOW), expected);
});
test('expires exactly at October 22 UTC, with no implicit extension', () => {
  const { audit, lock } = fixture();
  assert.equal(checkAudit(audit, lock, Date.parse('2026-10-21T23:59:59.999Z')).length, 2);
  assert.throws(() => checkAudit(audit, lock, Date.parse('2026-10-22T00:00:00Z')), /expired/);
});
test('blocks version changes and nested unreviewed copies', () => {
  const { audit, lock } = fixture();
  lock.packages['node_modules/braces'].version = '3.0.4';
  assert.throws(() => checkAudit(audit, lock, NOW), /mismatch/);
  lock.packages['node_modules/braces'].version = '3.0.3';
  lock.packages['node_modules/other/node_modules/braces'] = {version:'2.0.0'};
  assert.throws(() => checkAudit(audit, lock, NOW), /mismatch/);
});
test('blocks missing lockfile evidence and mismatched reported paths', () => {
  const { audit, lock } = fixture();
  audit.vulnerabilities.braces.nodes = ['node_modules/unknown'];
  assert.throws(() => checkAudit(audit, lock, NOW), /mismatch/);
  delete lock.packages['node_modules/braces'];
  assert.throws(() => checkAudit(audit, lock, NOW), /mismatch/);
});
test('clean audit needs no exception even after expiry; moderates remain permitted', () => {
  const audit = {auditReportVersion:2, vulnerabilities:{decode:{name:'decode', severity:'moderate', via:[{name:'decode',severity:'moderate',url:'https://example.test/advisory'}]}}, metadata:{vulnerabilities:{info:0,low:0,moderate:1,high:0,critical:0,total:1}}};
  assert.deepEqual(checkAudit(audit, {packages:{}}, Date.parse('2026-11-01')), []);
});
test('inspects normal and indexed source maps', () => {
  assert.equal(checkSourceMaps([{version:3, sources:['/node_modules/react/index.js']}, {version:3, sections:[{map:{version:3,sources:['app.ts']}}]}]), 2);
});
for (const source of ['/node_modules/braces/lib/a.js', '/node_modules/expo/node_modules/node-forge/lib/a.js', 'C:\\repo\\node_modules\\braces\\index.js', '/node_modules/%62races/index.js']) test('rejects bundled ' + source, () => {
  assert.throws(() => checkSourceMaps([{version:3,sources:[source]}]), /bundled/);
});
test('checks sourceRoot and indexed maps', () => {
  assert.throws(() => checkSourceMaps([{version:3,sourceRoot:'/node_modules/node-forge',sources:['lib/a.js']}]), /bundled/);
  assert.throws(() => checkSourceMaps([{version:3,sections:[{map:{version:3,sources:['/node_modules/braces/a.js']}}]}]), /bundled/);
});
test('missing or malformed bundle evidence blocks', () => {
  for (const maps of [[], [{}], [{version:3,sources:[]}], [{version:3,sections:[]}], [{version:3,sections:[{url:'external.map'}]}], [{version:3,sources:[null]}]]) assert.throws(() => checkSourceMaps(maps));
});
