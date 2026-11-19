#!/usr/bin/env node
/**
 * Keeps the frontend from growing new monoliths while the existing large
 * screens are split incrementally. A file may only be over budget if it is in
 * LEGACY_DEBT and has not grown since the baseline.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const BUDGET = { tsx: 300, ts: 240, css: 360 };

// Temporary debt. Remove an entry when the file is split.
const LEGACY_DEBT = {
  'src/screens/DoctorScheduleScreen.tsx': 997,
  'src/screens/DoctorBoardScreen.tsx': 641,
  'src/screens/PatientVisitsScreen.tsx': 657,
  'src/screens/DoctorDetailScreen.tsx': 432,
  'src/screens/DoctorProfileScreen.tsx': 449,
  'src/screens/AccountScreen.tsx': 380,
  'src/screens/PatientSearchScreen.tsx': 339,
  'src/screens/AdminDoctorDialog.tsx': 328,
  'src/screens/AdminDoctorsScreen.tsx': 311,
  'src/api/queries.ts': 548,
  'src/api/normalize.ts': 516,
  'src/styles/ui.css': 1700,
  'src/styles/screens-doctor.css': 554,
  'src/styles/screens-patient.css': 525,
  'src/styles/screens-account.css': 211,
  'src/styles/fc-auth.css': 1530,
};

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
  const debtLimit = LEGACY_DEBT[rel];

  if (debtLimit !== undefined) {
    if (lines > debtLimit) {
      failures.push(
        `${rel}: ${lines} lines exceeds its debt baseline of ${debtLimit}; split it instead of growing it`,
      );
    }
    continue;
  }

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

console.log(
  `File size check passed. ${Object.keys(LEGACY_DEBT).length} legacy files are tracked for splitting.`,
);
