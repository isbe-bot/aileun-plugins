import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const cli = path.join(root, 'bin', 'pluginctl.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aileun-plugins-smoke-'));
const runtime = path.join(tmp, 'runtime');

function run(args, expect = 0) {
  const res = spawnSync('node', [cli, ...args], {
    cwd: root,
    env: { ...process.env, AILEUN_PLUGINS_RUNTIME: runtime },
    encoding: 'utf8',
  });

  if (res.status !== expect) {
    throw new Error(
      `command failed: pluginctl ${args.join(' ')}\nstatus=${res.status}\nstdout=${res.stdout}\nstderr=${res.stderr}`,
    );
  }

  return res;
}

try {
  run(['init', '--json']);
  run(['add', '--manifest', 'testdata/plugin-valid.json', '--json']);
  run(['status', '--json']);
  run(['list', '--json']);
  run(['show', 'engram.openclaw', '--json']);
  run(['validate', 'engram.openclaw', '--json']);
  run(['validate', 'testdata/plugin-valid.json', '--json']);
  run(['validate', 'testdata/plugin-invalid.json', '--json'], 2);
  console.log('smoke: ok');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
