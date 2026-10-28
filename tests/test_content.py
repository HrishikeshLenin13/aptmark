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
    assert len(bank)>=4555
    assert len({q['contentHash'] for q in bank})==len(bank)
    assert len({problem_hash(q) for q in bank})==len(bank)
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


def test_legacy_content_hashes_preserved():
    root=Path(__file__).resolve().parents[1]
    bank=json.loads((root/'content/bank.json').read_text())
    original=[q for q in bank if q.get('generatorVersion')=='1.0.0']
    baseline=json.loads((root/'evidence/content-expansion/baseline-inventory.json').read_text())
    assert len(original)==baseline['count']
    digest=hashlib.sha256('\n'.join(sorted(q['id']+':'+q['contentHash'] for q in original)).encode()).hexdigest()
    assert digest==baseline['legacyContentHashDigest']


from pipeline import expansion_registry,replay_raw,quality_plan

@pytest.mark.parametrize('skill,family,generator',expansion_registry())
@given(seed=st.integers(min_value=1000000,max_value=1009999))
@settings(max_examples=15,deadline=None)
def test_expansion_replays_and_keeps_editorial_gate(skill,family,generator,seed):
    raw=generator(family,seed)
    if raw is None:return
    q=wrap(raw,skill,family,seed)
    assert not validate(q)
    assert replay_raw(q)==raw
    assert q['generatorVersion']=='2.0.0'
    assert q['editorialStatus']=='pending' and q['publicationStatus']=='candidate'
    assert all(q['distractorExplanations'][choice] for choice in q['options'])
    assert q['qualityMetadata']['difficultyBasis']


def test_evidence_and_rationales_are_checked_not_merely_hashed():
    from reading_expansion import make as reading
    q=wrap(reading('rw2-control-evidence',1000000),'textual-evidence','rw2-control-evidence',1000000)
    q['answerEvidence']['quotes']=['a quote that does not occur in this passage']
    q['contentHash']=hashlib.sha256(canonical(q).encode()).hexdigest()
    assert 'evidence-span-missing' in validate(q)
    q['distractorExplanations'].pop(q['options'][0])
    q['contentHash']=hashlib.sha256(canonical(q).encode()).hexdigest()
    assert 'missing-option-rationale' in validate(q)


def test_expansion_resume_and_fresh_clone_hydration(tmp_path,monkeypatch):
    import pipeline
    baseline=wrap(make('linear-isolate',1),'linear-one','linear-isolate',1)
    (tmp_path/'bank.json').write_text(json.dumps([baseline]))
    monkeypatch.setattr(pipeline,'CONTENT',tmp_path)
    monkeypatch.setattr(pipeline,'DB',tmp_path/'test.sqlite')
    db=pipeline.connect()
    assert db.execute('SELECT count(*) FROM candidates').fetchone()[0]==1
    db.close()
    first=pipeline.expand(2,2)
    assert first['inserted']==68
    digest=hashlib.sha256((tmp_path/'bank.json').read_bytes()).hexdigest()
    second=pipeline.expand(2,2)
    assert second['inserted']==0
    assert hashlib.sha256((tmp_path/'bank.json').read_bytes()).hexdigest()==digest
    bank=json.loads((tmp_path/'bank.json').read_text())
    assert len(bank)==69 and not any(q['publicationStatus']=='published' for q in bank)
    plan=quality_plan(bank)
    assert plan['published']==0 and not plan['publishableTargetMet']
    with pytest.raises(ValueError):pipeline.expand(101,101)


def test_new_family_inventory_and_review_metadata():
    bank=json.loads((Path(__file__).resolve().parents[1]/'content/bank.json').read_text())
    expanded=[q for q in bank if q.get('generatorVersion')=='2.0.0']
    from collections import Counter
    families=Counter(q['family'] for q in expanded)
    assert len(families)==34 and set(families.values())=={25}
    assert len([q for q in bank if q.get('generatorVersion') in ('1.0.0','2.0.0')])==5405
    assert all(not validate(q) for q in expanded)
    plan=quality_plan(bank)
    assert all(s['families']>=1 for s in plan['skills'])
    assert all(s['families']>=3 for s in plan['skills'] if s['section']=='rw')
    assert plan['published']==0
