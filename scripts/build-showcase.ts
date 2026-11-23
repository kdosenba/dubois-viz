import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'docs');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(ROOT, 'src', 'showcase', 'main.ts')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  sourcemap: false,
  minify: true,
  outfile: path.join(OUT, 'showcase.js'),
  loader: { '.css': 'css' },
});

const stylesOrder = [
  'tokens.css',
  'fonts.css',
  'base.css',
  'controls.css',
  'plates.css',
];

const bundledCss = stylesOrder
  .map((f) => fs.readFileSync(path.join(ROOT, 'src', 'styles', f), 'utf8'))
  .join('\n\n');

fs.writeFileSync(path.join(OUT, 'dubois-viz.css'), bundledCss, 'utf8');

fs.copyFileSync(
  path.join(ROOT, 'src', 'showcase', 'index.html'),
  path.join(OUT, 'index.html')
);

console.log('✓ Pre-built showcase written cleanly to docs/');
