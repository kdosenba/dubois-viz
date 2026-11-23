import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const STYLES_SRC = path.join(ROOT, 'src', 'styles');
const STYLES_DIST = path.join(DIST, 'styles');

fs.rmSync(DIST, { recursive: true, force: true });

execFileSync('npx', ['tsc', '-p', 'tsconfig.lib.json'], {
  cwd: ROOT,
  stdio: 'inherit',
});

fs.mkdirSync(STYLES_DIST, { recursive: true });
for (const file of fs.readdirSync(STYLES_SRC)) {
  if (file.endsWith('.css')) {
    fs.copyFileSync(path.join(STYLES_SRC, file), path.join(STYLES_DIST, file));
  }
}

// Verify every package.json export resolves to an existing file in dist/
const pkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
) as {
  exports: Record<string, string | { types?: string; import?: string }>;
};

const missing: string[] = [];
for (const [subpath, target] of Object.entries(pkg.exports)) {
  const paths =
    typeof target === 'string'
      ? [target]
      : [target.import, target.types].filter((p): p is string => Boolean(p));
  for (const rel of paths) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      missing.push(`${subpath} -> ${rel}`);
    }
  }
}

if (missing.length > 0) {
  console.error('Missing build artifacts for package exports:\n', missing.join('\n'));
  process.exit(1);
}

console.log('✓ Library built cleanly to dist/ (ESM + .d.ts + CSS)');
