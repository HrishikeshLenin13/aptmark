#!/usr/bin/env python3
"""Inspect a registry fixture without opening the generator database."""
import importlib.util
import json
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
path=Path(sys.argv[1]).resolve()
spec=importlib.util.spec_from_file_location('aptmark_registry_fixture',path)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
rows=module.registry()
print(json.dumps({'families':len(rows),'skills':len({r[0] for r in rows}),
                  'authoredVariants':sum(r[3]['variants'] for r in rows)}))
