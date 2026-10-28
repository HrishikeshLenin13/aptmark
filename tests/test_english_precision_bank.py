"""Bank integration and full-record preservation for the finite precision batch."""
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import english_precision as content
from english_methods import registry
from pipeline import validate


def digest(rows):
    return hashlib.sha256(json.dumps(sorted(rows,key=lambda q:q['id']),sort_keys=True,
        ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def test_precision_registry_owns_twenty_two_disjoint_four_seed_slots():
    registered=[r for r in registry() if r[1] in content.BLUEPRINTS]
    assert len(registered)==22
    assert {r[1] for r in registered}==set(content.BLUEPRINTS)
    assert Counter(r[0] for r in registered)=={skill:2 for skill in content.FAMILIES}
    assert len({r[2] for r in registered})==22
    assert all(r[2]%4==0 and r[3]['variants']==4 for r in registered)


def test_precision_batch_preserves_every_prior_record_and_math_record():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    baseline=json.loads((ROOT/'evidence/english-precision/baseline.json').read_text())
    previous=[q for q in bank if q['id'] in baseline['contentHashes']]
    assert len(previous)==baseline['count']==5661
    assert digest(previous)==baseline['allRecordsDigest']
    assert all(q['contentHash']==baseline['contentHashes'][q['id']] for q in previous)
    math=[q for q in bank if q['section']=='math']
    assert len(math)==baseline['mathCount']==4800
    assert digest(math)==baseline['mathRecordsDigest']
    manifest=json.loads((ROOT/'content/manifests/english-precision.json').read_text())
    ids=set(manifest['itemIds']);batch=[q for q in bank if q['id'] in ids]
    assert len(batch)==len(ids)==88 and ids.isdisjoint(baseline['contentHashes'])
    assert {q['family'] for q in batch}==set(content.BLUEPRINTS)
    assert Counter(q['skill'] for q in batch)=={skill:8 for skill in content.FAMILIES}
    assert len({q['problemHash'] for q in batch})==88
    assert all(q['section']=='rw' and not validate(q) for q in batch)
    assert all(q['reviewer'] is None and q['publicationStatus']=='candidate' for q in batch)
    assert len(bank)>=baseline['count']+88


def test_precision_manifest_reports_real_key_positions_and_no_publication():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    manifest=json.loads((ROOT/'content/manifests/english-precision.json').read_text())
    ids=set(manifest['itemIds']);batch=[q for q in bank if q['id'] in ids]
    positions=Counter(chr(65+q['options'].index(q['correctAnswer'])) for q in batch)
    assert manifest['keyPositions']==dict(sorted(positions.items()))
    assert sum(positions.values())==88
    assert manifest['approved']==manifest['published']==0
    assert all(q['editorialStatus']=='pending' and q['calibration']['n']==0 for q in batch)
