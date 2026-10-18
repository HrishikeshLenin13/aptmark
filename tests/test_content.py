import sys,json,hashlib,random
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'python'))
import pytest
from hypothesis import given,settings,strategies as st
from taxonomy import SKILLS,coverage_plan
from math_generators import FAMILIES,make
from pipeline import wrap,validate,canonical,problem_hash
from reading_generators import make_reading

@pytest.mark.parametrize('family',[f for fs in FAMILIES.values() for f in fs])
@given(seed=st.integers(min_value=1,max_value=100000))
@settings(max_examples=12,deadline=None)
def test_family_independent_oracles(family,seed):
    raw=make(family,seed)
    if raw is None:return
    skill=next(k for k,v in FAMILIES.items() if family in v)
    q=wrap(raw,skill,family,seed)
    assert not validate(q)
    assert make(family,seed)==raw
    assert q['editorialStatus']=='pending' and q['publicationStatus']=='candidate'

@pytest.mark.parametrize('skill',[s['id'] for s in SKILLS if s['section']=='rw'])
def test_reading_candidates_stay_unpublished(skill):
    for i in range(5):
        q=wrap(make_reading(skill,i),skill,'rw-'+skill,i+1)
        assert not validate(q)
        assert q['validationResults']['answerCheck']=='structure-only-editorial-required'
        assert q['correctAnswer'] in q['options']

def test_coverage_allocation():
    p=coverage_plan(4500,'math')
    assert sum(p.values())==4500 and len(p)==19
    assert sum(coverage_plan(5500,'rw').values())==5500
    assert min(p.values())>90

def test_real_bank_inventory():
    bank=json.loads((Path(__file__).resolve().parents[1]/'content/bank.json').read_text())
    assert len(bank)==4555
    assert len({q['contentHash'] for q in bank})==4555
    assert len({problem_hash(q) for q in bank})==4555
    assert {q['skill'] for q in bank}=={s['id'] for s in SKILLS}
    assert not any(q['publicationStatus']=='published' for q in bank)
    assert all(not validate(q) for q in bank)

def test_publication_requires_human_evidence():
    q=wrap(make('linear-isolate',1),'linear-one','linear-isolate',1)
    q['publicationStatus']='published'
    assert 'unreviewed-publication' in validate(q)
    q['editorialStatus']='approved';q['reviewer']='Human editor';q['reviewNotes']='Independently verified.'
    assert not validate(q)

def test_tamper_detection():
    q=wrap(make('linear-isolate',9),'linear-one','linear-isolate',9)
    q['stem']='Changed without content hash update'
    assert 'hash-mismatch' in validate(q)
