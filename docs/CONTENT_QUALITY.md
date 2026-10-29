# Question quality and the next content milestone

## Current expansion

As of 2026-10-29, Aptmark contains **5,817 original candidates**: **4,800 Math** and **1,017 Reading and Writing**, spanning **178 explicit generator families** across the 30-skill local taxonomy. The modern finite English catalog contains **412 separately authored contexts in 103 families**, four contexts per family. The older 5,405-record foundation remains unchanged; subsequent English cohorts also preserve their recorded predecessors. Family counts, contexts and numerical variants are separate measurements, not interchangeable claims of educational independence. Every candidate still requires review: **0 human-approved, 0 published, 0 empirically calibrated**. See the [current status](../IMPLEMENTATION_STATUS.md) and [inventory manifest](../content/manifests/inventory.json) for the authoritative snapshot.

## Official alignment, original content

The research refresh checked College Board’s [Assessment Framework, Version 4, September 2026](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf), and its public [Reading and Writing task descriptions](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing) and [Math skill descriptions](https://satsuite.collegeboard.org/practice/student-question-bank/math). The [versioned blueprint registry](../content/blueprints/sat-alignment.json) maps each new family to its skill and reasoning demands.

These sources guide alignment, not copying. No official question or passage is ingested, lightly reworded, or stored as a generation template. Reading scenarios and datasets are independently authored and self-contained. They do not assert that invented studies actually occurred. This is task/skill alignment, not College Board endorsement or empirical equivalence to official item difficulty.

## What the new generators check

- Math uses exact arithmetic and symbolic identities, solutions, ranks, domains, or variances, paired where applicable with a separate arithmetic/substitution check.
- Reading records exact passage evidence spans and option-specific reasons. Validators check that spans occur, each option has a rationale, and the passage fits a six-character-word length proxy. These checks do **not** establish semantic entailment, a unique defensible interpretation, or SAT-level quality.
- New difficulty labels carry explicit reasoning demands, not just large-number heuristics. They remain provisional and uncalibrated.
- Content hashes protect question text, keys, explanations, evidence, rationales, alignment, and quality metadata for new items. Earlier items retain their original replay version and hashes.
- The v2 bounded batch creates at most 25 candidates per family; the v3 English catalog contains exactly four explicitly authored contexts per family. SQLite transactions/checkpoints preserve progress. Repeating the same expansion inserts zero additional items.
- A fresh clone rehydrates the ignored generator database from the committed bank rather than silently treating it as empty.
- Student APIs use an explicit field allowlist. Answer evidence, editorial notes, rationales and unknown future fields stay private before grading. The token-restricted editor exposes evidence, rationale, difficulty basis and source alignment for review.

## Diversity and remaining weaknesses

The [quality plan](../content/manifests/quality-plan.json) reports targets, actual candidates, approvals/publications, difficulty-band gaps, and family counts per skill. Exact text hashes detect identical problems; family clusters and number-normalized exact text expose template reuse. This is not embedding-based semantic deduplication. Many old Math items are numerical variations, and the new reading families also reuse structures across topics. Passing validators does not make them educationally independent.

The 5,500 Reading and Writing candidate target is still substantially underfilled. Several skills lack an estimated easy or hard band; these gaps are recorded rather than filled by relabeling items. More independently authored reading structures, literature, evidence complexity, distractor review, diagram types, and meaningful Math context variation remain necessary. No precise score conversion or published full-length form is unlocked by these candidate counts.

## Review before scaling

The [34-item representative review pack](../content/reviewed/review-pack.md) contains one item per new family, keys, evidence and distractor rationale, plus blank reviewer/decision fields. A qualified human editor should review answer unambiguity, grammar, plausible distractors, academic tone, fairness, accessibility and difficulty. An editor should record corrections in versioned generators and replay them before a release. No reviewer or approval is invented by the generator.

Core commands:

```sh
.venv/bin/python python/pipeline.py expand --per-family 25 --max-per-family 25
.venv/bin/python python/pipeline.py validate --replay
.venv/bin/python python/pipeline.py plan
.venv/bin/python python/pipeline.py review-pack --per-family 1 --output content/reviewed/review-pack.md
```

## Reusable editorial brief

```text
Review the named original Aptmark candidate against its skill and recorded source alignment.
Independently solve or interpret it before looking at its key. Verify every option, evidence
span, domain condition, diagram and explanation. Describe competing interpretations and
specific distractor flaws. Report estimated reasoning demands without claiming calibration.
Return proposed corrections and review notes; do not mark an item human-approved or publish
it unless a named human reviewer has actually made and recorded that decision.
```

## English method-first catalog — 2026-10-27

See [English methods](ENGLISH_METHODS.md) for the 212-item catalog, all-skill matrix, finite seed registry, full editorial pack, validation and remaining structural gaps. These items add explicit solution-method metadata to the hashed, private editorial record. No Math questions were generated or revised by this batch.

The [44-item depth batch](ENGLISH_DEPTH.md) adds explicit denominator oracles and more qualified argumentative contexts. Every prior 5,573-record entry is preserved; Math remains unchanged.


## Literary close-reading cohort — 2026-10-29
The [24-item literary cohort](ENGLISH_LITERARY.md) adds eight original poems (four paired with original commentary) and sixteen fictional prose contexts across six reading skills. These are not attributed to real authors or taken from published works. Explicit interpretation-review flags, exact quotation spans and option-specific explanations accompany the pending pack. The manifest reports choice-length diagnostics without treating them as a validity score. All 5,793 preceding records and all Math records remain unchanged.
