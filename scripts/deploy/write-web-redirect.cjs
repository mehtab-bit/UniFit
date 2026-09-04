/**
 * Writes the static-host SPA fallback into the Expo web export directory.
 * Expo Router's "single" output serves index.html for every client route.
 *
 * Usage: expo export -p web && node scripts/deploy/write-web-redirect.cjs
 */
const fs = require('fs');
const path = require('path');

const outDir = process.argv[2] || path.resolve(__dirname, '..', '..', 'dist');

if (!fs.existsSync(outDir)) {
  throw new Error(`Export directory not found: ${outDir}. Run expo export first.`);
}

fs.writeFileSync(path.join(outDir, '_redirects'), '/* /index.html 200\n');
console.log(`Wrote SPA fallback: ${path.join(outDir, '_redirects')}`);
