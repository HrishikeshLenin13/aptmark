#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LIVE="$BASE/../../src/components/pacing-lab.tsx"
[ "$#" -eq 1 ] || { echo 'Pass a disposable component copy.' >&2; exit 2; }
TARGET=$1
if [ ! -f "$TARGET" ] || [ -L "$TARGET" ] || [ "$TARGET" -ef "$LIVE" ]; then
  echo 'Rollback target must be a regular disposable copy, not the live component.' >&2
  exit 2
fi
actual=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$actual" = "6d8b7edc5a9ac1915fd30dc2bbab843ff7dc2cb8dca9cc965ac50d65529514a3" ] || { echo 'Modified hash mismatch.' >&2; exit 3; }
[ "$(shasum -a 256 "$BASE/pacing-lab.original.txt" | awk '{print $1}')" = "4f8517055a9556a033636fe38256b8c87a17fe3cd0f2353d018a0492c4b65bdf" ] || exit 4
cp "$BASE/pacing-lab.original.txt" "$TARGET"
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "4f8517055a9556a033636fe38256b8c87a17fe3cd0f2353d018a0492c4b65bdf" ] || exit 5
printf 'restored_sha256=%s\n' '4f8517055a9556a033636fe38256b8c87a17fe3cd0f2353d018a0492c4b65bdf'
