/**
 * Bubble Pop Blast — YouTube Playables preflight check.
 *
 * Validates the production build against the Playables publishing requirements:
 *   - File count limit (≤ 8,000 files)
 *   - Total bundle size (≤ 250 MiB)
 *   - Initial bundle size (index.html + index JS/CSS, ≤ 15 MiB)
 *   - No individual file > 30 MiB
 *   - All filenames use only [A-Za-z0-9_.-]
 *   - SDK <script> is present BEFORE the game bundle in dist/index.html
 *
 * Run with:
 *   npm run check:playables
 *
 * @see https://developers.google.com/youtube/gaming/playables/certification/requirements
 */

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const files = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    entry.isDirectory() ? walk(full) : files.push(full);
  }
};

if (!fs.existsSync(root)) {
  throw new Error('Missing dist/. Run: npm run build');
}
walk(root);

// ── Size checks ─────────────────────────────────────────────────────────────

const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const invalidNames = files.filter((file) => !/^[A-Za-z0-9_.\-]+$/.test(path.basename(file)));
const oversized = files.filter((file) => fs.statSync(file).size > 30 * 1024 * 1024);

// "Initial" bundle = index.html + JS and CSS chunks named index-*.
const initial = files.filter(
  (file) =>
    /index\.(html|js|css)$/.test(path.basename(file)) ||
    file.includes(`${path.sep}assets${path.sep}index-`)
);
const initialBytes = initial.reduce((sum, file) => sum + fs.statSync(file).size, 0);

// ── SDK load-order check ─────────────────────────────────────────────────────

const indexHtml = path.join(root, 'index.html');
let sdkLoadedFirst = false;

if (fs.existsSync(indexHtml)) {
  const html = fs.readFileSync(indexHtml, 'utf-8');
  // The SDK script must appear before any module-type script (game bundle).
  const sdkPos = html.indexOf('youtube.com/game_api/v1');
  const bundlePos = html.indexOf('<script type="module"');

  if (sdkPos !== -1 && (bundlePos === -1 || sdkPos < bundlePos)) {
    sdkLoadedFirst = true;
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

const fmt = (bytes) => (bytes / 1024 / 1024).toFixed(2);

console.log('');
console.log('── Bubble Pop Blast · YouTube Playables Preflight ──────────────');
console.log(`  Files            : ${files.length.toLocaleString()} / 8,000`);
console.log(`  Initial bundle   : ${fmt(initialBytes)} MiB / 15 MiB limit`);
console.log(`  Total bundle     : ${fmt(totalBytes)} MiB / 250 MiB limit`);
console.log(`  SDK load order   : ${sdkLoadedFirst ? '✅ OK — SDK before game bundle' : '❌ FAIL — SDK not found or loaded after game bundle'}`);
console.log(`  Invalid names    : ${invalidNames.length === 0 ? '✅ none' : '❌ ' + invalidNames.map((f) => path.basename(f)).join(', ')}`);
console.log(`  Oversized files  : ${oversized.length === 0 ? '✅ none' : '❌ ' + oversized.map((f) => path.basename(f)).join(', ')}`);
console.log('─────────────────────────────────────────────────────────────────');

const errors = [];
if (files.length > 8000) errors.push(`Too many files: ${files.length} (limit: 8,000)`);
if (totalBytes > 250 * 1024 * 1024) errors.push(`Total bundle too large: ${fmt(totalBytes)} MiB (limit: 250 MiB)`);
if (initialBytes > 15 * 1024 * 1024) errors.push(`Initial bundle too large: ${fmt(initialBytes)} MiB (limit: 15 MiB)`);
if (invalidNames.length > 0) errors.push(`Invalid filenames: ${invalidNames.map((f) => path.basename(f)).join(', ')}`);
if (oversized.length > 0) errors.push(`Files exceeding 30 MiB: ${oversized.map((f) => path.basename(f)).join(', ')}`);
if (!sdkLoadedFirst) errors.push('YouTube Playables SDK not loaded before game bundle in dist/index.html');

if (errors.length > 0) {
  console.error('\n❌ Preflight FAILED:');
  errors.forEach((e) => console.error(`   • ${e}`));
  console.error('');
  process.exit(1);
}

console.log('');
console.log('✅ Preflight PASSED.');
console.log('   Next: Upload a production build to the Playables Developer Portal,');
console.log('   then run the official Test Suite:');
console.log('   https://developers.google.com/youtube/gaming/playables/test_suite');
console.log('');
