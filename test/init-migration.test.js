import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadConfig } from '../src/config.js';
import { ensureRuntimeDirs, openDatabase, applyMigrations } from '../src/db.js';

const root = process.cwd();
const migrationsDir = path.join(root, 'migrations');

test('init creates runtime dirs and applies migrations idempotently', () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'aileun-plugins-test-'));
  const config = loadConfig({ runtimeDir: path.join(tmpBase, 'runtime') });

  ensureRuntimeDirs(config);
  assert.equal(fs.existsSync(config.availableDir), true);
  assert.equal(fs.existsSync(config.manifestsDir), true);
  assert.equal(fs.existsSync(config.healthDir), true);

  const db = openDatabase(config.dbPath);

  const first = applyMigrations(db, migrationsDir);
  assert.ok(first.appliedNow >= 1);

  const second = applyMigrations(db, migrationsDir);
  assert.equal(second.appliedNow, 0);

  const requiredTables = [
    'plugins',
    'plugin_versions',
    'plugin_manifests',
    'plugin_installations',
    'plugin_enablements',
    'plugin_permissions',
    'plugin_config_requirements',
    'plugin_tool_contracts',
    'plugin_consumers',
    'plugin_health_snapshots',
    'plugin_events',
  ];

  for (const tableName of requiredTables) {
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(tableName);
    assert.equal(table.name, tableName);
  }

  db.close();
  fs.rmSync(tmpBase, { recursive: true, force: true });
});
