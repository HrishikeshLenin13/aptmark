#!/bin/sh
set -eu
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
source_file="$script_dir/README.before.md"
target=${1:-"$script_dir/../../README.md"}
expected_modified="3a9f38c671c1ef57654eccc59d7ee171a68bd61d2386bea9261c2531a1708dda"
expected_original="f781c72ed4f30919b495095470c2af1027236a433e96a8c75c5234d0f791a9bb"
[ -f "$source_file" ] && [ -f "$target" ] || { echo "rollback: missing README snapshot or target" >&2; exit 2; }
actual=$(shasum -a 256 "$target" | awk '{print $1}')
[ "$actual" = "$expected_modified" ] || { echo "rollback: target hash mismatch; left unchanged" >&2; exit 3; }
cp "$source_file" "$target"
restored=$(shasum -a 256 "$target" | awk '{print $1}')
[ "$restored" = "$expected_original" ] || { echo "rollback: restored hash mismatch" >&2; exit 4; }
printf 'rollback: restored %s from README.before.md\nrestored sha256: %s\n' "$target" "$restored"
