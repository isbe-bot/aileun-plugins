import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const cli = path.join(root, 'bin', 'pluginctl.js');

function run(runtime, args, expectStatus = 0) {
  const res = spawnSync('node', [cli, ...args], {
    cwd: root,
    env: { ...process.env, AILEUN_PLUGINS_RUNTIME: runtime },
    encoding: 'utf8',
  });

  assert.equal(res.status, expectStatus, `pluginctl ${args.join(' ')} failed: ${res.stderr}`);
  return res;
}

test('CLI lifecycle: init -> add -> status/list/show/validate -> reject invalid', () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'aileun-plugins-cli-test-'));
  const runtime = path.join(tmpBase, 'runtime');

  try {
    const init = run(runtime, ['init', '--json']);
    const initObj = JSON.parse(init.stdout);
    assert.equal(initObj.ok, true);

    const add = run(runtime, ['add', '--manifest', 'testdata/plugin-valid.json', '--json']);
    const addObj = JSON.parse(add.stdout);
    assert.equal(addObj.result.plugin_id, 'engram.openclaw');

    const status = run(runtime, ['status', '--json']);
    const statusObj = JSON.parse(status.stdout);
    assert.equal(statusObj.stats.total_plugins, 1);

    const list = run(runtime, ['list', '--json']);
    const listObj = JSON.parse(list.stdout);
    assert.equal(listObj.count, 1);

    const show = run(runtime, ['show', 'engram.openclaw', '--json']);
    const showObj = JSON.parse(show.stdout);
    assert.equal(showObj.plugin.plugin_id, 'engram.openclaw');

    const validatePlugin = run(runtime, ['validate', 'engram.openclaw', '--json']);
    assert.equal(JSON.parse(validatePlugin.stdout).valid, true);

    const validateFile = run(runtime, ['validate', 'testdata/plugin-valid.json', '--json']);
    assert.equal(JSON.parse(validateFile.stdout).valid, true);

    const invalid = run(runtime, ['validate', 'testdata/plugin-invalid.json', '--json'], 2);
    const invalidObj = JSON.parse(invalid.stderr);
    assert.equal(invalidObj.ok, false);
    assert.ok(Array.isArray(invalidObj.errors));
  } finally {
    fs.rmSync(tmpBase, { recursive: true, force: true });
  }
});
