"""Direct authoring contracts; numerical checks are not human editorial review."""
import sys
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import english_precision as content
from pipeline import wrap,validate,problem_hash
ROWS=[(name,bp['skill']) for name,bp in content.BLUEPRINTS.items()]


def test_precision_authoring_catalog_covers_two_families_per_english_skill():
    assert len(ROWS)==22 and len(content.FAMILIES)==11
    assert all(len(families)==2 for families in content.FAMILIES.values())
    assert set(content.CASES)==set(content.BLUEPRINTS)
    assert all(len(cases)==4 for cases in content.CASES.values())


@pytest.mark.parametrize('family,skill',ROWS,ids=[r[0] for r in ROWS])
def test_every_precision_context_has_evidence_distinct_rationales_and_pending_metadata(family,skill):
    hashes=set()
    for i in range(4):
        raw=content.make(family,4_000_000+i)
        q=wrap(raw,skill,family,4_000_000+i)
        assert not validate(q)
        assert len(q['options'])==len(set(q['options']))==4
        assert len(set(q['distractorExplanations'].values()))==4
        assert all(len(reason)>=35 for reason in q['distractorExplanations'].values())
        assert len(q['steps'])>=2 and len(q['qualityMetadata']['difficultyBasis'])>=2
        assert q['solutionMethod']['blueprintId']==family
        assert q['solutionMethod']['variantIndex']==i
        assert q['solutionMethod']['authoredVariantCount']==4
        assert q['editorialStatus']=='pending' and q['publicationStatus']=='candidate'
        assert q['reviewer'] is None and q['reviewNotes'] is None
        assert q['calibration']['n']==0
        assert q['difficultyCalibration']=='provisional-uncalibrated'
        assert all(span in q['passage']+' '+q['stem'] for span in q['answerEvidence']['quotes'])
        hashes.add(problem_hash(q))
    assert len(hashes)==4


@pytest.mark.parametrize('variant,expected,changes',[
    (0,((12,24),(25,31)),(12,6)),
    (1,((48,30),(35,26)),(-18,-9)),
    (2,((60,72),(74,80)),(12,6)),
    (3,((9,17),(21,25)),(8,4)),
])
def test_baseline_change_tables_and_key_use_changes_not_endpoints(variant,expected,changes):
    raw=content.make('rw3-table-baseline-change',4_000_000+variant)
    rows=raw['table']['rows'];a,b=[tuple(row[1:]) for row in rows]
    assert (a,b)==expected
    assert (a[1]-a[0],b[1]-b[0])==changes
    assert abs(changes[0])>abs(changes[1])
    expected_keys=[
        f'A increases by {changes[0]} models, from {a[0]} to {a[1]}, while B increases by {changes[1]}, from {b[0]} to {b[1]}.',
        f'R’s mean falls by {abs(changes[0])} minutes, from {a[0]} to {a[1]}, whereas S’s falls by {abs(changes[1])} minutes, from {b[0]} to {b[1]}.',
        f'X gains {changes[0]} percentage points, from {a[0]}% to {a[1]}%, while Y gains {changes[1]} points, from {b[0]}% to {b[1]}%.',
        f'U adds {changes[0]} loans, increasing from {a[0]} to {a[1]}, while V adds {changes[1]}, increasing from {b[0]} to {b[1]}.',
    ]
    assert raw['correctAnswer']==expected_keys[variant]
    assert (a[1]>b[1])==(variant==1)
    assert len(raw['table']['headers'])==3
    if variant==2:assert all(0<=n<=100 for pair in expected for n in pair)


@pytest.mark.parametrize('variant',range(4))
def test_reference_tables_apply_inclusive_bounds_to_all_required_cells(variant):
    raw=content.make('rw3-table-reference',4_000_000+variant)
    table=raw['table'];rows=table['rows']
    expected=[((5,),(7,),(11,)),((14,13),(12,15),(10,11)),((8,),(4,),(6,)),((18,),(21,),(20,))][variant]
    assert tuple(tuple(row[1:]) for row in rows)==expected
    predicates=[lambda n:n<=8,lambda n:n>=12,lambda n:4<=n<=7,lambda n:n>=20]
    accepted=tuple(all(predicates[variant](n) for n in row) for row in expected)
    assert accepted==[(True,True,False),(True,True,False),(False,True,True),(False,True,True)][variant]
    keys=[
        lambda: f'C’s mean is {rows[2][1]} errors, above 8, whereas A’s {rows[0][1]} and B’s {rows[1][1]} are both below 8.',
        lambda: f'A records {rows[0][1]} and {rows[0][2]} liters per minute, B records {rows[1][1]} and {rows[1][2]}, and C records {rows[2][1]} and {rows[2][2]}.',
        lambda: f'P’s gap is {rows[0][1]} millimeters, while Q’s {rows[1][1]} and R’s {rows[2][1]} both fall within the inclusive 4-to-7-millimeter range.',
        lambda: f'South’s mean is {rows[1][1]} and West’s is {rows[2][1]}, meeting the minimum of 20, while North’s {rows[0][1]} falls below it.',
    ]
    assert raw['correctAnswer']==keys[variant]()
    assert all(len(row)==len(table['headers']) for row in rows)


@pytest.mark.parametrize('variant',range(4))
def test_compound_predicate_keys_do_not_detach_the_shared_subject(variant):
    raw=content.make('rw3-compound-predicate-boundary',4_000_000+variant)
    assert raw['correctAnswer']==['labels and','shelves and','shape and','copies and'][variant]
    assert raw['passage'].count('_____')==1
    assert all(any(mark in choice for mark in (';',':','.')) for choice in raw['options'] if choice!=raw['correctAnswer'])
    assert raw['correctAnswer']+' '+['records','tests','notes','marks'][variant] in raw['passage'].replace('_____',raw['correctAnswer'])


@pytest.mark.parametrize('variant',range(4))
def test_integrated_quote_completion_keeps_required_syntax_unbroken(variant):
    raw=content.make('rw3-integrated-quotation',4_000_000+variant)
    key=['between','as','that','to'][variant]
    assert raw['correctAnswer']==key
    assert set(raw['options'])=={key,key+':',key+',',key+';'}
    completed=raw['passage'].replace('_____',key)
    assert key+' “' in completed
    assert completed.count('“')==completed.count('”')


@pytest.mark.parametrize('variant',range(4))
def test_inverted_agreement_tracks_postverbal_subject_not_location_nouns(variant):
    raw=content.make('rw3-inverted-agreement',4_000_000+variant)
    assert raw['correctAnswer']==['are','is','are','is'][variant]
    subjects=['three folding tables','a small alcove','several numbered envelopes','one free-standing panel']
    assert '_____ '+subjects[variant] in raw['passage']
    assert {'is','are','being','be'}==set(raw['options'])


@pytest.mark.parametrize('variant',range(4))
def test_perfect_reference_is_completed_before_an_explicit_past_event(variant):
    raw=content.make('rw3-perfect-time-reference',4_000_000+variant)
    assert raw['correctAnswer']=='had'
    assert ['1912','1930','1924','1941'][variant] in raw['passage']
    assert '_____ already ' in raw['passage']
    assert set(raw['options'])=={'had','has','have','having'}


def test_precision_tables_are_defensively_copied():
    for family in ['rw3-table-baseline-change','rw3-table-reference']:
        raw=content.make(family,4_000_000)
        other=content.make(family,4_000_000)
        other['table']['rows'][0][1]=-999
        assert raw==content.make(family,4_000_000)
