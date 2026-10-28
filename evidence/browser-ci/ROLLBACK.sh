#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LIVE="$BASE/../../.github/workflows/core-regression.yml"
[ "$#" -eq 1 ] || exit 2
TARGET=$1
if [ ! -f "$TARGET" ] || [ -L "$TARGET" ] || [ "$TARGET" -ef "$LIVE" ]; then echo 'Pass a disposable workflow copy, not the live workflow.' >&2; exit 2; fi
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "ac829f68a789d8cb4e6745924c8acc63c94a82d9117b90fccb22593af51347a0" ] || exit 3
[ "$(shasum -a 256 "$BASE/core.original.txt" | awk '{print $1}')" = "d9c5fed49029d2a6098a7835edebe160d5f4d86787d0a2bdbde1de5a3a8fc4f3" ] || exit 4
cp "$BASE/core.original.txt" "$TARGET"
printf 'restored_sha256=%s\n' 'd9c5fed49029d2a6098a7835edebe160d5f4d86787d0a2bdbde1de5a3a8fc4f3'
