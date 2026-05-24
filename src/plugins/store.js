import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function nowIso() {
  return new Date().toISOString();
}

function hashManifest(manifest) {
  return crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}

export function addPluginManifest(db, manifest, sourcePath, runtimePaths) {
  const createdAt = nowIso();
  const manifestJson = JSON.stringify(manifest);
  const manifestHash = hashManifest(manifest);
  const existingVersion = db
    .prepare('SELECT 1 FROM plugin_versions WHERE plugin_id = ? AND version = ?')
    .get(manifest.plugin_id, manifest.version);

  if (existingVersion) {
    throw new Error(`plugin version already exists: ${manifest.plugin_id}@${manifest.version}`);
  }

  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO plugins (
        plugin_id, name, description, current_version, source_type, source_uri, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(plugin_id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        current_version = excluded.current_version,
        source_type = excluded.source_type,
        source_uri = excluded.source_uri,
        updated_at = excluded.updated_at`,
    ).run(
      manifest.plugin_id,
      manifest.name,
      manifest.description,
      manifest.version,
      manifest.source.type,
      manifest.source.uri,
      createdAt,
      createdAt,
    );

    db.prepare(
      `INSERT INTO plugin_versions (
        plugin_id, version, source_type, source_uri, checksum_sha256, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      manifest.plugin_id,
      manifest.version,
      manifest.source.type,
      manifest.source.uri,
      manifestHash,
      createdAt,
    );

    db.prepare(
      `INSERT INTO plugin_manifests (
        plugin_id, version, manifest_json, manifest_hash_sha256, source_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(manifest.plugin_id, manifest.version, manifestJson, manifestHash, sourcePath, createdAt);

    db.prepare('DELETE FROM plugin_permissions WHERE plugin_id = ?').run(manifest.plugin_id);
    for (const permission of manifest.required_permissions) {
      db.prepare(
        `INSERT INTO plugin_permissions (
          plugin_id, permission_key, risk_level, required, created_at
        ) VALUES (?, ?, 'normal', 1, ?)`,
      ).run(manifest.plugin_id, permission, createdAt);
    }

    db.prepare('DELETE FROM plugin_config_requirements WHERE plugin_id = ?').run(manifest.plugin_id);
    for (const key of manifest.required_config) {
      db.prepare(
        `INSERT INTO plugin_config_requirements (
          plugin_id, requirement_type, requirement_key, status, created_at
        ) VALUES (?, 'config', ?, 'missing', ?)`,
      ).run(manifest.plugin_id, key, createdAt);
    }

    for (const key of manifest.required_secrets) {
      db.prepare(
        `INSERT INTO plugin_config_requirements (
          plugin_id, requirement_type, requirement_key, status, created_at
        ) VALUES (?, 'secret', ?, 'missing', ?)`,
      ).run(manifest.plugin_id, key, createdAt);
    }

    db.prepare('DELETE FROM plugin_tool_contracts WHERE plugin_id = ?').run(manifest.plugin_id);
    for (const tool of manifest.tools) {
      db.prepare(
        `INSERT INTO plugin_tool_contracts (
          plugin_id, tool_name, contract_json, created_at
        ) VALUES (?, ?, ?, ?)`,
      ).run(manifest.plugin_id, tool, JSON.stringify({ provided_by: manifest.plugin_id }), createdAt);
    }

    db.prepare(
      `INSERT INTO plugin_events (
        event_id, resource_type, resource_id, action, actor_id, actor_type,
        reason, before_hash, after_hash, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      `evt_${crypto.randomUUID().replace(/-/g, '')}`,
      'plugin',
      manifest.plugin_id,
      'manifest_registered',
      'pluginctl',
      'service',
      'phase1_add',
      null,
      manifestHash,
      JSON.stringify({ version: manifest.version }),
      createdAt,
    );

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  const manifestFile = path.join(runtimePaths.manifestsDir, `${manifest.plugin_id}@${manifest.version}.json`);
  const availableFile = path.join(runtimePaths.availableDir, `${manifest.plugin_id}.json`);

  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(availableFile, JSON.stringify(manifest, null, 2));

  return {
    plugin_id: manifest.plugin_id,
    version: manifest.version,
    manifest_hash: manifestHash,
    manifest_file: manifestFile,
  };
}

export function listPlugins(db, filters = {}) {
  const where = [];
  if (filters.installed) where.push('EXISTS (SELECT 1 FROM plugin_installations i WHERE i.plugin_id = p.plugin_id)');
  if (filters.enabled)
    where.push('EXISTS (SELECT 1 FROM plugin_enablements e WHERE e.plugin_id = p.plugin_id AND e.enabled = 1)');

  const sql = `
    SELECT
      p.plugin_id,
      p.name,
      p.current_version,
      p.source_type,
      p.updated_at,
      EXISTS (SELECT 1 FROM plugin_installations i WHERE i.plugin_id = p.plugin_id) AS installed,
      EXISTS (SELECT 1 FROM plugin_enablements e WHERE e.plugin_id = p.plugin_id AND e.enabled = 1) AS enabled
    FROM plugins p
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY p.plugin_id ASC
  `;

  return db.prepare(sql).all().map((row) => ({
    ...row,
    installed: Boolean(row.installed),
    enabled: Boolean(row.enabled),
  }));
}

export function getPlugin(db, pluginId) {
  const plugin = db
    .prepare(
      `SELECT plugin_id, name, description, current_version, source_type, source_uri, created_at, updated_at
       FROM plugins WHERE plugin_id = ?`,
    )
    .get(pluginId);
  if (!plugin) return null;

  const permissions = db
    .prepare('SELECT permission_key FROM plugin_permissions WHERE plugin_id = ? ORDER BY permission_key')
    .all(pluginId)
    .map((row) => row.permission_key);

  const tools = db
    .prepare('SELECT tool_name FROM plugin_tool_contracts WHERE plugin_id = ? ORDER BY tool_name')
    .all(pluginId)
    .map((row) => row.tool_name);

  const requirements = db
    .prepare(
      `SELECT requirement_type, requirement_key, status
       FROM plugin_config_requirements
       WHERE plugin_id = ?
       ORDER BY requirement_type, requirement_key`,
    )
    .all(pluginId);

  const latestManifest = db
    .prepare(
      `SELECT version, manifest_json, manifest_hash_sha256, created_at
       FROM plugin_manifests
       WHERE plugin_id = ?
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get(pluginId);

  return {
    ...plugin,
    required_permissions: permissions,
    tools,
    requirements,
    manifest: latestManifest
      ? {
          version: latestManifest.version,
          hash_sha256: latestManifest.manifest_hash_sha256,
          created_at: latestManifest.created_at,
          payload: JSON.parse(latestManifest.manifest_json),
        }
      : null,
  };
}

export function getStats(db) {
  const totalPlugins = db.prepare('SELECT COUNT(1) AS c FROM plugins').get().c;
  const totalVersions = db.prepare('SELECT COUNT(1) AS c FROM plugin_versions').get().c;
  const totalManifests = db.prepare('SELECT COUNT(1) AS c FROM plugin_manifests').get().c;

  return {
    total_plugins: totalPlugins,
    total_versions: totalVersions,
    total_manifests: totalManifests,
  };
}

export function getLatestManifestForPlugin(db, pluginId) {
  const row = db
    .prepare(
      `SELECT manifest_json
       FROM plugin_manifests
       WHERE plugin_id = ?
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get(pluginId);

  return row ? JSON.parse(row.manifest_json) : null;
}
