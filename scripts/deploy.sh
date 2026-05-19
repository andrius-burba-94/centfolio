#!/usr/bin/env bash
# Deploy script for Centfolio
# Run on the VPS by the GitHub Actions deploy workflow on every push to main.

set -euo pipefail

# Color output for log readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[deploy]${NC} $1"
}

success() {
    echo -e "${GREEN}[deploy]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[deploy]${NC} $1"
}

error() {
    echo -e "${RED}[deploy]${NC} $1"
    exit 1
}

APP_DIR="/var/www/centfolio"
APP_NAME="centfolio"

log "Centfolio deploy starting"
log "Working directory: $APP_DIR"

cd "$APP_DIR" || error "Cannot cd to $APP_DIR"

log "Fetching latest from origin/main"
git fetch origin main
git reset --hard origin/main

log "Installing dependencies (npm ci)"
npm ci --omit=dev=false

log "Building Next.js"
npm run build

log "Restarting PM2 process"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
else
    warn "PM2 process '$APP_NAME' not found, starting fresh"
    pm2 start npm --name "$APP_NAME" -- start
fi

pm2 save > /dev/null

success "Deploy complete"
