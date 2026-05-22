#!/usr/bin/env bash
# Run the equivalent of .github/workflows/e2e.yml locally.
# Saves CI iteration cost by failing fast on the developer's
# machine instead of after a push.
#
# Requires:
#   - dependencies installed (npm ci)
#   - Playwright browsers installed (npx playwright install --with-deps chromium)
#   - .env.local with POCKETBASE_ADMIN_EMAIL/PASSWORD and SEED_USER_* set
#
# Uses a dedicated pb_data_ci directory so the dev PocketBase
# (pocketbase/pb_data) is not stomped on. The directory is cleaned
# up on exit.

set -euo pipefail

DATA_DIR="pocketbase/pb_data_ci"
PB_LOG="pocketbase-ci.log"
NEXT_LOG="nextjs-ci.log"

cleanup() {
  echo "--- Cleanup ---"
  [[ -n "${PB_PID:-}" ]] && kill "$PB_PID" 2>/dev/null || true
  [[ -n "${NEXT_PID:-}" ]] && kill "$NEXT_PID" 2>/dev/null || true
  rm -rf "$DATA_DIR"
  echo "Stopped background processes and removed $DATA_DIR."
}
trap cleanup EXIT

if [[ -f .env.local ]]; then
  echo "--- Loading env from .env.local ---"
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

: "${POCKETBASE_URL:=http://127.0.0.1:8090}"
: "${POCKETBASE_ADMIN_EMAIL:?POCKETBASE_ADMIN_EMAIL must be set in .env.local}"
: "${POCKETBASE_ADMIN_PASSWORD:?POCKETBASE_ADMIN_PASSWORD must be set in .env.local}"
: "${SEED_USER_EMAIL:?SEED_USER_EMAIL must be set in .env.local}"
: "${SEED_USER_PASSWORD:?SEED_USER_PASSWORD must be set in .env.local}"
: "${E2E_BASE_URL:=http://127.0.0.1:3000}"

export POCKETBASE_URL POCKETBASE_ADMIN_EMAIL POCKETBASE_ADMIN_PASSWORD
export SEED_USER_EMAIL SEED_USER_PASSWORD E2E_BASE_URL

echo "--- Installing PocketBase (idempotent) ---"
bash scripts/install-pocketbase.sh

echo "--- Initializing fresh PocketBase data dir at $DATA_DIR ---"
rm -rf "$DATA_DIR"
./pocketbase/pocketbase --dir "$DATA_DIR" migrate up
./pocketbase/pocketbase --dir "$DATA_DIR" superuser upsert "$POCKETBASE_ADMIN_EMAIL" "$POCKETBASE_ADMIN_PASSWORD"

echo "--- Spawning PocketBase ---"
./pocketbase/pocketbase --dir "$DATA_DIR" serve --http=127.0.0.1:8090 > "$PB_LOG" 2>&1 &
PB_PID=$!

echo "--- Waiting for PocketBase on 127.0.0.1:8090 ---"
for i in $(seq 1 30); do
  if nc -z 127.0.0.1 8090; then
    echo "PocketBase ready after ${i}s."
    break
  fi
  sleep 1
done
if ! nc -z 127.0.0.1 8090; then
  echo "PocketBase did not start within 30s. Tail of $PB_LOG:"
  tail -20 "$PB_LOG"
  exit 1
fi

echo "--- Seeding test user ---"
npm run seed

echo "--- Building Next.js ---"
npm run build

echo "--- Starting Next.js on port 3000 ---"
npm run start -- --port 3000 > "$NEXT_LOG" 2>&1 &
NEXT_PID=$!

echo "--- Waiting for Next.js on 127.0.0.1:3000 ---"
for i in $(seq 1 60); do
  if nc -z 127.0.0.1 3000; then
    echo "Next.js ready after ${i}s."
    break
  fi
  sleep 1
done
if ! nc -z 127.0.0.1 3000; then
  echo "Next.js did not start within 60s. Tail of $NEXT_LOG:"
  tail -20 "$NEXT_LOG"
  exit 1
fi

echo "--- Running Playwright tests ---"
npx playwright test

echo "--- Done. ---"
