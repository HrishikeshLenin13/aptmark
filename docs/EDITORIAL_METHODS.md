# English method review workspace

The private content studio now opens the original English method catalog directly. It helps a reviewer inspect a question's intended method before recording a decision; it does not generate an approval or publish a candidate.

## What the reviewer sees

- A generation selector that includes the English method catalog (version 3.0.0).
- A family selector covering the entire skill- and generation-filtered catalog, not just the first 50 results. The current catalog has 212 authored contexts in 53 finite families across all 11 Reading and Writing skills.
- Matching, pending, recorded-approval and publication counts for the active filter. These are separate states, not interchangeable progress measures.
- Blueprint ID, authored variant position, solution method, rule or heuristic, question structure, reasoning steps and distractor patterns, alongside the existing evidence, option rationales, seeds and provenance.
- A legacy-generation notice when method metadata is absent. Existing questions are not assigned invented blueprints.

The review surface inherits Aptmark's paper, ink and green palette. Native labeled filters, visible keyboard focus, a bounded reading measure and a stacked mobile layout keep the additional information readable without introducing another design system.

## Behavior and boundaries

Family facets are calculated server-side after administrator authentication. Pagination is bounded and reports its actual range. Changing a skill or generation clears the previous family selection; an empty scope offers an explicit return to the English catalog rather than silently widening the filter.

Question-specific notes are cleared when changing the selected item or filter. A stale response cannot replace newer results, and locking the workspace clears the token and prevents an in-flight read response from reopening it. Review writes retain the existing server validation, human-review fields and session-derived identity. Locking does not undo a write already received by the server.

The private metadata is not added to the student question serializer. No candidate, key, seed, method, calibration label, approval or publication status changes as part of this feature. An instructional heuristic is not a score formula. All current method candidates remain provisionally uncalibrated and require independent human review.

## Reusable editorial brief

```text
Review this original English candidate independently before consulting its key.
Identify the tested skill, solve the item, and cite the exact passage evidence
or grammatical rule that makes one option uniquely correct. Check every
alternative for a distinct, plausible misconception. Compare the intended
method and structure with the actual task, and flag ambiguity, unsupported
inference, inaccurate data, attribution issues, or mismatched metadata.
Record specific review notes. Only the actual human reviewer supplies their
own name and records an editorial decision; do not infer approval from tests.
```

## Verification

Six new unit contracts cover complete facets, filtered counts, pagination, malformed offsets, read-only behavior and private/public serialization. Five browser contracts cover authenticated access, method inspection and legacy fallback, notes reset, real out-of-order server responses, lock/reopen recovery during a deliberately aborted review write, keyboard access, and automated accessibility/overflow checks at 1440, 820 and 390 pixels. Automated checks are not an accessibility certification or independent editorial review.

Recorded commands, outputs, screenshots, source hashes and a disposable-copy rollback check are in [the verification record](../evidence/editorial-methods/VERIFICATION.txt). The earlier unfinished pacing work is separate and is not included in this feature's browser acceptance claim.
