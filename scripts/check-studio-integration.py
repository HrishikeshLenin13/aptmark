#!/usr/bin/env python3
"""Bounded check of the layout's study-studio stylesheet integration."""
import pathlib
import sys
source = pathlib.Path(sys.argv[1]).read_text()
print("study studio stylesheet: " + ("present" if 'import "@/styles/studio.css";' in source else "absent"))
