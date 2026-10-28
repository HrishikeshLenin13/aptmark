"""Finite English-only catalog. Stable family seeds do not depend on list order."""
import hashlib


def registry():
    import english_information
    import english_craft_expression
    import english_conventions
    import english_detail_boundaries
    import english_depth
    import english_reasoning
    rows = []
    for module in (english_information, english_craft_expression, english_conventions, english_detail_boundaries, english_depth, english_reasoning):
        for skill, families in module.FAMILIES.items():
            for family in families:
                blueprint = module.BLUEPRINTS[family]
                if blueprint['skill'] != skill or blueprint['variants'] != 4:
                    raise ValueError('Invalid English blueprint: ' + family)
                # A multiple of four keeps variant selection independent of the
                # family hash. Every name owns a fixed, disjoint four-seed slot.
                base = 3_000_000 + int(hashlib.sha256(family.encode()).hexdigest()[:8], 16) * 4
                rows.append((skill, family, base, blueprint, module.make))
    if len({row[1] for row in rows}) != len(rows) or len({row[2] for row in rows}) != len(rows):
        raise ValueError('Duplicate family name or seed slot; resolve before generation.')
    return sorted(rows, key=lambda row: row[1])


def make(family, seed):
    for _, name, base, blueprint, generator in registry():
        if name == family:
            if not base <= seed < base + blueprint['variants']:
                raise ValueError('Seed outside the finite authored variant catalog.')
            return generator(family, seed)
    raise ValueError('Unknown English family: ' + family)


def blueprint_manifest():
    from english_common import FRAMEWORK
    return {
        'schemaVersion': 1, 'generatorVersion': '3.0.0',
        'source': FRAMEWORK, 'frameworkVersion': '4 (September 2026)',
        'sourceUse': 'Task categories only; original passages and options.',
        'formulaStatus': 'instructional-heuristic-not-score-formula',
        'editorialStatus': 'pending', 'publicationStatus': 'candidate',
        'families': [
            {'id': family, 'seedBase': base, **blueprint}
            for _, family, base, blueprint, _ in registry()
        ],
    }
