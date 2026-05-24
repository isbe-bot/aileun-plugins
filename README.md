# aileun-plugins

Phase 1 baseline for AILEUN Plugins Manager.

## Scope (Phase 1)

- standalone repo scaffold with local runtime layout
- runtime/config model (`AILEUN_PLUGINS_RUNTIME`)
- SQLite schema migrations for plugin ledger baseline
- plugin manifest schema validator
- `pluginctl` commands:
  - `init`
  - `status`
  - `list`
  - `show <plugin_id>`
  - `add --manifest <manifest.json>`
  - `validate <plugin_id|manifest.json>`
- JSON output (`--json`) for automation
- tests for schema validation, migration/init idempotency, CLI lifecycle

## Runtime defaults

By default runtime data is stored in `./runtime`.
Override with:

```bash
AILEUN_PLUGINS_RUNTIME=/srv/aileun/runtime/plugins node bin/pluginctl.js init
```

Runtime directory model:

```text
runtime/
├── available/
├── installed/
├── enabled/
├── custom/
├── manifests/
├── packages/
├── revisions/
├── exports/
├── audit/
└── health/
```

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

## Out of scope in Phase 1

- install/enable/disable mutations and enforcement policies
- daemon/API (`plugind`) and Mission Control API reports
- systemd packaging and service install
- remotes/sync, import/export backups
- OpenClaw plugin integration
