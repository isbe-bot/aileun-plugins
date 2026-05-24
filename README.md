# AILEUN Plugins

> Local-first plugin manifest ledger for AI/VPS extension governance.

AILEUN Plugins is part of the AILEUN local resource management suite: small, auditable tools that sit between OpenClaw, Mission Control, and a VPS runtime.

## Why it exists

Make technical extensions, tool contracts, config requirements, secret requirements, and plugin health auditable before skills or agents depend on them.

The design is deliberately local-first:

- **SQLite is the operational ledger** for state, history, and relationships.
- **Canonical files stay portable** for humans, backups, Git, and Mission Control.
- **CLI output can be JSON** so OpenClaw and automation can call it safely.
- **No fake telemetry**: reports come from real local state.
- **No hidden external service dependency**: Phase 1 runs with Node.js 22 and built-in `node:sqlite`.

## Current status

This repository is a **Phase 1 baseline**. It is useful for local VPS bootstrap, validation, and ledger inspection, but the daemon/API/systemd/OpenClaw-plugin phases are intentionally still ahead.

Safety note: **Phase 1 records required secret names only. It never stores secret values.**

## Requirements

- Linux/macOS VPS or workstation
- Node.js `>=22.0.0`
- No npm dependencies required in Phase 1

`node:sqlite` is still marked experimental by Node.js, so commands may print an experimental warning on stderr. The test suite accounts for that.

## Install from source

```bash
git clone https://github.com/isbe-bot/aileun-plugins.git
cd aileun-plugins
npm test
npm run build
```

Optional local symlink:

```bash
mkdir -p ~/.local/bin
ln -sf "$PWD/bin/pluginctl.js" ~/.local/bin/pluginctl
pluginctl --help
```

## VPS runtime layout

By default, runtime data is written to `./runtime` inside the repo for development. For VPS deployment, point the runtime at `/srv/aileun`: 

```bash
export AILEUN_PLUGINS_RUNTIME=/srv/aileun/runtime/plugins
node bin/pluginctl.js init --json
```

Runtime data is intentionally ignored by Git. Back it up separately.

## CLI commands

- `init`
- `status`
- `list`
- `show <plugin_id>`
- `add --manifest <manifest.json>`
- `validate <plugin_id|manifest.json>`

Every operational command supports `--json` for automation. Human-readable output is the default.

## Quickstart

```bash
npm run format
npm test
npm run build
npm run smoke
```

Try the CLI:

```bash
node bin/pluginctl.js init --json
node bin/pluginctl.js add --manifest testdata/plugin-valid.json --json
node bin/pluginctl.js status --json
node bin/pluginctl.js list --json
node bin/pluginctl.js show engram.openclaw --json
node bin/pluginctl.js validate engram.openclaw --json
```

## SQLite ledger tables

Phase 1 creates the baseline tables needed for future daemon/API and Mission Control integration:

- `plugins`
- `plugin_versions`
- `plugin_manifests`
- `plugin_installations`
- `plugin_enablements`
- `plugin_permissions`
- `plugin_config_requirements`
- `plugin_tool_contracts`
- `plugin_consumers`
- `plugin_health_snapshots`
- `plugin_events`

All schemas are applied through deterministic migrations in `migrations/`.

## Repository map

```text
.
├── bin/                 # executable CLI entrypoint
├── migrations/          # SQLite migrations
├── src/                 # CLI, config, DB, resource logic
├── test/                # node:test coverage
├── testdata/            # valid/invalid fixtures where applicable
├── scripts/             # format/build/smoke gates
├── docs/                # deployment/security/phase docs
└── packaging/           # VPS install helper
```

## Deployment posture

Phase 1 is ready to deploy as a CLI/ledger bootstrap tool on a VPS. It is **not yet** a long-running daemon. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Recommended VPS path:

```text
/opt/aileun/aileun-plugins/        # source checkout
/srv/aileun/runtime/plugins/            # runtime DB/files
/usr/local/bin/pluginctl  # symlink to CLI
```

## Testing and quality gates

```bash
npm run format
npm test
npm run build
npm run smoke
```

CI runs the same gates on GitHub Actions.

## Security model

- Do not commit runtime DBs, `.env`, secrets, private keys, or generated logs.
- Runtime directories are ignored by Git.
- Phase 1 only records metadata/definitions; risky mutating behavior is deferred to later phases with explicit approval/audit design.
- See [`docs/SECURITY.md`](docs/SECURITY.md).

## Roadmap

- Phase 2: install/enable/config/secret status model.
- Phase 3: health checks, consumers, dependency graph.
- Phase 4+: upgrade/rollback, daemon/API, Mission Control reports, OpenClaw plugin, packaging.

## License

MIT. See [`LICENSE`](LICENSE).
