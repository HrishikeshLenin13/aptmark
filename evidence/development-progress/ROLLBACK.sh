#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LIVE="$BASE/../../package.json"
[ "$#" -eq 1 ] || exit 2
TARGET=$1
if [ ! -f "$TARGET" ] || [ -L "$TARGET" ] || [ "$TARGET" -ef "$LIVE" ]; then echo 'Use a disposable package-manifest copy.' >&2; exit 2; fi
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "536304d2919830cd6233d89a0a51a742740594f93e1ab68a656acc744cc0da11" ] || exit 3
[ "$(shasum -a 256 "$BASE/package.original.txt" | awk '{print $1}')" = "9d0ab9c3e6339bac540d59f624f49da40a78a3844e4547a9084654c80b82bfaf" ] || exit 4
cp "$BASE/package.original.txt" "$TARGET"
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "9d0ab9c3e6339bac540d59f624f49da40a78a3844e4547a9084654c80b82bfaf" ] || exit 5
printf 'restored_sha256=%s\n' '9d0ab9c3e6339bac540d59f624f49da40a78a3844e4547a9084654c80b82bfaf'
