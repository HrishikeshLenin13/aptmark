"""Structural/content provenance controls, not a claim of editorial validity."""
import copy
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

import pytest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import pipeline
from english_methods import registry, make, blueprint_manifest
from taxonomy import SKILLS

CATALOG=registry()


def digest(rows):
    return hashlib.sha256(json.dumps(sorted(rows,key=lambda q:q['id']),sort_keys=True,
        ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def test_all_eleven_skills_have_method_blueprints():
    assert {row[0] for row in CATALOG}=={s['id'] for s in SKILLS if s['section']=='rw'}
    assert len(CATALOG)==53
    assert len({row[1] for row in CATALOG})==len({row[2] for row in CATALOG})==53
    for skill,family,base,bp,_ in CATALOG:
        assert base%4==0 and bp['skill']==skill and bp['variants']==4
        assert all(bp.get(k) for k in ('method','formula','structure','misconceptions'))
        assert family.startswith('rw3-')


@pytest.mark.parametrize('skill,family,base,bp,generator',CATALOG,ids=[r[1] for r in CATALOG])
def test_every_authored_variant_is_distinct_replayable_and_pending(skill,family,base,bp,generator):
    hashes=set()
    for variant in range(4):
        seed=base+variant
        raw=make(family,seed)
        assert raw==generator(family,seed)
        q=pipeline.wrap(raw,skill,family,seed)
        assert not pipeline.validate(q)
        assert pipeline.replay_raw(q)==raw
        assert q['editorialStatus']=='pending' and q['publicationStatus']=='candidate'
        assert q['reviewer'] is None and q['reviewNotes'] is None
        assert q['solutionMethod']['variantIndex']==variant
        assert q['solutionMethod']['formulaStatus']=='instructional-heuristic-not-score-formula'
        assert len(q['options'])==len(set(q['options']))==4
        assert q['options'].count(q['correctAnswer'])==1
        assert set(q['distractorExplanations'])==set(q['options'])
        assert len(q['steps'])>=2
        assert q['calibration']['n']==0 and q['difficultyCalibration']=='provisional-uncalibrated'
        assert 150<=len(q['passage'])<=900
        hashes.add(pipeline.problem_hash(q))
    assert len(hashes)==4  # Choice-order changes never inflate authored counts.
    with pytest.raises(ValueError):make(family,base+4)
    with pytest.raises(ValueError):make(family,base-1)


def sample():
    skill,family,base,_,generator=CATALOG[0]
    return pipeline.wrap(generator(family,base),skill,family,base)


def rehash(q):
    q['contentHash']=hashlib.sha256(pipeline.canonical(q).encode()).hexdigest()


def test_method_evidence_and_rationales_are_validated_and_hashed():
    q=sample()
    q['solutionMethod']['formula']='tampered rule'
    assert 'hash-mismatch' in pipeline.validate(q)
    q=sample();q['solutionMethod']['skill']='math';rehash(q)
    assert 'method-blueprint-mismatch' in pipeline.validate(q)
    q=sample();q['solutionMethod']['method']='';rehash(q)
    assert 'missing-solution-method:method' in pipeline.validate(q)
    q=sample();q['solutionMethod']['variantIndex']=4;rehash(q)
    assert 'method-variant-bounds' in pipeline.validate(q)
    q=sample();q['answerEvidence']['quotes']=['nonexistent evidence span'];rehash(q)
    assert 'evidence-span-missing' in pipeline.validate(q)
    q=sample();q['distractorExplanations'].pop(q['options'][0]);rehash(q)
    assert 'missing-option-rationale' in pipeline.validate(q)
    q=sample();q['publicationStatus']='published'
    assert 'unreviewed-publication' in pipeline.validate(q)


def test_quantitative_tables_require_rectangular_labeled_data():
    skill,family,base,_,gen=next(r for r in CATALOG if r[0]=='quantitative-evidence')
    q=pipeline.wrap(gen(family,base),skill,family,base)
    q['table']['rows'][0].pop();rehash(q)
    q['problemHash']=pipeline.problem_hash(q)
    assert 'invalid-table-shape' in pipeline.validate(q)
    q=pipeline.wrap(gen(family,base),skill,family,base)
    q['table']=None;rehash(q);q['problemHash']=pipeline.problem_hash(q)
    assert 'missing-quantitative-table' in pipeline.validate(q)


def test_english_generation_is_bounded_resumable_and_math_preserving(tmp_path,monkeypatch):
    original=pipeline.wrap(pipeline.make('linear-isolate',1),'linear-one','linear-isolate',1)
    (tmp_path/'bank.json').write_text(json.dumps([original]))
    monkeypatch.setattr(pipeline,'CONTENT',tmp_path)
    monkeypatch.setattr(pipeline,'DB',tmp_path/'test.sqlite')
    with pytest.raises(ValueError):pipeline.expand_english(5)
    with pytest.raises(ValueError):pipeline.expand_english(0)
    first=pipeline.expand_english(1)
    assert first['inserted']==53
    second=pipeline.expand_english(4)
    assert second['inserted']==159 and second['candidates']==212
    bank_bytes=(tmp_path/'bank.json').read_bytes()
    third=pipeline.expand_english(4)
    assert third['inserted']==0
    assert (tmp_path/'bank.json').read_bytes()==bank_bytes
    bank=json.loads(bank_bytes)
    assert [q for q in bank if q['section']=='math']==[original]
    assert len(bank)==213
    assert not any(q['publicationStatus']=='published' for q in bank)
    assert len({pipeline.problem_hash(q) for q in bank})==len(bank)
    assert json.loads((tmp_path/'blueprints/english-methods.json').read_text())==blueprint_manifest()


def test_existing_variant_collision_aborts_without_partial_insert(tmp_path,monkeypatch):
    skill,family,base,_,generator=CATALOG[-1]
    q=pipeline.wrap(generator(family,base),skill,family,base)
    q['contentHash']='different-existing-version'
    (tmp_path/'bank.json').write_text(json.dumps([q]))
    monkeypatch.setattr(pipeline,'CONTENT',tmp_path)
    monkeypatch.setattr(pipeline,'DB',tmp_path/'test.sqlite')
    with pytest.raises(ValueError,match='version it explicitly'):
        pipeline.expand_english()
    db=pipeline.connect()
    assert db.execute('SELECT count(*) FROM candidates').fetchone()[0]==1
    db.close()


def test_committed_bank_preserves_all_previous_questions_and_every_math_record():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    baseline=json.loads((ROOT/'evidence/english-methods/baseline-inventory.json').read_text())
    previous=[q for q in bank if q['id'] in baseline['contentHashes']]
    assert len(previous)==baseline['count']==5405
    assert all(q['contentHash']==baseline['contentHashes'][q['id']] for q in previous)
    assert digest(previous)==baseline['allOriginalRecordsDigest']
    math=[q for q in bank if q['section']=='math']
    assert len(math)==baseline['mathCount']==4800
    assert digest(math)==baseline['mathRecordsDigest']
    added=[q for q in bank if q.get('generatorVersion')=='3.0.0']
    assert len(added)==212 and len(bank)==5617
    assert len({q['family'] for q in added})==53
    assert len({q['skill'] for q in added})==11
    assert set(Counter(q['family'] for q in added).values())=={4}
    assert all(q['section']=='rw' and not pipeline.validate(q) for q in added)
    assert all(q['editorialStatus']=='pending' and q['publicationStatus']=='candidate' for q in added)


def test_returned_table_mutation_cannot_contaminate_authored_source():
    skill,family,base,_,generator=next(r for r in CATALOG if r[0]=='quantitative-evidence')
    before=generator(family,base)
    changed=generator(family,base)
    changed['table']['rows'][0].pop()
    assert generator(family,base)==before
    assert generator(family,base)['table'] is not changed['table']


def test_second_batch_preserves_every_first_batch_committed_record():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    baseline=json.loads((ROOT/'evidence/english-methods/supplement-baseline.json').read_text())
    previous=[q for q in bank if q['id'] in baseline['contentHashes']]
    assert len(previous)==baseline['count']==5561
    assert all(q['contentHash']==baseline['contentHashes'][q['id']] for q in previous)
    assert digest(previous)==baseline['allRecordsDigest']
    from english_detail_boundaries import FAMILIES as SUPPLEMENT
    families={f for fs in SUPPLEMENT.values() for f in fs}
    extra=[q for q in bank if q['id'] not in baseline['contentHashes'] and q['family'] in families]
    assert len(extra)==12 and {q['skill'] for q in extra}=={'central-ideas','boundaries'}
    assert len({q['family'] for q in extra})==3


def test_full_bank_fresh_clone_generation_is_byte_identical(tmp_path,monkeypatch):
    bank_bytes=(ROOT/'content/bank.json').read_bytes()
    (tmp_path/'bank.json').write_bytes(bank_bytes)
    monkeypatch.setattr(pipeline,'CONTENT',tmp_path)
    monkeypatch.setattr(pipeline,'DB',tmp_path/'fresh-clone.sqlite')
    result=pipeline.expand_english(4)
    assert result['inserted']==0 and result['candidates']==212
    assert (tmp_path/'bank.json').read_bytes()==bank_bytes
    assert result['approved']==result['published']==result['mathGeneratedByThisCommand']==0
