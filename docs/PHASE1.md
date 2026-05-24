# Plugins Manager Phase 1 Baseline

## Included

- local-first standalone repository setup
- runtime configuration (`AILEUN_PLUGINS_RUNTIME`, default `./runtime`)
- deterministic SQLite migrations with `schema_migrations`
- baseline plugin ledger tables:
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
- plugin manifest schema validator
- `pluginctl` commands: `init`, `status`, `list`, `show`, `add --manifest`, `validate`
- JSON output support on implemented commands
- test coverage for Phase 1 gates

## Excluded (Phase 2+)

- plugin install/enable/disable workflows and enforcement
- daemon/API (`plugind`)
- systemd, service wiring, and OS-level integration
- remotes/sync and export/import flows
- OpenClaw plugin surface
