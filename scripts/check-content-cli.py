"""Bounded CLI contract check for content-expansion baseline and rollback evidence."""
import argparse, os, subprocess, sys
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('target',type=Path)
p.add_argument('--expected',choices=('present','absent'),required=True)
a=p.parse_args()
root=Path(__file__).resolve().parents[1]
env={**os.environ,'PYTHONPATH':str(root/'python')}
result=subprocess.run([sys.executable,str(a.target.resolve()),'--help'],capture_output=True,text=True,env=env)
if result.returncode:
    print(result.stderr,file=sys.stderr)
    raise SystemExit(result.returncode)
actual='present' if 'expand' in result.stdout and 'review-pack' in result.stdout and 'plan' in result.stdout else 'absent'
assert actual==a.expected,(actual,a.expected)
print('content expansion CLI: '+actual)
