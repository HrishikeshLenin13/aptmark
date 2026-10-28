#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LIVE="$BASE/../../src/components/aptmark-app.tsx"
[ "$#" -eq 1 ] || exit 2
TARGET=$1
if [ ! -f "$TARGET" ] || [ -L "$TARGET" ] || [ "$TARGET" -ef "$LIVE" ]; then echo 'Use a disposable component copy, not the live workspace.' >&2; exit 2; fi
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "f4ce7a482d3e03abae5e5799ca34e3678448851d01c527cac5e8b72112839e28" ] || exit 3
[ "$(shasum -a 256 "$BASE/aptmark-app.original.txt" | awk '{print $1}')" = "0d94d63a08b693f30b6a488ecb214bcfa3d4bcc5e2cfa7aaf63114b82df41ba8" ] || exit 4
cp "$BASE/aptmark-app.original.txt" "$TARGET"
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "0d94d63a08b693f30b6a488ecb214bcfa3d4bcc5e2cfa7aaf63114b82df41ba8" ] || exit 5
printf 'restored_sha256=%s\n' '0d94d63a08b693f30b6a488ecb214bcfa3d4bcc5e2cfa7aaf63114b82df41ba8'
