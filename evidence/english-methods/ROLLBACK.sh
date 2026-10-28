#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TARGET=${1:?Pass a disposable copy of pipeline.py}
[ "$TARGET" != "$ROOT/python/pipeline.py" ] || { echo 'Use a disposable copy, not the active generator.' >&2; exit 2; }
ACTUAL=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$ACTUAL" = "a0a73d4efe37db4f87ffbde423f91fd182b245d778bbbebf12015dba87dd9e07" ] || { echo 'Target hash differs from this recorded modified version.' >&2; exit 3; }
cp "$ROOT/evidence/english-methods/pipeline.original.py" "$TARGET"
RESTORED=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$RESTORED" = "b87830c27a943a7353826a42de930d38afa49cf8eac6f033a1d4b8310957d553" ]
printf 'restored_sha256=%s\n' "$RESTORED"
