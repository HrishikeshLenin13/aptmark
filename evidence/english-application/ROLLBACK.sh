#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$BASE/../.." && pwd)
LIVE="$ROOT/content/bank.json"
[ "$#" -eq 1 ] || exit 2
TARGET=$1
if [ ! -f "$TARGET" ] || [ -L "$TARGET" ] || [ "$TARGET" -ef "$LIVE" ]; then echo 'Use a disposable bank copy.' >&2; exit 2; fi
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "26999a03ad1d3e87a8d33d5e31e2e05cfe01527bc1510326458d2e765a25ff70" ] || exit 3
ORIGINAL="$ROOT/data/english-application/bank.original.json"
TMP=""
trap '[ -z "$TMP" ] || rm -f "$TMP"' EXIT
if [ ! -f "$ORIGINAL" ]; then
  TMP=$(mktemp)
  git -C "$ROOT" show 23382ec3ce6c3e0508a8dac0c78db658db21880f:content/bank.json > "$TMP"
  ORIGINAL="$TMP"
fi
[ "$(shasum -a 256 "$ORIGINAL" | awk '{print $1}')" = "12904d182d3bfebb645140d727e737555de3f211f6a6a3820ba11e39130f8105" ] || exit 4
cp "$ORIGINAL" "$TARGET"
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "12904d182d3bfebb645140d727e737555de3f211f6a6a3820ba11e39130f8105" ] || exit 5
printf 'restored_sha256=%s\n' '12904d182d3bfebb645140d727e737555de3f211f6a6a3820ba11e39130f8105'
