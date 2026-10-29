import json,sys
rows=json.load(open(sys.argv[1]))
print(f"total={len(rows)}; literary={sum(q['family'].startswith('rw3-literary-') for q in rows)}")
