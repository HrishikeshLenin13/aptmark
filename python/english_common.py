"""Shared construction for finite, original Reading and Writing method catalogs.

No official passages or answer options are reused. A blueprint describes a task
and an instructional heuristic, not an empirically validated scoring formula.
"""
import random
from copy import deepcopy

FRAMEWORK = 'https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf'


def make_item(family, seed, passage, stem, right, wrong, evidence, steps, blueprint,
              difficulty='medium', demands=(), table=None, topic='general'):
    """Build one authored variant; the seed changes order, not content volume."""
    if len(wrong) != 3 or len(steps) < 2:
        raise ValueError('Require three explained distractors and at least two reasoning steps.')
    if not evidence or any(not quote or quote not in passage + ' ' + stem for quote in evidence):
        raise ValueError('Evidence must quote exact nonempty spans from this original item.')
    options = [right] + [option for option, _ in wrong]
    if len(set(options)) != 4 or any(not x.strip() for x in options):
        raise ValueError('Require four distinct nonempty options.')
    if any(not rationale.strip() for _, rationale in wrong):
        raise ValueError('Every distractor needs an item-specific explanation.')
    if not 150 <= len(passage) <= 900 or len(passage.split()) < 20:
        raise ValueError(f'Passage outside structural bounds: {len(passage)} characters.')
    if blueprint.get('variants') != 4:
        raise ValueError('This catalog requires exactly four explicitly authored variants.')
    for key in ('skill', 'method', 'formula', 'structure', 'misconceptions'):
        if not blueprint.get(key):
            raise ValueError('Missing blueprint field: ' + key)
    random.Random(f'{family}:{seed}:choices-v3').shuffle(options)
    reason = ' '.join(steps)
    return {
        'stem': stem, 'passage': passage, 'options': options, 'correctAnswer': right,
        'steps': list(steps), 'explanation': reason, 'difficulty': difficulty,
        'verification': 'method-mapped-structure-checked-editorial-required',
        'diagram': None, 'table': deepcopy(table), 'generatorVersion': '3.0.0',
        'distractorExplanations': {right: reason, **dict(wrong)},
        'answerEvidence': {'quotes': list(evidence), 'reasoning': reason},
        'alignment': {
            'source': FRAMEWORK, 'frameworkVersion': '4 (September 2026)',
            'basis': 'Public skill and task descriptions; passage, options, and explanations independently authored.',
        },
        'qualityMetadata': {
            'difficultyBasis': list(demands) or ['Apply the stated method to the supplied context.'],
            'passageOrigin': 'original hypothetical context', 'topic': topic,
            'reviewFlags': ['independent-human-editorial-review-required',
                            'difficulty-is-provisional', 'semantic-uniqueness-not-established'],
        },
        'solutionMethod': {
            'blueprintId': family, 'skill': blueprint['skill'], 'method': blueprint['method'],
            'formula': blueprint['formula'], 'structure': blueprint['structure'],
            'misconceptions': list(blueprint['misconceptions']),
            'variantIndex': seed % 4, 'authoredVariantCount': 4,
            'formulaStatus': 'instructional-heuristic-not-score-formula',
        },
    }
