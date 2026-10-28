"""Reasoning-batch structure, preservation and independent table/grammar checks."""
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
import pytest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import english_reasoning as content
from english_methods import registry
from pipeline import wrap,validate,problem_hash

ROWS=[r for r in registry() if r[1] in content.BLUEPRINTS]


def digest(rows):
    return hashlib.sha256(json.dumps(sorted(rows,key=lambda q:q['id']),sort_keys=True,
        ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def test_reasoning_batch_has_four_explicit_contexts_in_every_english_skill():
    assert len(ROWS)==11 and len({r[0] for r in ROWS})==11
    assert set(content.CASES)==set(content.BLUEPRINTS)
    assert all(len(cases)==4 for cases in content.CASES.values())
    assert all(bp['variants']==4 for bp in content.BLUEPRINTS.values())


@pytest.mark.parametrize('skill,family,base,bp,generator',ROWS,ids=[r[1] for r in ROWS])
def test_reasoning_contexts_retain_evidence_rationales_method_and_pending_state(skill,family,base,bp,generator):
    hashes=set()
    for variant in range(4):
        raw=generator(family,base+variant)
        q=wrap(raw,skill,family,base+variant)
        assert not validate(q)
        assert len(q['options'])==4
        assert q['solutionMethod']['blueprintId']==family
        assert q['solutionMethod']['variantIndex']==variant
        assert len(q['qualityMetadata']['difficultyBasis'])>=2
        assert set(q['distractorExplanations'])==set(q['options'])
        assert len(set(q['distractorExplanations'].values()))==4
        assert all(len(reason)>=35 for reason in q['distractorExplanations'].values())
        assert q['editorialStatus']=='pending' and q['publicationStatus']=='candidate'
        assert q['reviewer'] is None and q['reviewNotes'] is None
        assert q['difficultyCalibration']=='provisional-uncalibrated'
        assert q['calibration']['n']==0
        assert all(span in q['passage']+' '+q['stem'] for span in q['answerEvidence']['quotes'])
        hashes.add(problem_hash(q))
    assert len(hashes)==4


@pytest.mark.parametrize('variant,expected',[(0,((17,10),(14,13))),(1,((28,22),(19,34))),(2,((46,39),(51,35))),(3,((12,27),(16,21)))])
def test_crossover_table_values_rankings_units_and_key_with_independent_oracle(variant,expected):
    raw=content.make('rw3-table-crossover',4_000_000+variant)
    table=raw['table'];rows=table['rows']
    assert tuple(tuple(row[1:]) for row in rows)==expected
    a,b=expected
    assert (a[0]-b[0])*(a[1]-b[1])<0
    assert all(str(number) in raw['correctAnswer'] for row in expected for number in row)
    assert len(table['headers'])==3 and all(len(row)==3 for row in rows)
    expected_keys = [
        f'Method A has the higher mean in quiet, {a[0]} versus {b[0]}, whereas method B has the higher mean with background speech, {b[1]} versus {a[1]}.',
        f'R bends farther when dry, {a[0]} degrees versus {b[0]}, but S bends farther after soaking, {b[1]} degrees versus {a[1]}.',
        f'Before lining, K has the lower level, {a[0]} decibels versus {b[0]}; after lining, L has the lower level, {b[1]} decibels versus {a[1]}.',
        f'M is faster on sparse displays, {a[0]} seconds versus {b[0]}, whereas N is faster on crowded displays, {b[1]} seconds versus {a[1]}.',
    ]
    assert raw['correctAnswer']==expected_keys[variant]
    units=['out of 20','degrees','decibels','seconds'][variant]
    assert all(units in heading for heading in table['headers'][1:])
    if variant==0:
        assert all(0<=n<=20 for row in expected for n in row)
    if variant>=2:  # Lower readings/times are the requested ordering.
        assert a[0]<b[0] and a[1]>b[1]
        assert 'lower' in raw['passage']
    else:
        assert a[0]>b[0] and a[1]<b[1]


@pytest.mark.parametrize('variant',range(4))
def test_complex_series_completion_preserves_three_outer_elements_and_internal_commas(variant):
    raw=content.make('rw3-complex-series',4_000_000+variant)
    assert raw['passage'].count('_____')==1
    assert raw['passage'].count(';')==1
    assert raw['correctAnswer'].endswith(';')
    completed=raw['passage'].replace('_____',raw['correctAnswer'])
    assert completed.count(';')==2 and '; and ' in completed
    # All four items explicitly state three outer elements, not an open list.
    assert 'three ' in raw['passage']
    before,after=completed.split(';',2)[:2],completed.split(';',2)[2]
    assert all(',' in element for element in before)
    assert ',' in after.split('.')[0]
    assert all(not option.endswith(';') for option in raw['options'] if option!=raw['correctAnswer'])


@pytest.mark.parametrize('variant',range(4))
def test_relative_possession_keys_are_determiners_before_explicit_noun_phrases(variant):
    raw=content.make('rw3-relative-possession',4_000_000+variant)
    assert raw['correctAnswer']=='whose'
    assert set(raw['options'])=={'whose','who’s','whom','which'}
    following=['pages','lenses','early drafts','main cables'][variant]
    assert '_____ '+following in raw['passage']
    assert 'whose '+following in raw['passage'].replace('_____',raw['correctAnswer'])


def test_new_batch_preserves_every_prior_record_and_math_record():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    baseline=json.loads((ROOT/'evidence/english-reasoning/baseline.json').read_text())
    previous=[q for q in bank if q['id'] in baseline['contentHashes']]
    assert len(previous)==baseline['count']==5617
    assert digest(previous)==baseline['allRecordsDigest']
    assert all(q['contentHash']==baseline['contentHashes'][q['id']] for q in previous)
    math=[q for q in bank if q['section']=='math']
    assert len(math)==baseline['mathCount']==4800
    assert digest(math)==baseline['mathRecordsDigest']
    manifest=json.loads((ROOT/'content/manifests/english-reasoning.json').read_text())
    ids=set(manifest['itemIds']);added=[q for q in bank if q['id'] in ids]
    assert len(ids)==len(added)==44
    assert set(ids).isdisjoint(baseline['contentHashes'])
    assert {q['family'] for q in added}==set(content.BLUEPRINTS)
    assert Counter(q['skill'] for q in added)=={skill:4 for skill in content.FAMILIES}
    assert all(q['section']=='rw' and not validate(q) for q in added)
    assert len(bank)>=baseline['count']+44


def test_returned_reasoning_table_cannot_mutate_authored_cases():
    original=content.make('rw3-table-crossover',4_000_000)
    changed=content.make('rw3-table-crossover',4_000_000)
    changed['table']['rows'][0][1]=-999
    assert content.make('rw3-table-crossover',4_000_000)==original
