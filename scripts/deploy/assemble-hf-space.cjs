/**
 * Assembles a self-contained Hugging Face Space folder for the UniFit API.
 *
 * HF Spaces expect the Dockerfile at the repo root. This script mirrors the
 * canonical deploy/hf-space/Dockerfile into a clean upload folder together
 * with backend/, engine/, data/, and requirements.txt.
 *
 * Usage: npm run deploy:space:assemble
 * Output: dist-hf/
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const out = path.join(root, 'dist-hf');
const required = ['backend', 'engine', 'data', 'requirements.txt'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const entry of required) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required deploy input: ${source}`);
  }
  fs.cpSync(source, path.join(out, entry), { recursive: true });
}

fs.copyFileSync(
  path.join(root, 'deploy', 'hf-space', 'Dockerfile'),
  path.join(out, 'Dockerfile')
);
fs.copyFileSync(
  path.join(root, 'deploy', 'hf-space', 'README.md'),
  path.join(out, 'README.md')
);
fs.writeFileSync(
  path.join(out, '.gitignore'),
  ['.git', '__pycache__', '*.pyc', '.pytest_cache', '.venv'].join('\n') + '\n'
);

console.log(`Assembled Hugging Face Space at ${out}`);
console.log('');
console.log('Next steps:');
console.log('  1. Create a Space at https://huggingface.co/new-space (SDK: Docker, CPU basic).');
console.log('  2. cd dist-hf && git init && git add . && git commit -m "UniFit API"');
console.log('  3. git remote add space https://huggingface.co/spaces/<your-username>/<space-name>');
console.log('  4. git push space main');
