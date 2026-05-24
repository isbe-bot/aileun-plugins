import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exts = new Set(['.js', '.json', '.md', '.sql', '.gitignore']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'runtime' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else {
      const ext = path.extname(entry.name);
      if (exts.has(ext) || entry.name === '.gitignore') out.push(full);
    }
  }
  return out;
}

for (const file of walk(root)) {
  const content = fs.readFileSync(file, 'utf8');
  const normalized = content.replace(/\r\n/g, '\n');
  if (!normalized.endsWith('\n')) {
    fs.writeFileSync(file, `${normalized}\n`, 'utf8');
  } else if (normalized !== content) {
    fs.writeFileSync(file, normalized, 'utf8');
  }
}

console.log('format: ok');
