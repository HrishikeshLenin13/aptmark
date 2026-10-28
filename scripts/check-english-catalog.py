#!/usr/bin/env python3
"""Execute an isolated registry source fixture; never generate or publish rows."""
import json
import runpy
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'python'))
rows = runpy.run_path(sys.argv[1])['registry']()
print(json.dumps({'families': len(rows), 'authoredVariants': sum(r[3]['variants'] for r in rows), 'skills': len({r[0] for r in rows})}))
