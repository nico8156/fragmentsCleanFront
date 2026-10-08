// Source qualification only: the signed production archive still requires release review.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { checkAudit, checkSourceMaps } = require('./security-policy.cjs');
const root = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'fragments-security-'));
try {
  const audit = spawnSync('npm', ['audit', '--audit-level=high', '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 120000 });
  fs.writeFileSync(path.join(output, 'npm-audit.json'), audit.stdout || '');
  console.log(audit.stdout || 'No audit response');
  if (audit.error || ![0, 1].includes(audit.status)) throw new Error('npm audit failed: ' + (audit.error?.message || audit.stderr));
  const accepted = checkAudit(JSON.parse(audit.stdout), JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')));
  const exported = path.join(output, 'ios');
  const build = spawnSync(process.execPath, [path.join(root, 'node_modules/expo/bin/cli'), 'export', '--platform', 'ios', '--source-maps', '--output-dir', exported], {
    cwd: root, stdio: 'inherit', timeout: 600000,
    env: { ...process.env, CI: '1', EAS_BUILD_PROFILE: 'preview' },
  });
  if (build.error || build.status !== 0) throw new Error('iOS security export failed');
  const mapDir = path.join(exported, '_expo/static/js/ios');
  const maps = fs.readdirSync(mapDir).filter(name => name.endsWith('.map')).map(name => JSON.parse(fs.readFileSync(path.join(mapDir, name), 'utf8')));
  const count = checkSourceMaps(maps);
  console.log(`Security gate passed: ${count} iOS sources inspected; braces/node-forge absent.`);
  console.log(accepted.length ? `TEMPORARY EXCEPTIONS (expire 2026-10-22 00:00 UTC): ${accepted.join(', ')}` : 'No high/critical exceptions needed.');
  console.log('Moderate findings remain visible in the complete audit above. Preview export is not a signed production archive.');
} catch (error) {
  console.error('Security gate BLOCKED:', error.message);
  process.exitCode = 1;
} finally {
  console.log('Security evidence:', output);
}
