#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TARGET=${1:-"$ROOT/src/lib/content-policy.json"}
ORIGINAL="$ROOT/evidence/content-policy.original.json"
EXPECTED_ORIGINAL=$(cat "$ROOT/evidence/policy-original.sha256")
EXPECTED_MODIFIED=$(cat "$ROOT/evidence/policy-modified.sha256")
original_hash=$(shasum -a 256 "$ORIGINAL" | awk '{print $1}')
[ "$original_hash" = "$EXPECTED_ORIGINAL" ] || { printf '%s\n' 'Original integrity check failed.' >&2; exit 2; }
current_hash=$(shasum -a 256 "$TARGET" | awk '{print $1}')
[ "$current_hash" = "$EXPECTED_MODIFIED" ] || [ "$current_hash" = "$EXPECTED_ORIGINAL" ] || { printf '%s\n' 'Target differs from the recorded policy; no files changed.' >&2; exit 3; }
cp "$ORIGINAL" "$TARGET"
node "$ROOT/scripts/check-policy.mjs" "$TARGET"
printf '%s\n' 'ROLLBACK PASS: original hash and published-only default restored; human review still required.'
