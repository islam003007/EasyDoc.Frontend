#!/usr/bin/env node
/**
 * Keeps the frontend from growing new monoliths. Every source file is checked
 * against the same budget; there are no legacy exceptions.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const BUDGET = { tsx: 300, ts: 240, css: 360 };

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const failures = [];
for (const path of walk(SRC)) {
  const rel = relative(ROOT, path).replaceAll('\\', '/');
  if (!/\.(tsx?|css)$/.test(rel)) continue;
  if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue;
  if (rel.startsWith('src/test/')) continue;

  const ext = rel.split('.').pop();
  const budget = BUDGET[ext] ?? 300;
  const content = readFileSync(path, 'utf8');
  const lines = content.endsWith('\n')
    ? content.split('\n').length - 1
    : content.split('\n').length;

  if (lines > budget) {
    failures.push(`${rel}: ${lines} lines exceeds the ${budget}-line ${ext} budget`);
  }
}

if (failures.length > 0) {
  console.error(
    'File size check failed:\n' + failures.map((f) => `  - ${f}`).join('\n'),
  );
  process.exit(1);
}

console.log('File size check passed. All files are within budget.');
