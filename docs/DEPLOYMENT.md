# Deployment Guide

This guide deploys `aileun-plugins` as a Phase 1 CLI/SQLite ledger tool on a VPS.

## 1. Clone

```bash
sudo mkdir -p /opt/aileun
sudo chown "$USER":"$USER" /opt/aileun
git clone https://github.com/isbe-bot/aileun-plugins.git /opt/aileun/aileun-plugins
cd /opt/aileun/aileun-plugins
```

For ISBE internal SSH deployments, the equivalent remote is `git@github-isbe:isbe-bot/aileun-plugins.git`.

## 2. Verify

```bash
npm run format
npm test
npm run build
npm run smoke
```

## 3. Prepare runtime directory

```bash
sudo mkdir -p /srv/aileun/runtime/plugins
sudo chown -R "$USER":"$USER" /srv/aileun/runtime/plugins
export AILEUN_PLUGINS_RUNTIME=/srv/aileun/runtime/plugins
node bin/pluginctl.js init --json
```

## 4. Install CLI symlink

```bash
sudo ln -sf /opt/aileun/aileun-plugins/bin/pluginctl.js /usr/local/bin/pluginctl
pluginctl --help
```

## 5. Persist environment

For operators, add this to shell profile or a future `/etc/aileun/aileun-plugins.env` file:

```bash
export AILEUN_PLUGINS_RUNTIME=/srv/aileun/runtime/plugins
```

## Current deployment boundary

Phase 1 is safe to deploy as a CLI/ledger utility. It does not install a daemon, systemd unit, cron entry, OpenClaw plugin, or network listener. Those are roadmap items.

## Backup

Back up the runtime directory, especially the SQLite DB:

```bash
tar -C /srv/aileun/runtime/plugins -czf aileun-plugins-runtime-backup.tgz .
```

## Upgrade

```bash
cd /opt/aileun/aileun-plugins
git pull --ff-only
npm test
export AILEUN_PLUGINS_RUNTIME=/srv/aileun/runtime/plugins
node bin/pluginctl.js init --json
```

`init` is idempotent and applies pending migrations.
