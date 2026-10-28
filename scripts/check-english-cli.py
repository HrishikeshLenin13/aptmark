#!/usr/bin/env python3
"""Probe the real parser without opening or mutating the content database."""
import os
import subprocess
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
env={**os.environ,'PYTHONPATH':str(root/'python')}
result=subprocess.run([sys.executable,str(Path(sys.argv[1]).resolve()),'--help'],env=env,capture_output=True,text=True)
if result.returncode:
    print(result.stderr,end='');sys.exit(result.returncode)
print('expand-english='+('present' if 'expand-english' in result.stdout else 'absent'))
