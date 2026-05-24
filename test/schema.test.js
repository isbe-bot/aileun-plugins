import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validatePluginManifest } from '../src/plugins/schema.js';

const root = process.cwd();

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

test('validatePluginManifest accepts valid fixture', () => {
  const valid = readJson('testdata/plugin-valid.json');
  const result = validatePluginManifest(valid);

  assert.equal(result.ok, true);
  assert.equal(result.manifest.plugin_id, 'engram.openclaw');
  assert.equal(result.manifest.tools.includes('engram_search'), true);
});

test('validatePluginManifest rejects invalid fixture with actionable errors', () => {
  const invalid = readJson('testdata/plugin-invalid.json');
  const result = validatePluginManifest(invalid);

  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 10);

  const paths = new Set(result.errors.map((e) => e.path));
  assert.ok(paths.has('plugin_id'));
  assert.ok(paths.has('version'));
  assert.ok(paths.has('source.type'));
  assert.ok(paths.has('safe_to_disable'));
});
