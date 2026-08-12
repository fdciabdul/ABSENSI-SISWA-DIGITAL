#!/bin/sh
set -e

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

# Wait until the database accepts TCP connections (works for both an
# external DB and the optional `mysql` compose service).
echo "==> Waiting for database at ${DB_HOST}:${DB_PORT}..."
TRIES=0
until node -e "
const net = require('net')
const s = net.connect(${DB_PORT}, '${DB_HOST}', () => { s.end(); process.exit(0) })
s.on('error', () => process.exit(1))
setTimeout(() => process.exit(1), 3000)
"; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge 60 ]; then
    echo "==> Database not reachable after 120s, giving up."
    exit 1
  fi
  sleep 2
done

echo "==> Running database migrations..."
node ace.js migration:run --force

# Seed only on first boot. The marker lives on a named volume, so seeding
# happens exactly once for the lifetime of that volume.
SEED_MARKER=/app/data/.db_seeded
if [ ! -f "$SEED_MARKER" ]; then
  echo "==> First boot detected, seeding database..."
  node ace.js db:seed --files=database/seeders/main_seeder.js
  touch "$SEED_MARKER"
else
  echo "==> Database already seeded, skipping."
fi

echo "==> Starting server..."
exec node bin/server.js
