"""Finite application contracts; these checks do not replace independent editing."""
import sys,json,hashlib
from pathlib import Path
from collections import Counter
import pytest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import english_application as content
from english_methods import registry,make
from pipeline import wrap,validate,problem_hash
ROWS=[r for r in registry() if r[1] in content.BLUEPRINTS]


def digest(rows):
    return hashlib.sha256(json.dumps(sorted(rows,key=lambda q:q['id']),sort_keys=True,
        ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def test_application_catalog_has_four_authored_contexts_for_every_english_skill():
    assert len(ROWS)==len(content.BLUEPRINTS)==11
    assert {r[0] for r in ROWS}==set(content.FAMILIES)
    assert all(len(v)==1 for v in content.FAMILIES.values())
    assert set(content.CASES)==set(content.BLUEPRINTS)
    assert all(len(cases)==4 for cases in content.CASES.values())


@pytest.mark.parametrize('skill,family,base,blueprint,generator',ROWS,ids=[r[1] for r in ROWS])
def test_application_contexts_replay_with_complete_rationales_and_pending_status(skill,family,base,blueprint,generator):
    hashes=set()
    for variant in range(4):
        raw=make(family,base+variant)
        assert raw==generator(family,base+variant)
        q=wrap(raw,skill,family,base+variant)
        assert not validate(q)
        assert len(q['options'])==len(set(q['options']))==4
        assert len(set(q['distractorExplanations'].values()))==4
        assert all(len(v)>=35 for v in q['distractorExplanations'].values())
        assert len(q['steps'])==2 and len(q['qualityMetadata']['difficultyBasis'])==2
        assert q['solutionMethod']['variantIndex']==variant
        assert q['solutionMethod']['authoredVariantCount']==4
        assert q['solutionMethod']['formulaStatus']=='instructional-heuristic-not-score-formula'
        assert q['editorialStatus']=='pending' and q['publicationStatus']=='candidate'
        assert q['reviewer'] is None and q['reviewNotes'] is None
        assert q['calibration']['n']==0 and q['difficultyCalibration']=='provisional-uncalibrated'
        assert all(span in q['passage']+' '+q['stem'] for span in q['answerEvidence']['quotes'])
        hashes.add(problem_hash(q))
    assert len(hashes)==4
    for seed in (base-1,base+4):
        with pytest.raises(ValueError):make(family,seed)


@pytest.mark.parametrize('variant,rows,gaps',[
 (0,((30,30),(36,48)),(0,12)),
 (1,((18,18),(15,9)),(0,6)),
 (2,((2,3),(3,7)),(1,4)),
 (3,((16,16),(14,10)),(0,4)),
])
def test_application_tables_compare_between_group_gaps_not_changes_or_individuals(variant,rows,gaps):
    case=content.CASES['rw3-application-table-interaction'][variant]
    actual=tuple(tuple(row[1:]) for row in case['table']['rows'])
    assert actual==rows
    assert tuple(abs(a-b) for a,b in actual)==gaps
    assert gaps[1]>gaps[0]
    assert all(len(row)==len(case['table']['headers']) for row in case['table']['rows'])
    assert 'individual' in case['wrong'][2][1]
    assert 'mean' in case['passage']
    if variant==2:assert 'one error' in case['right'] and 'four errors' in case['right']
    else:assert all(str(v) in case['right'] for row in rows for v in row)


@pytest.mark.parametrize('variant,control',[(0,'same measured light exposure'),(1,'equal size'),(2,'matched for mass'),(3,'shelf distance held constant')])
def test_evidence_keys_control_the_explicit_competing_explanation(variant,control):
    case=content.CASES['rw3-application-evidence-control'][variant]
    assert control in case['right']
    assert ['lighting','size','mass','distance'][variant] in ' '.join(case['steps'])
    assert len(case['wrong'])==3 and all(len(why)>35 for _,why in case['wrong'])


@pytest.mark.parametrize('variant,ending',[(0,'legible; however,'),(1,'brittle alloy; therefore,'),(2,'ambiguous for that treatment; instead,'),(3,'survived the winter; nevertheless,')])
def test_boundary_choices_supply_one_clause_boundary_and_a_comma_after_the_adverb(variant,ending):
    case=content.CASES['rw3-application-boundary-conjunctive'][variant]
    assert case['right']==ending
    completed=case['passage'].replace('_____',ending)
    assert completed.count(';')==1
    assert '_____' not in completed
    assert all(choice.strip() for choice,_ in case['wrong'])
    assert all(choice!=ending for choice,_ in case['wrong'])
    assert case['wrong'][0][0].count(';')==0
    assert case['wrong'][2][0].count(';')==2


@pytest.mark.parametrize('variant,agent',[(0,'the conservator'),(1,'the designer'),(2,'the stage manager'),(3,'the researcher')])
def test_modifier_keys_place_the_actual_performer_after_the_introductory_phrase(variant,agent):
    case=content.CASES['rw3-application-form-modifier'][variant]
    assert case['right'].startswith(agent+' ')
    assert all(not choice.startswith(agent+' ') for choice,_ in case['wrong'])
    assert case['passage'].count('_____')==1
    assert ', '+case['right']+'.' in case['passage'].replace('_____',case['right'])


def test_application_bank_preserves_all_5749_prior_records_and_all_math():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    base=json.loads((ROOT/'evidence/english-application/baseline.json').read_text())
    previous=[q for q in bank if q['id'] in base['contentHashes']]
    assert len(previous)==base['count']==5749
    assert digest(previous)==base['allRecordsDigest']
    assert all(q['contentHash']==base['contentHashes'][q['id']] for q in previous)
    math=[q for q in bank if q['section']=='math']
    assert len(math)==base['mathCount']==4800 and digest(math)==base['mathRecordsDigest']
    manifest=json.loads((ROOT/'content/manifests/english-application.json').read_text())
    ids=set(manifest['itemIds']);batch=[q for q in bank if q['id'] in ids]
    assert len(batch)==len(ids)==44 and ids.isdisjoint(base['contentHashes'])
    assert Counter(q['skill'] for q in batch)=={skill:4 for skill in content.FAMILIES}
    assert {q['family'] for q in batch}==set(content.BLUEPRINTS)
    assert len({q['problemHash'] for q in batch})==44
    assert all(q['section']=='rw' and not validate(q) for q in batch)
    assert len(bank)>=base['count']+44


def test_application_manifest_uses_observed_key_positions_and_no_publication():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    manifest=json.loads((ROOT/'content/manifests/english-application.json').read_text())
    batch=[q for q in bank if q['id'] in set(manifest['itemIds'])]
    positions=Counter(chr(65+q['options'].index(q['correctAnswer'])) for q in batch)
    assert manifest['keyPositions']==dict(sorted(positions.items()))
    assert sum(positions.values())==44 and manifest['approved']==manifest['published']==0
    assert all(q['editorialStatus']=='pending' and q['calibration']['n']==0 for q in batch)


def test_notes_key_does_not_add_an_unsupported_spatial_relation():
    case=content.CASES['rw3-application-notes-audience'][2]
    assert 'beneath' not in case['right']
    assert 'fixed roof with detailed exterior paving' in case['right']
    assert 'fixed roof and detailed exterior paving' in case['passage']


def test_transition_reversal_compares_detail_on_the_same_prompts():
    case=content.CASES['rw3-application-transition-reversal'][1]
    assert 'same opening prompts' in case['passage']
    assert 'briefer answers' in case['passage']
    assert case['right']=='Instead,'


def test_pending_review_pack_contains_every_current_key_and_item_id():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    pack=(ROOT/'content/reviewed/english-application.md').read_text()
    batch=[q for q in bank if q['family'] in content.BLUEPRINTS]
    assert len(batch)==44 and 'reviewer: unassigned' in pack
    for q in batch:
        assert q['id'] in pack and q['correctAnswer'] in pack
