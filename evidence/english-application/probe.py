import json,sys
rows=json.load(open(sys.argv[1]))
print(f"total={len(rows)}; application={sum(q['family'].startswith('rw3-application-') for q in rows)}")
