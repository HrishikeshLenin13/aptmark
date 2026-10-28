#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd -P)
TARGET=${1:?Pass a disposable copy of aptmark-app.tsx}
if [ "$TARGET" -ef "$ROOT/src/components/aptmark-app.tsx" ] || [ -L "$TARGET" ]; then
  echo 'Use a disposable regular copy, not the live component or a link.' >&2; exit 2
fi
ACTUAL=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$ACTUAL" = "187ebd3ea06fb6a6b4d9c52149818ff871fe67c590f94e2ba07c623e00d0f2ab" ] || { echo 'Target differs from this recorded modified component.' >&2; exit 3; }
cp "$ROOT/evidence/editorial-methods/aptmark-app.original.txt" "$TARGET"
RESTORED=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$RESTORED" = "31cff924115896f4c6c0ced738e065be08653e4fe688d3a2108a2f6503fbc7de" ]
printf 'restored_sha256=%s\n' "$RESTORED"
