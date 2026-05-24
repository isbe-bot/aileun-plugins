import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const exts = new Set(['.js', '.json', '.md', '.sql', '.gitignore', '.yml', '.yaml']);
const ignoredDirs = new Set(['.git', 'runtime', 'node_modules']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
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

const changed = [];
for (const file of walk(root)) {
  const content = fs.readFileSync(file, 'utf8');
  const normalized = content.replace(/\r\n/g, '\n');
  const formatted = normalized.endsWith('\n') ? normalized : `${normalized}\n`;

  if (formatted !== content) {
    changed.push(path.relative(root, file));
    if (!checkOnly) fs.writeFileSync(file, formatted, 'utf8');
  }
}

if (checkOnly && changed.length > 0) {
  process.stderr.write(`format check failed; run npm run format:\n${changed.join('\n')}\n`);
  process.exit(1);
}

console.log(checkOnly ? 'format: check ok' : 'format: ok');
