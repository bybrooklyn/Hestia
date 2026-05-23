/**
 * Initial-resource budget gate.
 *
 * Parses `dist/index.html`, sums the raw / gzip / brotli sizes of every
 * resource the browser will fetch BEFORE the first user interaction (module
 * entry, every `<link rel="modulepreload">`, every `<link rel="stylesheet">`),
 * prints the top offenders, and exits non-zero if the budget is blown.
 *
 * Run after `pnpm build`:
 *
 *   pnpm -C packages/frontend build && pnpm -C packages/frontend check:budget
 *
 * Tightening the thresholds here is how we prevent perf regressions that
 * aren't visible from raw chunk size alone.
 */
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const DIST = resolve(import.meta.dirname, '..', 'dist');
const HTML = resolve(DIST, 'index.html');

/**
 * Soft budgets — tighten as wins land. Aligned with PERFORMANCE_NOTES.md.
 */
const BUDGET_GZIP_BYTES = 550 * 1024;
const BUDGET_LARGEST_CHUNK_GZIP_BYTES = 150 * 1024;

/**
 * Vendors that must NOT appear in the unauthenticated initial graph.
 * Playback-only, drag-only, visualizer-only.
 */
const FORBIDDEN_INITIAL_VENDORS = /(?:^|\/)(?:hls\.js|libpgs|assjs|audiomotion-analyzer|sortablejs|swiper)-[^/]+\.js$/;

interface FileSize {
  file: string;
  raw: number;
  gz: number;
  br: number;
}

const html = readFileSync(HTML, 'utf8');
const re = /(?:rel="modulepreload"|rel="stylesheet"|type="module")[^>]*(?:href|src)="([^"]+)"/g;
const refs = new Set<string>();

let match: RegExpExecArray | null;

while ((match = re.exec(html)) !== null) {
  refs.add(match[1]!.replace(/^\.\//, ''));
}

const rows: FileSize[] = [];
let totalRaw = 0;
let totalGz = 0;
let totalBr = 0;

for (const file of refs) {
  const fullPath = resolve(DIST, file);

  let buf: Buffer;

  try {
    statSync(fullPath);
    buf = readFileSync(fullPath);
  } catch {
    console.error(`[initial-budget] referenced file missing: ${file}`);
    process.exitCode = 1;
    continue;
  }

  const gz = gzipSync(buf).length;
  const br = brotliCompressSync(buf).length;

  rows.push({ file, raw: buf.length, gz, br });
  totalRaw += buf.length;
  totalGz += gz;
  totalBr += br;
}

rows.sort((a, b) => b.gz - a.gz);

const kib = (n: number) => (n / 1024).toFixed(1).padStart(7);

console.log(`Initial resources from dist/index.html: ${rows.length}`);
console.log(
  `Total raw: ${kib(totalRaw)} KiB | gzip: ${kib(totalGz)} KiB | brotli: ${kib(totalBr)} KiB`
);
console.log('Top 12 by gzip:');

for (const row of rows.slice(0, 12)) {
  console.log(`  ${kib(row.gz)} KiB gz | ${kib(row.raw)} KiB raw | ${row.file}`);
}

let failed = false;

if (totalGz > BUDGET_GZIP_BYTES) {
  console.error(
    `\n[initial-budget] FAIL: total initial gzip ${kib(totalGz).trim()} KiB exceeds budget ${kib(BUDGET_GZIP_BYTES).trim()} KiB`
  );
  failed = true;
}

const largest = rows[0];

if (largest && largest.gz > BUDGET_LARGEST_CHUNK_GZIP_BYTES) {
  console.error(
    `\n[initial-budget] FAIL: largest initial chunk ${largest.file} = ${kib(largest.gz).trim()} KiB gz exceeds budget ${kib(BUDGET_LARGEST_CHUNK_GZIP_BYTES).trim()} KiB`
  );
  failed = true;
}

const forbidden = rows.filter(row => FORBIDDEN_INITIAL_VENDORS.test(row.file));

if (forbidden.length > 0) {
  console.error('\n[initial-budget] FAIL: playback-only vendors found in initial graph:');

  for (const row of forbidden) {
    console.error(`  ${row.file}`);
  }

  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('\n[initial-budget] OK');
