#!/bin/bash
set -eu
BASE="$(cd "$(dirname "$0")" && pwd)"
python3 - "$BASE/layout.original.tsx" "${1:?Pass the layout copy to restore}" <<'PYTHON'
import hashlib,pathlib,sys
original,target=map(pathlib.Path,sys.argv[1:])
if hashlib.sha256(original.read_bytes()).hexdigest()!="7f99167132e959d7ab091c31778ba09184beea36dec5647309dc2d94d1e96806":
    raise SystemExit("Original snapshot hash mismatch")
if hashlib.sha256(target.read_bytes()).hexdigest()!="0c09cb4467cdae64620408424bc47b28d9fad9431a7bf6ec5737e81c979d611e":
    raise SystemExit("Target hash differs; no changes made")
target.write_bytes(original.read_bytes())
print("restored sha256="+hashlib.sha256(target.read_bytes()).hexdigest())
PYTHON
