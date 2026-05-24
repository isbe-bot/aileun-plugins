import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../config.js';
import { printResult, fail } from '../output.js';
import { ensureRuntimeDirs, openDatabase, applyMigrations } from '../db.js';
import {
  addPluginManifest,
  getLatestManifestForPlugin,
  getPlugin,
  getStats,
  listPlugins,
} from '../plugins/store.js';
import { validatePluginManifest } from '../plugins/schema.js';

function parseArgs(argv) {
  const args = [...argv];
  const flags = { json: false };
  const positionals = [];

  while (args.length) {
    const token = args.shift();
    if (token === '--json') {
      flags.json = true;
    } else if (token === '--help' || token === '-h') {
      flags.help = true;
    } else if (token === '--available') {
      flags.available = true;
    } else if (token === '--installed') {
      flags.installed = true;
    } else if (token === '--enabled') {
      flags.enabled = true;
    } else if (token === '--manifest') {
      flags.manifest = args.shift();
    } else {
      positionals.push(token);
    }
  }

  return { flags, positionals };
}

function migrationsDirFromHere() {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../migrations');
}

function ensureDb(config) {
  ensureRuntimeDirs(config);
  const db = openDatabase(config.dbPath);
  const migrationResult = applyMigrations(db, migrationsDirFromHere());
  return { db, migrationResult };
}

function usage() {
  return [
    'pluginctl init [--json]',
    'pluginctl status [--json]',
    'pluginctl list [--available|--installed|--enabled] [--json]',
    'pluginctl show <plugin_id> [--json]',
    'pluginctl add --manifest <manifest.json> [--json]',
    'pluginctl validate <plugin_id|manifest.json> [--json]',
  ].join('\n');
}

function formatValidationErrors(errors) {
  return errors.map((e) => `${e.path}: ${e.message}`).join('\n');
}

export async function main(argv) {
  const { flags, positionals } = parseArgs(argv);
  const command = positionals[0];

  if (flags.help || command === 'help') {
    printResult(usage());
    return;
  }

  if (!command) {
    fail(`missing command\n${usage()}`, 2, flags.json);
  }

  const config = loadConfig();

  if (command === 'init') {
    const { db, migrationResult } = ensureDb(config);
    db.close();

    printResult(
      {
        ok: true,
        command: 'init',
        runtime_dir: config.runtimeDir,
        db_path: config.dbPath,
        migrations: migrationResult,
      },
      flags.json,
    );
    return;
  }

  const { db } = ensureDb(config);

  if (command === 'status') {
    const migrations = db.prepare('SELECT COUNT(1) AS c FROM schema_migrations').get().c;
    const stats = getStats(db);

    printResult(
      {
        ok: true,
        command: 'status',
        runtime_dir: config.runtimeDir,
        db_path: config.dbPath,
        schema_migrations: migrations,
        stats,
      },
      flags.json,
    );

    db.close();
    return;
  }

  if (command === 'list') {
    const plugins = listPlugins(db, {
      available: flags.available,
      installed: flags.installed,
      enabled: flags.enabled,
    });

    if (flags.json) {
      printResult(
        {
          ok: true,
          command: 'list',
          count: plugins.length,
          plugins,
        },
        true,
      );
    } else if (plugins.length === 0) {
      printResult('No plugins registered. Use pluginctl add --manifest <file>.');
    } else {
      for (const plugin of plugins) {
        printResult(
          `${plugin.plugin_id}\t${plugin.current_version}\t${plugin.installed ? 'installed' : 'not-installed'}\t${plugin.enabled ? 'enabled' : 'disabled'}\t${plugin.name}`,
        );
      }
    }

    db.close();
    return;
  }

  if (command === 'show') {
    const pluginId = positionals[1];
    if (!pluginId) fail('show requires <plugin_id>', 2, flags.json);

    const plugin = getPlugin(db, pluginId);
    if (!plugin) fail(`plugin not found: ${pluginId}`, 3, flags.json);

    if (flags.json) {
      printResult({ ok: true, command: 'show', plugin }, true);
    } else {
      printResult(`plugin_id: ${plugin.plugin_id}`);
      printResult(`name: ${plugin.name}`);
      printResult(`version: ${plugin.current_version}`);
      printResult(`source: ${plugin.source_type} ${plugin.source_uri}`);
      printResult(`required_permissions: ${plugin.required_permissions.join(', ') || '(none)'}`);
      printResult(`tools: ${plugin.tools.join(', ') || '(none)'}`);
      printResult(`config_requirements: ${plugin.requirements.filter((r) => r.requirement_type === 'config').map((r) => r.requirement_key).join(', ') || '(none)'}`);
      printResult(`secret_requirements: ${plugin.requirements.filter((r) => r.requirement_type === 'secret').map((r) => r.requirement_key).join(', ') || '(none)'}`);
      if (plugin.manifest) {
        printResult(`manifest_hash: ${plugin.manifest.hash_sha256}`);
      }
    }

    db.close();
    return;
  }

  if (command === 'add') {
    if (!flags.manifest) fail('add requires --manifest <manifest.json>', 2, flags.json);
    const manifestPath = path.resolve(process.cwd(), flags.manifest);
    if (!fs.existsSync(manifestPath)) fail(`manifest not found: ${manifestPath}`, 2, flags.json);

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      fail(`invalid JSON file: ${error.message}`, 2, flags.json);
    }

    const validation = validatePluginManifest(parsed);
    if (!validation.ok) {
      fail(
        `plugin manifest failed validation\n${formatValidationErrors(validation.errors)}`,
        2,
        flags.json,
        { errors: validation.errors },
      );
    }

    const result = addPluginManifest(db, validation.manifest, manifestPath, config);
    printResult(
      {
        ok: true,
        command: 'add',
        result,
      },
      flags.json,
    );

    db.close();
    return;
  }

  if (command === 'validate') {
    const target = positionals[1];
    if (!target) fail('validate requires <plugin_id|manifest.json>', 2, flags.json);

    let payload;
    const asPath = path.resolve(process.cwd(), target);
    if (fs.existsSync(asPath)) {
      try {
        payload = JSON.parse(fs.readFileSync(asPath, 'utf8'));
      } catch (error) {
        fail(`invalid JSON file: ${error.message}`, 2, flags.json);
      }
    } else {
      payload = getLatestManifestForPlugin(db, target);
      if (!payload) fail(`plugin not found and not a file path: ${target}`, 3, flags.json);
    }

    const validation = validatePluginManifest(payload);
    if (!validation.ok) {
      fail(
        `plugin manifest failed validation\n${formatValidationErrors(validation.errors)}`,
        2,
        flags.json,
        { errors: validation.errors },
      );
    }

    printResult(
      {
        ok: true,
        command: 'validate',
        valid: true,
        plugin_id: validation.manifest.plugin_id,
      },
      flags.json,
    );

    db.close();
    return;
  }

  db.close();
  fail(`unknown command: ${command}\n${usage()}`, 2, flags.json);
}
