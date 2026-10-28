# English depth batch

Updated 2026-10-28; authored batch 2026-10-27. This batch adds **44 original contexts**, four per Reading and Writing skill, to the unchanged 5,573-record bank. The resulting inventory is **817 English / 4,800 Math / 5,617 total**. The full method catalog contains 212 candidates in 53 authored families.

## Task and method matrix

| Skill | New family | Method focus |
| --- | --- | --- |
| Central ideas and details | Scope correction | Preserve a limited conclusion after a counterexample challenges a broad claim. |
| Textual evidence | Claim and assumption | Test the intermediate link a proposed explanation requires, not merely a compatible outcome. |
| Quantitative evidence | Unequal denominators | Compare proportions using their actual bases instead of ranking raw counts alone. |
| Inferences | Qualified completion | Carry an explicit limitation into an inference without reversing or universalizing it. |
| Words in context | Evaluative precision | Distinguish ambiguous, weak, careful and penetrating judgments from nearby but unsupported evaluations. |
| Text structure and purpose | Rhetorical questions | Relate a question to the assumption it challenges and the argument that follows. |
| Cross-text connections | Conditional positions | Preserve each author's conditions while comparing overlap and differences. |
| Rhetorical synthesis | Bounded findings | Report a finding while retaining a requested limit on causation, population, conditions or implementation. |
| Transitions | Correction and replacement | Connect an explicitly rejected reading or policy to its proposed replacement. |
| Boundaries | Paired dashes | Close an interruption and recover the main clause across a long modifier. |
| Form, structure, and sense | Embedded predicates | Distinguish the finite verb of a modifier from the missing predicate of the larger clause. |

The format follows the public [Reading and Writing task guide](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing) and [SAT framework](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf). Passages, findings, notes, quotations and answer options are independently authored. They do not reproduce or paraphrase existing official items. Hypothetical studies are identified as such. Difficulty labels remain provisional; more reasoning steps do not by themselves prove a measured SAT difficulty.

## Records and checks

The [batch manifest](../content/manifests/english-depth.json) identifies all 44 candidates and their 11 families. Each has four answer options, a key, exact evidence, two or more reasoning steps, a separate rationale for each option, method/structure metadata, stable seeds and an explicit similarity cluster. A [dedicated 44-item review pack](../content/reviewed/english-depth.md) isolates this batch; the [complete method pack](../content/reviewed/english-methods.md) also includes earlier families.

- Independent rational-arithmetic tests verify all four unequal-denominator comparisons, percentages and count/rate reversals. These are Reading and Writing data-evidence items, not Math-bank expansion.
- Structural checks verify matched dash completion and the intended main finite forms in the embedded-clause family. These checks are bounded, not a general grammar parser.
- Full-record digests and saved IDs/hashes protect every earlier candidate, including every Math record.
- Fresh-clone hydration and repeated generation must leave the bank byte-identical.
- Student serialization stays an allowlist. Methods, keys, evidence and rationales remain private until the appropriate server-graded feedback.
- Browser tests submit all 44 keys and representative wrong options to the real server, then check notes/tables/grammar layouts, overflow and automated accessibility on desktop and mobile.

## Editorial state

**0 human-approved; 0 published; 0 empirically calibrated.** An automated check can verify numerical relationships or data shape, not certify a unique defensible interpretation. The authoring pass is not independent human review. Editors should particularly inspect distractor plausibility, scope qualifiers, the difference between causal evidence and compatibility, and whether grammatical alternatives admit a competing reading. Family counts are explicit reuse clusters, not a claim of semantic independence.

Precommit checks requested clearer handwriting-attribution and unequal-duration-comparison rationales. Those draft corrections are retained in the evidence; it changed no previously committed question. Failed runs remain separate from passing acceptance results.

## Reusable review brief

```text
Independently solve the named English depth candidate before inspecting its key.
For every choice, state what the text actually supports and what the choice adds,
drops or reverses. Recompute table percentages from counts and denominators.
For grammar items, identify the main subject/predicate and complete the sentence
with each option. Report competing valid readings and proposed corrections.
Do not infer approval, calibration or instructional effectiveness from the tests.
Keep publication pending until a named human reviewer records a real decision.
```

## Final local verification

167 Python tests and 182 committed-scope TypeScript tests passed; the complete workspace run passed 187 including five separate pacing tests. Typechecking, the production build and all 5,617 seed replays passed. The selected browser suite passed 22 tests, including all 44 new keys, one wrong response per skill, matching content hashes, and desktop/mobile automated accessibility. The three unfinished pacing browser tests are outside this claim.
