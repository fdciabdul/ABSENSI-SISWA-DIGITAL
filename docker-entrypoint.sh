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

# One-shot database reset: DB_FRESH=true wipes + re-migrates + re-seeds ONCE,
# then a marker makes every following boot behave normally — the env var can
# be left in place without wiping the DB again. To reset the DB again later,
# clear the seed-marker volume (or exec and remove /app/data/.db_fresh_done).
FRESH_MARKER=/app/data/.db_fresh_done
JUST_FRESHED=false
if [ "${DB_FRESH:-false}" = "true" ] && [ ! -f "$FRESH_MARKER" ]; then
  echo "==> DB_FRESH=true (one-shot), dropping all tables and re-migrating from scratch..."
  node ace.js migration:fresh --force
  touch "$FRESH_MARKER"
  JUST_FRESHED=true
else
  echo "==> Running database migrations..."
  node ace.js migration:run --force
fi

# Seed only on first boot or right after a one-shot fresh.
SEED_MARKER=/app/data/.db_seeded
if [ ! -f "$SEED_MARKER" ] || [ "$JUST_FRESHED" = "true" ]; then
  echo "==> Seeding database..."
  node ace.js db:seed --files=database/seeders/main_seeder.js
  touch "$SEED_MARKER"
else
  echo "==> Database already seeded, skipping."
fi

echo "==> Starting server..."
exec node bin/server.js
