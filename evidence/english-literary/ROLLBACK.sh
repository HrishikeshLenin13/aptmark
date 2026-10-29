#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$BASE/../.." && pwd)
LIVE="$ROOT/content/bank.json"
[ "$#" -eq 1 ] || exit 2
TARGET=$1
if [ ! -f "$TARGET" ] || [ -L "$TARGET" ] || [ "$TARGET" -ef "$LIVE" ]; then echo 'Use a disposable bank copy.' >&2; exit 2; fi
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "9880ce5a1daf70314182c0b8f54924fc076ad4ffbadaf66820eba3d10f70685e" ] || exit 3
ORIGINAL="$ROOT/data/english-literary/bank.original.json"
TMP=""
trap '[ -z "$TMP" ] || rm -f "$TMP"' EXIT
if [ ! -f "$ORIGINAL" ]; then
  TMP=$(mktemp)
  git -C "$ROOT" show 3c0ecab6e85b34160ce7ff1a3e0b9bb51e08f88a:content/bank.json > "$TMP"
  ORIGINAL="$TMP"
fi
[ "$(shasum -a 256 "$ORIGINAL" | awk '{print $1}')" = "26999a03ad1d3e87a8d33d5e31e2e05cfe01527bc1510326458d2e765a25ff70" ] || exit 4
cp "$ORIGINAL" "$TARGET"
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "26999a03ad1d3e87a8d33d5e31e2e05cfe01527bc1510326458d2e765a25ff70" ] || exit 5
printf 'restored_sha256=%s\n' '26999a03ad1d3e87a8d33d5e31e2e05cfe01527bc1510326458d2e765a25ff70'
