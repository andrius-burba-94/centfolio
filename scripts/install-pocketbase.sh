#!/usr/bin/env bash
# Download the PocketBase binary at the version pinned in pocketbase/VERSION.
# Idempotent: skips download if the local binary is already at the pinned version.
# Used by both CI (Linux x86_64) and local dev (Linux/macOS, x86_64/arm64).

set -euo pipefail

VERSION_FILE="pocketbase/VERSION"
BINARY_PATH="pocketbase/pocketbase"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "Missing $VERSION_FILE" >&2
  exit 1
fi

VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"

if [[ -x "$BINARY_PATH" ]]; then
  INSTALLED="$("$BINARY_PATH" --version 2>/dev/null | awk '{print $NF}' || true)"
  if [[ "$INSTALLED" == "v$VERSION" || "$INSTALLED" == "$VERSION" ]]; then
    echo "PocketBase $VERSION already installed at $BINARY_PATH."
    exit 0
  fi
fi

case "$(uname -s)" in
  Linux*)  OS="linux" ;;
  Darwin*) OS="darwin" ;;
  *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac

case "$(uname -m)" in
  x86_64|amd64)  ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported arch: $(uname -m)" >&2; exit 1 ;;
esac

ARCHIVE="pocketbase_${VERSION}_${OS}_${ARCH}.zip"
RELEASE_URL="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading PocketBase $VERSION for $OS/$ARCH..."
curl -fsSL -o "$TMPDIR/$ARCHIVE" "$RELEASE_URL/$ARCHIVE"

echo "Verifying SHA256 checksum..."
curl -fsSL -o "$TMPDIR/checksums.txt" "$RELEASE_URL/checksums.txt"
EXPECTED="$(grep " $ARCHIVE\$" "$TMPDIR/checksums.txt" || true)"
if [[ -z "$EXPECTED" ]]; then
  echo "Archive $ARCHIVE not found in checksums.txt" >&2
  exit 1
fi
( cd "$TMPDIR" && echo "$EXPECTED" | sha256sum -c - )

echo "Extracting..."
unzip -o -q "$TMPDIR/$ARCHIVE" -d "$TMPDIR/extract"

mkdir -p pocketbase
mv "$TMPDIR/extract/pocketbase" "$BINARY_PATH"
chmod +x "$BINARY_PATH"

echo "Installed PocketBase $VERSION at $BINARY_PATH."
