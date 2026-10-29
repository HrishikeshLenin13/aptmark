"""Close-reading implementation contracts; independent editorial review remains open."""
import json,hashlib,sys
from pathlib import Path
from collections import Counter
import pytest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import english_literary as content
from english_methods import registry,make
from pipeline import wrap,validate,problem_hash
ROWS=[r for r in registry() if r[1] in content.BLUEPRINTS]


def digest(rows):
    return hashlib.sha256(json.dumps(sorted(rows,key=lambda q:q['id']),sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def test_literary_catalog_covers_six_reading_skills_with_four_authored_cases_each():
    assert len(ROWS)==len(content.BLUEPRINTS)==6
    assert {r[0] for r in ROWS}==set(content.FAMILIES)
    assert set(content.BLUEPRINTS)==set(content.CASES)
    assert all(len(cases)==4 for cases in content.CASES.values())


@pytest.mark.parametrize('skill,family,base,blueprint,generator',ROWS,ids=[r[1] for r in ROWS])
def test_every_literary_case_is_replayable_evidence_mapped_and_pending(skill,family,base,blueprint,generator):
    hashes=set()
    for v in range(4):
        raw=make(family,base+v);assert raw==generator(family,base+v)
        q=wrap(raw,skill,family,base+v);assert not validate(q)
        assert len(set(q['options']))==4
        assert len(set(q['distractorExplanations'].values()))==4
        assert all(len(r)>=35 for r in q['distractorExplanations'].values())
        assert all(quote in q['passage']+' '+q['stem'] for quote in q['answerEvidence']['quotes'])
        assert len(q['steps'])==2 and len(q['qualityMetadata']['difficultyBasis'])==2
        assert q['solutionMethod']['variantIndex']==v and q['solutionMethod']['authoredVariantCount']==4
        assert q['solutionMethod']['formulaStatus']=='instructional-heuristic-not-score-formula'
        assert q['editorialStatus']=='pending' and q['publicationStatus']=='candidate'
        assert q['reviewer'] is None and q['reviewNotes'] is None
        assert q['calibration']['n']==0 and q['difficultyCalibration']=='provisional-uncalibrated'
        assert q['qualityMetadata']['passageOrigin'].startswith('original ')
        assert 'literary-interpretation-requires-independent-review' in q['qualityMetadata']['reviewFlags']
        hashes.add(problem_hash(q))
    assert len(hashes)==4
    for seed in (base-1,base+4):
        with pytest.raises(ValueError):make(family,seed)


@pytest.mark.parametrize('v',range(4))
def test_evidence_options_are_exact_original_spans_and_the_key_is_a_diagnostic_action(v):
    case=content.CASES['rw3-literary-action-evidence'][v]
    assert all(text.strip('“”') in case['passage'] for text in [case['right']]+[x for x,_ in case['wrong']])
    assert ['moved both papers','explained how the paths','stopped speaking and leaned forward','wrapped its painted face'][v] in case['right']
    assert case['right'].strip('“”')!=case['wrong'][0][0].strip('“”')


@pytest.mark.parametrize('v,benefit,attachment',[
 (0,'more quickly through the square','turn the key'),
 (1,'I praise the maker’s careful work','one rough, broken sound'),
 (2,'I thank the hands','familiar crooked plank'),
 (3,'worked by stronger light','make an island'),
])
def test_poem_central_ideas_retain_both_practical_recognition_and_attachment(v,benefit,attachment):
    case=content.CASES['rw3-literary-held-tension'][v]
    assert benefit in case['passage'] and attachment in case['passage']
    assert case['genre']=='original poetry' and case['passage'].count('\n')>=7
    assert len(case['evidence'])==2


@pytest.mark.parametrize('v,limit',[(0,'less ready to name the reason'),(1,'before I had found the facts'),(2,'less certain message'),(3,'could no longer be sure')])
def test_perspective_inferences_respect_the_narrators_stated_information_limit(v,limit):
    case=content.CASES['rw3-literary-perspective-limit'][v]
    assert limit in case['passage']
    assert any(word in case['right'] for word in ('may','not yet','begins to consider'))
    assert len(case['evidence'])==2


@pytest.mark.parametrize('v,key,anchor',[(0,'deliberate','three times'),(1,'unadorned','no pictures'),(2,'conserved','only the small lamp'),(3,'moderated','rather than removing it')])
def test_word_senses_are_supported_by_local_behavior_and_degree(v,key,anchor):
    case=content.CASES['rw3-literary-context-shade'][v]
    assert case['right']==key and anchor in case['passage']
    assert 'most nearly mean' in case['stem']


@pytest.mark.parametrize('v,anchor',[(0,'Tessa left both visible'),(1,'He still missed the open paving'),(2,'new gears kept steadier time'),(3,'For a moment')])
def test_final_image_questions_keep_the_qualifying_context_visible(v,anchor):
    case=content.CASES['rw3-literary-final-image'][v]
    assert anchor in case['passage']
    assert 'function of the final sentence' in case['stem']
    assert case['genre']=='original fictional prose'


@pytest.mark.parametrize('v,decisive,key_fragment',[
 (0,'but do not break the waiting seal','remains unwilling'),
 (1,'turned toward home','turn back'),
 (2,'Its wick is cold','conditional future action'),
 (3,'this morning, neither has moved on','consistent'),
])
def test_cross_readings_use_the_actual_qualification_sequence_and_condition(v,decisive,key_fragment):
    case=content.CASES['rw3-literary-cross-reading'][v]
    assert case['passage'].count('Text 1\n')==case['passage'].count('Text 2\n')==1
    assert decisive in case['passage'].split('Text 2\n')[0]
    assert key_fragment in case['right']
    assert any(quote in case['passage'].split('Text 2\n')[0] for quote in case['evidence'])


def test_literary_bank_preserves_every_prior_record_and_all_math():
    bank=json.loads((ROOT/'content/bank.json').read_text())
    base=json.loads((ROOT/'evidence/english-literary/baseline.json').read_text())
    prior=[q for q in bank if q['id'] in base['contentHashes']]
    assert len(prior)==base['count']==5793 and digest(prior)==base['allRecordsDigest']
    assert all(q['contentHash']==base['contentHashes'][q['id']] for q in prior)
    math=[q for q in bank if q['section']=='math']
    assert len(math)==base['mathCount']==4800 and digest(math)==base['mathRecordsDigest']
    manifest=json.loads((ROOT/'content/manifests/english-literary.json').read_text())
    ids=set(manifest['itemIds']);batch=[q for q in bank if q['id'] in ids]
    assert len(batch)==len(ids)==24 and ids.isdisjoint(base['contentHashes'])
    assert Counter(q['skill'] for q in batch)=={skill:4 for skill in content.FAMILIES}
    assert len({q['problemHash'] for q in batch})==24
    assert len(bank)>=base['count']+24


def test_literary_manifest_records_real_genres_key_positions_and_length_diagnostics():
    bank=json.loads((ROOT/'content/bank.json').read_text());m=json.loads((ROOT/'content/manifests/english-literary.json').read_text())
    batch=[q for q in bank if q['id'] in set(m['itemIds'])]
    assert m['keyPositions']==dict(sorted(Counter(chr(65+q['options'].index(q['correctAnswer'])) for q in batch).items()))
    assert m['genres']=={'original fictional prose':16,'original poetry':4,'original poetry and commentary':4}
    actual={q['id']:(len(q['correctAnswer'].split()),[len(x.split()) for x in q['options']]) for q in batch}
    assert len(m['choiceLengthReview']['items'])==24
    longest=0
    for entry in m['choiceLengthReview']['items']:
        assert (entry['keyWords'],entry['optionWords'])==actual[entry['id']]
        q=next(q for q in batch if q['id']==entry['id'])
        expected=entry['keyWords']>max(len(x.split()) for x in q['options'] if x!=q['correctAnswer'])
        assert entry['keyIsStrictlyLongest']==expected;longest+=expected
    assert m['choiceLengthReview']['strictlyLongestKeys']==longest
    assert m['approved']==m['published']==m['mathGeneratedByThisBatch']==0


def test_pending_literary_pack_contains_every_current_key_and_id_without_an_approval():
    bank=json.loads((ROOT/'content/bank.json').read_text());pack=(ROOT/'content/reviewed/english-literary.md').read_text()
    assert 'Reviewer: unassigned' in pack
    for q in bank:
        if q['family'] in content.BLUEPRINTS:assert q['id'] in pack and q['correctAnswer'] in pack
