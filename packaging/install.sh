#!/usr/bin/env bash
set -euo pipefail

PREFIX="${PREFIX:-/opt/aileun/aileun-plugins}"
BIN_DIR="${BIN_DIR:-/usr/local/bin}"
RUNTIME="${AILEUN_PLUGINS_RUNTIME:-/srv/aileun/runtime/plugins}"

mkdir -p "$RUNTIME"
node "$PREFIX/bin/pluginctl.js" init --json
ln -sf "$PREFIX/bin/pluginctl.js" "$BIN_DIR/pluginctl"

echo "installed pluginctl -> $BIN_DIR/pluginctl"
echo "runtime: $RUNTIME"
