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

if (!fs.existsSync(root)) throw new Error('Missing dist/. Run npm run build first.');
walk(root);

const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const invalidNames = files.filter((file) => !/^[A-Za-z0-9_.-]+$/.test(path.basename(file)));
const oversized = files.filter((file) => fs.statSync(file).size > 30 * 1024 * 1024);
const initial = files.filter((file) => /index\.(html|js|css)$/.test(path.basename(file)) || file.includes(`${path.sep}assets${path.sep}index-`));
const initialBytes = initial.reduce((sum, file) => sum + fs.statSync(file).size, 0);

console.log(`Files: ${files.length}`);
console.log(`Initial bundle: ${(initialBytes / 1024 / 1024).toFixed(2)} MiB (limit: 15 MiB)`);
console.log(`Total bundle: ${(totalBytes / 1024 / 1024).toFixed(2)} MiB (limit: 250 MiB)`);

if (files.length > 8000 || totalBytes > 250 * 1024 * 1024 || initialBytes > 15 * 1024 * 1024 || invalidNames.length || oversized.length) {
  throw new Error(`Playables preflight failed: ${invalidNames.length} invalid names, ${oversized.length} files over 30 MiB.`);
}

console.log('Playables bundle preflight passed. Run the official Test Suite on a Developer Portal release before publishing.');
