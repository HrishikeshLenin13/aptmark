#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd -P)
TARGET=${1:?Pass a disposable copy of english_methods.py}
if [ "$TARGET" -ef "$ROOT/python/english_methods.py" ] || [ -L "$TARGET" ]; then
  echo 'Use a disposable regular copy, not the live registry or a link.' >&2; exit 2
fi
ACTUAL=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$ACTUAL" = "25524b4ed31dc685d279706b0a01b55cc3c223953c2fab4af12382111f0e212c" ] || { echo 'Target differs from the recorded modified registry.' >&2; exit 3; }
cp "$ROOT/evidence/english-reasoning/english_methods.original.txt" "$TARGET"
RESTORED=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$RESTORED" = "0eebbdf64279012d51769160dbffe82a0cf735f8540161bab7288c12b360d04a" ]
printf 'restored_sha256=%s\n' "$RESTORED"
