#!/usr/bin/env bash
set -euo pipefail

UPDATES_PATH="${1:-/home/dataentry/Software/Database Software/updates}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RELEASE_ROOT="$REPO_ROOT/release"

if [[ ! -d "$RELEASE_ROOT" ]]; then
  echo "Release folder not found: $RELEASE_ROOT" >&2
  exit 1
fi

LATEST_RELEASE="$(ls -1dt "$RELEASE_ROOT"/*/ 2>/dev/null | head -n 1 || true)"
if [[ -z "$LATEST_RELEASE" ]]; then
  echo "No release folder found in: $RELEASE_ROOT" >&2
  exit 1
fi

LATEST_PATH="${LATEST_RELEASE%/}"

mkdir -p "$UPDATES_PATH"

shopt -s nullglob
FILES=( "$LATEST_PATH"/*.yml "$LATEST_PATH"/*.exe "$LATEST_PATH"/*.blockmap )
shopt -u nullglob

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No update files found in: $LATEST_PATH" >&2
  exit 1
fi

cp -f "${FILES[@]}" "$UPDATES_PATH"/

echo "Copied update files from: $LATEST_PATH"
echo "To: $UPDATES_PATH"
