#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TARGET=${1:?Pass a disposable copy of english_methods.py}
[ "$TARGET" != "$ROOT/python/english_methods.py" ] || { echo 'Use a disposable copy, not the active registry.' >&2; exit 2; }
ACTUAL=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$ACTUAL" = "0eebbdf64279012d51769160dbffe82a0cf735f8540161bab7288c12b360d04a" ] || { echo 'Target differs from this modified registry.' >&2; exit 3; }
cp "$ROOT/evidence/english-depth/english_methods.original.py" "$TARGET"
RESTORED=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$RESTORED" = "6f15df0511282580fd3314ae1269d1c3373e06178ac32239b76586235bf82948" ]
printf 'restored_sha256=%s\n' "$RESTORED"
