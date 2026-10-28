"""Depth-batch numerical/structural checks; semantics remain human-review work."""
import hashlib
import json
import sys
from fractions import Fraction
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import english_depth
from english_methods import registry
from pipeline import wrap,validate,problem_hash

ROWS=[r for r in registry() if r[1] in english_depth.BLUEPRINTS]


def digest(rows):
    return hashlib.sha256(json.dumps(sorted(rows,key=lambda q:q['id']),sort_keys=True,
        ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def test_depth_batch_has_four_contexts_in_every_english_skill():
    assert len(ROWS)==11 and len({r[0] for r in ROWS})==11
    assert set(english_depth.CASES)==set(english_depth.BLUEPRINTS)
    assert all(len(cases)==4 for cases in english_depth.CASES.values())
    assert all(bp['variants']==4 for bp in english_depth.BLUEPRINTS.values())


@pytest.mark.parametrize('skill,family,base,bp,generator',ROWS,ids=[r[1] for r in ROWS])
def test_each_depth_context_has_evidence_distinct_rationale_records_and_private_method(skill,family,base,bp,generator):
    hashes=set()
    for variant in range(4):
        q=wrap(generator(family,base+variant),skill,family,base+variant)
        assert not validate(q)
        assert len(q['options'])==4
        assert len(q['qualityMetadata']['difficultyBasis'])>=2
        assert all(len(q['distractorExplanations'][o])>=35 for o in q['options'])
        assert len(set(q['distractorExplanations'].values()))==4
        assert q['solutionMethod']['blueprintId']==family
        assert q['publicationStatus']=='candidate' and q['editorialStatus']=='pending'
        assert q['reviewer'] is None and q['reviewNotes'] is None
        hashes.add(problem_hash(q))
    assert len(hashes)==4


@pytest.mark.parametrize('variant,expected_percents',[(0,(50,75)),(1,(20,15)),(2,(2,6)),(3,(90,72))])
def test_denominator_item_percentages_with_an_independent_fraction_oracle(variant,expected_percents):
    raw=english_depth.make('rw3-table-denominator',4000000+variant)
    rows=raw['table']['rows']
    percents=tuple(Fraction(row[2],row[1])*100 for row in rows)
    assert percents==expected_percents
    assert (rows[0][2]>rows[1][2]) != (percents[0]>percents[1])
    assert all(str(int(value))+'%' in raw['correctAnswer'] for value in percents)
    assert all(0<=row[2]<=row[1] and row[1]>0 for row in rows)


@pytest.mark.parametrize('variant',[0,1,2,3])
def test_dash_completion_pairs_the_interruption_without_removing_main_predicate(variant):
    raw=english_depth.make('rw3-paired-dashes',4000000+variant)
    assert raw['passage'].count('—')==1 and raw['passage'].count('_____')==1
    completed=raw['passage'].replace('_____',raw['correctAnswer'])
    assert completed.count('—')==2
    assert raw['correctAnswer'].endswith('—')
    assert all(not o.endswith('—') for o in raw['options'] if o!=raw['correctAnswer'])


def test_embedded_predicate_keys_are_main_finite_forms_not_the_embedded_verbs():
    expected=['were made','remains','explains','depends']
    for i,key in enumerate(expected):
        raw=english_depth.make('rw3-embedded-predicate',4000000+i)
        assert raw['correctAnswer']==key
        assert all(any(o.startswith(prefix) for prefix in ('being ','remaining','explaining','depending','to ','having '))
            for o in raw['options'] if o!=key)


def test_depth_generation_preserves_every_prior_record_and_every_math_record():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    baseline=json.loads((ROOT/'evidence/english-depth/baseline.json').read_text())
    previous=[q for q in bank if q['id'] in baseline['contentHashes']]
    assert len(previous)==baseline['count']==5573
    assert digest(previous)==baseline['allRecordsDigest']
    assert all(q['contentHash']==baseline['contentHashes'][q['id']] for q in previous)
    math=[q for q in bank if q['section']=='math']
    assert len(math)==baseline['mathCount']==4800
    assert digest(math)==baseline['mathRecordsDigest']
    added=[q for q in bank if q['id'] not in baseline['contentHashes']]
    assert len(added)==44 and len(bank)==5617
    assert {q['family'] for q in added}==set(english_depth.BLUEPRINTS)
    assert len({q['skill'] for q in added})==11
    assert all(q['section']=='rw' and not validate(q) for q in added)
    manifest=json.loads((ROOT/'content/manifests/english-depth.json').read_text())
    assert set(manifest['itemIds'])=={q['id'] for q in added}
