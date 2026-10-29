#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LIVE="$BASE/../../docs/WEBSITE_DIRECTION.md"
[ "$#" -eq 1 ] || exit 2
TARGET=$1
if [ ! -f "$TARGET" ] || [ -L "$TARGET" ] || [ "$TARGET" -ef "$LIVE" ]; then echo 'Use a disposable comparison-document copy.' >&2; exit 2; fi
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "6f97d576b0f8f48287fb9c5946019e119a361f8d2f89ecf4843ef1024c4b320d" ] || exit 3
[ "$(shasum -a 256 "$BASE/website-direction.original.txt" | awk '{print $1}')" = "2eaaf5a8150ebdbf961f58240bd86f109f6cc74d3c18f9f14c6f8e1c465fc8c7" ] || exit 4
cp "$BASE/website-direction.original.txt" "$TARGET"
[ "$(shasum -a 256 "$TARGET" | awk '{print $1}')" = "2eaaf5a8150ebdbf961f58240bd86f109f6cc74d3c18f9f14c6f8e1c465fc8c7" ] || exit 5
printf 'restored_sha256=%s\n' '2eaaf5a8150ebdbf961f58240bd86f109f6cc74d3c18f9f14c6f8e1c465fc8c7'
