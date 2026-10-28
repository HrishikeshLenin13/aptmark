# English question bank: method before volume

Updated 2026-10-27. Reading and Writing comes first; this batch adds no Math.

## What was added

**212 independently authored candidate contexts across 53 structural families and all 11 Reading and Writing skills.** There are four written variants per family, not an unlimited stream of noun swaps. The bank now contains **817 Reading and Writing** and **4,800 unchanged Math** candidates: **5,617 total**, across 128 reported families. All 5,405 pre-catalog records retain their complete data and content hashes. A second 12-item batch also preserves every record from the first 156-item catalog commit.

These are original SAT-style practice candidates. They follow public task patterns and the four-option format, but are not official questions, reconstructions of secure items, or a claim of equivalent difficulty. The sources used for task alignment are College Board’s [public question-stem guide](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing) and [Assessment Framework, version 4, September 2026](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf), especially Appendix B. Their passages and options were not used as templates.

## Coverage and solution methods

| Skill | New families | New candidates | Method focus |
| --- | ---: | ---: | --- |
| Central ideas and details | 5 | 20 | Integrate a narrative shift, preserve a qualified argument, reconcile observations, retrieve a constrained explicit detail. |
| Textual evidence | 4 | 16 | Match a quotation to an interpretation, distinguish mechanisms, test an alternative cause. |
| Quantitative evidence | 4 | 16 | Match a table comparison to a claim, track a full sequence, compare groups within conditions. |
| Inferences | 4 | 16 | Apply necessary conditions, bound a conclusion by available evidence, trace a mechanism. |
| Words in context | 4 | 16 | Predict precise meaning, select a local sense, use contrast or restatement. |
| Text structure and purpose | 4 | 16 | Identify the overall aim, a portion’s contribution, and the sequence of rhetorical moves. |
| Cross-text connections | 4 | 16 | Find qualified agreement, isolate a disputed proposition, apply counterevidence without overclaiming. |
| Rhetorical synthesis | 4 | 16 | Select notes for a named audience, compare on a requested dimension, connect an example to a goal. |
| Transitions | 4 | 16 | Distinguish result, concession, example, clarification, and procedural order. |
| Boundaries | 9 | 36 | Check clause completeness, paired insertions, colon introductions, unbroken dependencies, coordination, subordination, series separators, and conjunctive-adverb joins. |
| Form, structure, and sense | 7 | 28 | Subject–verb and pronoun agreement, finite/nonfinite verbs, tense/aspect, modifiers, and possessives/plurals. |

The [machine-readable catalog](../content/blueprints/english-methods.json) records each family’s method, rule or heuristic, structure, misconceptions, finite variant count and stable seed base. “Formula” means a grammatical rule or instructional reasoning aid—not a universal English-solving algorithm or an SAT score formula. The catalog covers every taxonomy skill, not every possible SAT item or difficulty level. More demanding series, punctuation around quotations, nuanced inferences, complex prose, and further independently authored contexts remain next expansion areas.

## Per-question record

- Original passage, one task and four distinct options; exactly one recorded key.
- At least two contextual reasoning steps and an explanation for every option.
- Exact evidence spans in the passage or stem. Presence is checked; semantic entailment still requires editorial judgment.
- A method/structure link, misconception tags, provisional reasoning demands, immutable seed and explicit family cluster.
- Original-content provenance and separate candidate, editorial and publication states.
- Quantitative items supply labeled, rectangular tables with units and self-contained invented data.

New method metadata participates in the content fingerprint and stays private in student API payloads before grading. The server retains answer checking. Paired passages and bulleted research notes render using the existing passage layout. The full [212-item editorial pack](../content/reviewed/english-methods.md) includes the keys and blank reviewer/decision/notes fields; it is not a student quiz.

## Generation and quality controls

The English-only command creates at most four authored variants per catalog family, in a transaction. Stable family-derived seeds do not shift when another family is added. A conflicting existing item aborts the batch instead of silently overwriting it. Repeating the same command inserts zero items and leaves the bank byte-identical. Fresh-clone hydration and partial-to-full resume are tested.

```sh
npm run content:english
.venv/bin/python python/pipeline.py validate --replay
npm run content:english-review
```

The [batch manifest](../content/manifests/english-methods.json) reports skill counts and key positions. Exact problem hashes exclude option order, so shuffling does not inflate uniqueness. Structural checks include evidence membership, complete option rationales, passage-length bounds, table shape and method fields. Family reuse remains explicitly reported; semantic equivalence, difficulty and educational effectiveness are not established by these controls.

## Review state and next work

**0 human-approved, 0 published, 0 empirically calibrated.** Generation never publishes. Independent editorial review must check competing interpretations, every distractor, grammar, fairness, reading demand and topic balance. Provisional difficulty labels are not measured SAT difficulty. The larger Reading and Writing target remains open; adding volume does not satisfy the published-content gate.

Initial integration checks caught truncated source files, one incorrectly capitalized evidence span, a mutable shared table that a negative test could contaminate, vocabulary article mismatches, and a potentially valid noun-modifier distractor. The files were completed, the evidence and distractors corrected, and returned table data isolated with a deep copy. Verification evidence records the corrected runs rather than treating the failed attempt as acceptance.

### Reusable authoring brief

```text
Author a new, original Aptmark Reading and Writing candidate for the named skill.
Start with its public task pattern and a specific reasoning or grammar method.
Write a self-contained passage and four choices without copying or paraphrasing
an existing question. Solve it independently, explain why each distractor fails,
and identify exact passage evidence. Record method, structure, provenance and
provisional demands. Check competing valid interpretations; revise ambiguities.
Keep the item pending for a named human editor. Do not invent review approval,
calibration, source quotations, or evidence of student effectiveness.
```

## Depth batch — 2026-10-27

The next 44 contexts add four per skill, retaining all 5,573 records from the prior release of the candidate bank. They extend bounded claims, intermediate evidence, unequal-denominator tables, evaluative vocabulary, rhetorical questions, conditional cross-text comparisons, qualified synthesis, correction transitions, paired dashes and embedded predicates. See [the depth-batch record](ENGLISH_DEPTH.md) for scope, numerical checks and review limits. The familiar public task types are reused deliberately; family counts do not establish independent educational novelty.
