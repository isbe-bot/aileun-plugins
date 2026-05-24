import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function ensureRuntimeDirs(config) {
  const dirs = [
    config.runtimeDir,
    config.availableDir,
    config.installedDir,
    config.enabledDir,
    config.customDir,
    config.manifestsDir,
    config.packagesDir,
    config.revisionsDir,
    config.exportsDir,
    config.auditDir,
    config.healthDir,
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function openDatabase(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode=WAL;');
  db.exec('PRAGMA foreign_keys=ON;');
  return db;
}

export function applyMigrations(db, migrationsDir) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare('SELECT id FROM schema_migrations ORDER BY id').all().map((row) => row.id),
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  let appliedNow = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const now = new Date().toISOString();

    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(file, now);
      db.exec('COMMIT');
      appliedNow += 1;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    appliedNow,
    total: db.prepare('SELECT COUNT(1) AS c FROM schema_migrations').get().c,
  };
}
