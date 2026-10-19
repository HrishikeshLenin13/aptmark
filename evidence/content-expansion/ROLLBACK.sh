#!/bin/sh
set -eu
base=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
target=${1:-"$base/../../python/pipeline.py"}
original="$base/pipeline.original.py"
[ -f "$target" ] || { echo 'rollback: target missing' >&2; exit 2; }
actual=$(shasum -a 256 "$target" | awk '{print $1}')
[ "$actual" = "b87830c27a943a7353826a42de930d38afa49cf8eac6f033a1d4b8310957d553" ] || { echo 'rollback: target hash mismatch; left unchanged' >&2; exit 3; }
[ "$(shasum -a 256 "$original" | awk '{print $1}')" = "d7e378f801bd8904b65cc23fcaf7c0930714a804adb54d114b4d8ce95bfe6280" ] || { echo 'rollback: snapshot hash mismatch' >&2; exit 4; }
cp "$original" "$target"
printf 'rollback: pipeline original restored\nrestored sha256: %s\n' "$(shasum -a 256 "$target" | awk '{print $1}')"
