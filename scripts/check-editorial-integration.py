#!/usr/bin/env python3
"""Probe source integration markers only; runtime behavior has browser tests."""
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text()
markers = {
    "methodCatalog": bool(re.search(
        r'<option\s+value="3\.0\.0"\s*>\s*English method catalog\s*</option>', source,
    )),
    "familyFilter": 'aria-label="Editorial family"' in source,
    "methodReview": bool(re.search(r'<EditorialMethodReview\s+question=\{q\}', source)),
    "staleResponseGuard": "editorialRequestEpoch.current" in source,
}
print(json.dumps(markers))
