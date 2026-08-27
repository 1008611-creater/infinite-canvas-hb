import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const pkgs = lock.packages || {};
const missing = [];

for (const [k, p] of Object.entries(pkgs)) {
  if (k === '') continue;
  const np = k.startsWith('node_modules/') ? k.slice('node_modules/'.length) : k;
  const pkgDir = 'node_modules/' + np;
  if (existsSync(pkgDir + '/package.json')) continue;
  missing.push({ path: np, version: p.version, resolved: p.resolved || '' });
}

console.log(`Missing: ${missing.length} packages`);

// Scoped package handling: @scope/name -> @scope/name
const registry = 'https://registry.npmmirror.com';

for (const pkg of missing) {
  const name = pkg.path;
  const ver = pkg.version;
  
  // construct tarball URL
  let tarballUrl;
  if (name.startsWith('@')) {
    const [scope, bare] = name.split('/');
    tarballUrl = `${registry}/${scope}%2f${bare}/-/${bare}-${ver}.tgz`;
  } else {
    tarballUrl = `${registry}/${name}/-/${name}-${ver}.tgz`;
  }
  
  const tmpTgz = `c:\\tmp\\npm_tgz_${Date.now()}_${Math.random().toString(36).slice(2,8)}.tgz`;
  const targetDir = `node_modules/${name}`;
  
  try {
    mkdirSync(targetDir, { recursive: true });
    execSync(`curl -sL "${tarballUrl}" -o "${tmpTgz}" 2>&1`, { stdio: 'pipe', timeout: 30000 });
    execSync(`tar -xzf "${tmpTgz}" --force-local -C "${targetDir}" --strip-components=1 2>&1`, { stdio: 'pipe', timeout: 10000 });
    execSync(`rm -f "${tmpTgz}"`, { stdio: 'pipe' });
    console.log(`  OK  ${name}@${ver}`);
  } catch (e) {
    console.log(`  FAIL ${name}@${ver}: ${e.message}`);
  }
}

console.log('Done.');