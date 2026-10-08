const EXCEPTIONS = Object.freeze({
  'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm': { name: 'braces', version: '3.0.3' },
  'https://github.com/advisories/GHSA-86w9-cpqp-85rv': { name: 'node-forge', version: '1.4.0' },
});
const EXPIRES = Date.parse('2026-10-22T00:00:00Z');
const levels = ['info', 'low', 'moderate', 'high', 'critical'];
function checkAudit(audit, lock, now = Date.now()) {
  if (audit?.error || audit?.auditReportVersion !== 2 || !audit.vulnerabilities ||
      !audit.metadata?.vulnerabilities || !lock?.packages || !Number.isFinite(now)) {
    throw new Error('Invalid or unavailable npm audit / lockfile');
  }
  const entries = Object.entries(audit.vulnerabilities);
  const counts = Object.fromEntries(levels.map(level => [level, 0]));
  const accepted = new Set();
  for (const [name, entry] of entries) {
    if (entry.name !== name || !levels.includes(entry.severity) || !Array.isArray(entry.via) || !entry.via.length) throw new Error('Malformed vulnerability: ' + name);
    counts[entry.severity]++;
    if (entry.severity === 'critical') throw new Error('Critical vulnerability: ' + name);
    for (const via of entry.via) {
      if (typeof via === 'string') {
        if (!audit.vulnerabilities[via]) throw new Error('Unknown advisory dependency: ' + via);
        continue;
      }
      if (!via || !levels.includes(via.severity) || typeof via.url !== 'string') throw new Error('Malformed advisory');
      if (!['high', 'critical'].includes(via.severity)) continue;
      const exception = EXCEPTIONS[via.url];
      if (via.severity === 'critical' || !exception || via.name !== exception.name || name !== exception.name) throw new Error('Unapproved advisory: ' + via.url);
      if (now >= EXPIRES) throw new Error('Security exception expired: ' + via.url);
      const installed = Object.entries(lock.packages).filter(([path]) => path === 'node_modules/' + name || path.endsWith('/node_modules/' + name));
      if (!installed.length || installed.some(([, pkg]) => pkg.version !== exception.version) ||
          !Array.isArray(entry.nodes) || !entry.nodes.length || entry.nodes.some(path => !installed.some(([p]) => p === path))) throw new Error('Exception version/path mismatch: ' + name);
      accepted.add(via.url);
    }
  }
  for (const level of levels) if (audit.metadata.vulnerabilities[level] !== counts[level]) throw new Error('Inconsistent audit counts');
  if (audit.metadata.vulnerabilities.total !== entries.length) throw new Error('Inconsistent audit total');
  function roots(name, seen = new Set()) {
    if (seen.has(name)) return [];
    const next = new Set([...seen, name]);
    return audit.vulnerabilities[name].via.flatMap(v => typeof v === 'string' ? roots(v, next) : [v]);
  }
  for (const [name, entry] of entries) {
    if (entry.severity !== 'high') continue;
    const high = roots(name).filter(v => ['high', 'critical'].includes(v.severity));
    if (!high.length || high.some(v => !accepted.has(v.url))) throw new Error('Unexplained high vulnerability: ' + name);
  }
  return [...accepted];
}
function checkSourceMaps(maps) {
  if (!Array.isArray(maps) || !maps.length) throw new Error('Missing iOS source maps');
  let count = 0;
  function inspect(map) {
    if (map?.version !== 3) throw new Error('Invalid source map');
    if (Array.isArray(map.sections)) {
      if (!map.sections.length) throw new Error('Empty source map sections');
      for (const section of map.sections) inspect(section.map);
      return;
    }
    if (!Array.isArray(map.sources) || !map.sources.length || (map.sourceRoot !== undefined && typeof map.sourceRoot !== 'string')) throw new Error('Missing source map sources');
    for (const source of map.sources) {
      if (typeof source !== 'string' || !source) throw new Error('Invalid source path');
      const path = decodeURIComponent((map.sourceRoot || '') + '/' + source).replaceAll('\\', '/');
      if (/(?:^|\/)node_modules\/(?:braces|node-forge)(?:\/|$)/.test(path)) throw new Error('Tooling dependency bundled in iOS: ' + source);
      count++;
    }
  }
  maps.forEach(inspect);
  return count;
}
module.exports = { checkAudit, checkSourceMaps };
