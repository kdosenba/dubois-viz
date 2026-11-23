import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');

const FORBIDDEN_DOMAIN_TERMS: readonly RegExp[] = [
  /\bruhi\b/i,
  /\bridvan\b/i,
  /\bbahai\b/i,
  /\bbahá/i,
  /\bfriends of the faith\b/i,
  /\bnational_community\b/i,
  /\bgroup_of_clusters\b/i,
  /\bgroup_of_regions\b/i,
  /\bLocationScope\b/,
  /\bGeographicLevel\b/,
  /\bcgp\b/i,
  /\bfirst_m3\b/i,
  /\bbook\s*1\b/i,
  /\bjunior youth\b/i,
  /\bstudy circle\b/i,
  /\bdevotional\b/i,
  /\bcoordinator\b/i,
  /\bsrp\b/i,
  /\bfacilitator\b/i,
];

function walkFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out.sort();
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const errors: string[] = [];

// 1. Check all TS files for `any` and `zod`
const allTsFiles = [
  ...walkFiles(SRC, '.ts'),
  ...walkFiles(path.join(ROOT, 'scripts'), '.ts'),
];

for (const file of allTsFiles) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf8');
  const code = stripComments(raw);

  if (rel !== 'scripts/verify-conformance.ts') {
    if (/(?::\s*any\b|\bas\s+any\b|<any>|any\[\])/.test(code)) {
      errors.push(`[ZERO-ANY] Forbidden \`any\` type found in ${rel}`);
    }
    if (/(?:from\s+['"]zod['"]|require\(['"]zod['"]\))/.test(code)) {
      errors.push(`[ZERO-ZOD] Forbidden \`zod\` import found in ${rel}`);
    }
  }
}

// 2. Check src/charts/*.ts (except index.ts) have ZERO local imports (only 'd3')
const chartDir = path.join(SRC, 'charts');
const chartFiles = walkFiles(chartDir, '.ts').filter(
  (f) => path.basename(f) !== 'index.ts'
);

const importRegex = /^\s*(?:import|export)\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/gm;

for (const file of chartFiles) {
  const rel = path.relative(ROOT, file);
  const code = stripComments(fs.readFileSync(file, 'utf8'));
  for (const match of code.matchAll(importRegex)) {
    const spec = match[1];
    if (spec !== 'd3') {
      errors.push(
        `[SELF-CONTAINED] ${rel} imports '${spec}' (only 'd3' is allowed in standalone chart files)`
      );
    }
  }
}

// 3. Domain-agnostic audit across all library source & styles (excluding showcase & this script)
const libFiles = [
  ...walkFiles(SRC, '.ts'),
  ...walkFiles(SRC, '.css'),
].filter((f) => !f.startsWith(path.join(SRC, 'showcase')));

for (const file of libFiles) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of FORBIDDEN_DOMAIN_TERMS) {
    if (pattern.test(content)) {
      errors.push(
        `[DOMAIN-AGNOSTIC] Domain-specific term ${pattern} found in ${rel}`
      );
    }
  }
}

// 4. CSS isolation audit: no bare html, body, or * selectors outside exhibition.css
const cssFiles = walkFiles(path.join(SRC, 'styles'), '.css').filter(
  (f) => path.basename(f) !== 'exhibition.css' && path.basename(f) !== 'fonts.css'
);

for (const file of cssFiles) {
  const rel = path.relative(ROOT, file);
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const selectorLines = css
    .split('{')
    .slice(0, -1)
    .map((chunk) => chunk.split('}').pop()?.trim() ?? '');

  for (const selectorGroup of selectorLines) {
    if (selectorGroup.startsWith('@')) continue;
    for (const sel of selectorGroup.split(',').map((s) => s.trim())) {
      if (
        sel === '*' ||
        sel === '*::before' ||
        sel === '*::after' ||
        /^html(\b|:|$)/i.test(sel) ||
        /^body(\b|:|$)/i.test(sel)
      ) {
        errors.push(
          `[CSS-ISOLATION] Global selector "${sel}" found in ${rel} (only allowed in exhibition.css)`
        );
      }
    }
  }
}

// 5. Token parity audit: hex literals in tokens.css match src/contracts/tokens.ts
const tokensCssPath = path.join(SRC, 'styles', 'tokens.css');
const tokensTsPath = path.join(SRC, 'contracts', 'tokens.ts');
if (fs.existsSync(tokensCssPath) && fs.existsSync(tokensTsPath)) {
  const cssHexes = new Set(
    (fs.readFileSync(tokensCssPath, 'utf8').match(/#[0-9A-Fa-f]{6}\b/g) ?? []).map(
      (h) => h.toUpperCase()
    )
  );
  const tsHexes = new Set(
    (fs.readFileSync(tokensTsPath, 'utf8').match(/#[0-9A-Fa-f]{6}\b/g) ?? []).map(
      (h) => h.toUpperCase()
    )
  );
  for (const hex of cssHexes) {
    if (!tsHexes.has(hex)) {
      errors.push(`[TOKEN-PARITY] ${hex} in tokens.css missing from contracts/tokens.ts`);
    }
  }
  for (const hex of tsHexes) {
    if (!cssHexes.has(hex)) {
      errors.push(`[TOKEN-PARITY] ${hex} in contracts/tokens.ts missing from tokens.css`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\nConformance verification FAILED (${errors.length} issue(s)):\n`);
  for (const err of errors) {
    console.error(`  ✗ ${err}`);
  }
  process.exit(1);
}

console.log(
  `✓ Conformance passed (${chartFiles.length} self-contained charts, ${cssFiles.length} isolated stylesheets, 0 any, 0 zod, 0 domain terms)`
);
