# Pacing lab

A small timed set connects the existing question bank to a focused study session. This is original-content practice, not a validated SAT form or an official timing/score model.

## Student experience
- `/drills` defaults to Reading & Writing and supports all 11 English skills; Math remains available from the existing bank. This feature does not generate or modify questions.
- Choose a section, optional skill, provisional difficulty, 5/10/15/20 questions, and a 3/5/10/15-minute budget. Presets adjust count and time, not the chosen subject.
- An unavailable combination produces an inline explanation. No undersized session or silent difficulty substitution is created.
- Answers, flags, and notes share the assessment workspace. The absolute deadline survives navigation and refresh; the clock cannot be paused. Near-deadline warnings remain visible even if the timer was hidden.
- A focus-managed alert dialog confirms irreversible submission, starts with the non-destructive return action, and retains a submission error for retry.
- Locked results show raw correct/answered counts, elapsed time capped at the budget, and question-by-question explanations. Saved history identifies the subject and time budget. No invented improvement, ranking, or predicted SAT score appears.

## Server contract
`POST /api/exam/start` accepts `mode: "drill"`, `section: "rw" | "math"`, an optional section-matching skill, a supported count/time, and `difficulty: "all" | "easy" | "medium" | "hard"` (default `all`). Identity comes only from the session. Creation and the single-active-session check share a SQLite immediate transaction; a second start resumes the existing timed assessment instead of creating a competing clock.

Selection uses the same publication eligibility gate as ordinary practice. Candidates remain local-preview-only. The public payload omits answer keys, hints and explanations before locking. Reads, writes, submission and review are owner-scoped. Expired modules lock on server read; repeated reads/submissions do not duplicate response records.

Timed-assessment attempt records explicitly label `timingSource: "module-average"`: elapsed module time divided by its question count is an allocation, not measured time on that individual question. Independent practice records use `question-elapsed`. Existing unlabelled records are not retroactively relabelled or fabricated. Dashboard/history wording distinguishes recorded time from a precise measure of all study time.

## Design decisions
Keep the existing paper/white surfaces, forest-green actions, muted text and system sans. A desktop builder and narrow guidance column collapse to one reading column; form labels remain left aligned. Remove the redundant large introductory panel so mobile learners reach the actual set controls sooner. No new fonts, decorative animation, gradients, or competitive score graphics are introduced.

## Acceptance
Unit contracts cover every supported section/count/time combination, exact-deadline writes, filter/count mismatch, configuration snapshots, completion and elapsed-time bounds. Browser tests cover the real API/UI round-trip, unavailable inventory, all 11 English skills, answer privacy, ownership, recovery, expiry, duplicate-start protection, submission retry, keyboard focus and automated accessibility/overflow checks at 1440/820/390 px. See `evidence/pacing-completion/VERIFICATION.txt` for commands and observed results. Automated checks do not replace independent accessibility, editorial or psychometric review.
