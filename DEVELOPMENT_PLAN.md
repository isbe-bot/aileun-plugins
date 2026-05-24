# AILEUN Plugins Manager — Development Plan

Canonical source: `/home/rico/vault/projects/aileun/13-internal-tools/plugins-manager-development-plan-v1.md`.

This repository currently implements **Phase 1 only**.

## Phase 1 deliverables

- repo scaffold and runtime model
- baseline SQLite migration ledger (`schema_migrations` + plugin phase-1 tables)
- plugin manifest validator
- `pluginctl` baseline commands with JSON output
- tests: schema, migration idempotency, CLI lifecycle

## Deferred phases

- **Phase 2:** install/enable/config model and enforcement
- **Phase 3:** health/dependency graph and consumers
- **Phase 4:** upgrade/rollback
- **Phase 5:** daemon/API + reports
- **Phase 6:** OpenClaw plugin and packaging
