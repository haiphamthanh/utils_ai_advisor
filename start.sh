#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-3456}"

exec node src/server.js
