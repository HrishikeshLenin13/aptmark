#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd -P)
TARGET=${1:?Pass a disposable copy of english_methods.py}
if [ "$TARGET" -ef "$ROOT/python/english_methods.py" ] || [ -L "$TARGET" ]; then
  echo 'Use a disposable regular copy, not the live registry or a link.' >&2; exit 2
fi
ACTUAL=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$ACTUAL" = "4d62b0c5f381065d0e820071a44f87f2b6a8ecb2181e878e2d1487f746c5f172" ] || { echo 'Target differs from the recorded modified registry.' >&2; exit 3; }
cp "$ROOT/evidence/english-precision/english_methods.original.txt" "$TARGET"
RESTORED=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$RESTORED" = "25524b4ed31dc685d279706b0a01b55cc3c223953c2fab4af12382111f0e212c" ]
printf 'restored_sha256=%s\n' "$RESTORED"
