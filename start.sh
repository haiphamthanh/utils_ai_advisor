#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp ".env.example" ".env"
  echo "Created .env from .env.example"
fi

echo "Installing dependencies..."
npm install

export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-3456}"

if [ -f ".env" ]; then
  exec node --env-file=.env src/server.js
fi

exec node src/server.js
