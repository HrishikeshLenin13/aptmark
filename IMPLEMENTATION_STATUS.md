# Aptmark implementation status

Updated: 2026-10-27. Active local development; not a complete or hosted release.

## Implemented
- SAT specification and source research, a 30-skill taxonomy, and weighted coverage allocation.
- Deterministic Python/SymPy generation, resumable SQLite checkpoints, mathematical checks, structural validators, fingerprints, family clusters, coverage, export, and sampling tools.
- Next.js/React/strict TypeScript application with a responsive, original Aptmark design system.
- Persistent local guest and email/password accounts; server sessions, drafts, history, bookmarks, deletion, and owner-scoped data access.
- Server-authoritative answer checking, explanations, issue reports, reasoning notes, and mistake reflections.
- Interpretable first-exposure mastery baseline, uncertainty, spaced review, deterministic explainable selection, preference-based planning, and real-record analytics.
- Time-based assessment state machine, locking and recovery; a diagnostic and Math preview.
- Searchable 12-lesson original foundation preview library, worked examples, server-graded understanding checks, version-aware completion and owner-isolated progress. These checks do not update independent practice mastery.
- Refined desktop/tablet/mobile spacing and reading sizes, keyboard workspace search, a focus-managed mobile drawer, and vocabulary/challenge/bookmark shortcuts.
- Grounded static learning guide with progressive hints; no connected generative AI tutor.
- Token-protected editorial queue with review notes, approval/rejection, publication/unpublication, and audit records.
- PostgreSQL/Supabase migration scaffold; no active cloud adapter.

## Content inventory
The pipeline contains 4,800 Math and 761 Reading and Writing candidates (5,561 total), across 30 skills and 114 generator families/clusters. All require human editorial review. **0 approved, 0 published, 0 empirically calibrated.** Automated validation does not establish educational validity. The target of 10,000 published questions remains open.

## Earlier website verification record
- 48 TypeScript tests and 83 Python tests passed.
- 17 isolated browser integration tests passed for practice, scoring, key privacy, drafts, bookmarks, notes, account lifecycle, assessment recovery, diagnostic transitions, ownership isolation, and publication gates.
- All 5,405 candidates replayed from recorded seeds with zero mismatches or structural failures; exact problem-text duplicate count is zero. The 75 template clusters remain separately reported.
- Production build and strict TypeScript checks passed.
- Automated axe checks passed at 1440, 820, and 390 px for the dashboard and mobile practice; no horizontal overflow was observed at those viewports. These checks are not a WCAG conformance certification.
- npm audit reported zero known vulnerabilities in the recorded check.
- The final QA browser console had zero errors. The live candidate inventory still has zero editorial approvals or publications; QA approvals existed only in isolated test databases.

Initial checks found and fixed recommendation-field shadowing, same-origin hostname handling, an empty punctuation option, duplicate questions hidden by choice shuffling, password labeling, locked-module error ordering, low contrast, a mobile off-canvas transition, and a duplicate-initial-load race that could reset a fresh answer. Failed intermediate runs are not recorded as passing acceptance checks.

## Current routes
`/`, `/welcome`, `/practice`, `/learn`, `/planner`, `/analytics`, `/mistakes`, `/tests`, `/exam`, `/content`; server endpoints under `/api/`.

## Remaining acceptance work
Independent editorial review and 10,000 published items; broader family/distractor diversity and advanced reading quality; psychometric calibration and student-outcome evaluation; validated full-length forms and route pools; cloud/PostgreSQL adapter and RLS tests; hosted authentication and email recovery; grounded AI provider; production privacy/consent/security/accessibility review; full exam tool parity, offline write queue, and stronger version-pinned forms. See the [roadmap](docs/PROJECT_ROADMAP.md).

## Resume
See [Development notes](docs/DEVELOPMENT.md) for local preview, content workflow, and verification commands. Keep local environment and database files out of version control.

## Content expansion — 2026-10-18
- Checked the official framework version 4 (September 2026) and public task/skill descriptions. New material is original, not copied official questions.
- Added 22 evidence-mapped Reading and Writing families and 12 exact-verified Math families; generated 25 pending candidates per family (850 new). The original 4,555 item IDs and hashes remain unchanged.
- Reading now carries passage evidence, item-specific distractor rationale and difficulty basis. The private editorial queue filters generation batches and exposes that metadata. Student serialization is an explicit allowlist.
- Added a fresh-clone generator-DB bootstrap, bounded resumable expansion, per-skill coverage/difficulty/publication deficits, lexical/template duplicate reporting, and a representative 34-item review pack.
- See docs/CONTENT_QUALITY.md, content/manifests/quality-plan.json and evidence/content-expansion/ for current verification evidence.
- Next content priority: human review of representative families, correction of ambiguities/distractors, additional distinct reading/literature families and missing difficulty bands. The 10,000 approved/published acceptance gate remains unmet.
- Resume: `.venv/bin/python python/pipeline.py expand --per-family 25 --max-per-family 25` (idempotent); `validate --replay`; `plan`; `review-pack --per-family 1`.

## Website studio — 2026-10-18
- Website-first work now precedes large-scale question generation. The public OnePrep capability audit is recorded in docs/WEBSITE_DIRECTION.md; no full parity or educational superiority claim is made.
- The latest complete browser run passed 17 tests. The final mobile settings/focus correction also passed a separate three-test studio rerun. Lesson pages and understanding checks passed automated accessibility/overflow checks at 1440, 820 and 390px; screenshots were visually reviewed and inherited label direction was corrected.
- Production-mode verification returned zero visible unreviewed lessons and rejected lesson checks with 404. The lessons remain previews pending independent editorial review; there is no automatic lesson publication path.
- 43 TypeScript tests, 83 Python tests, strict typechecking, the production build and all 5,405 content seed replays passed. Evidence is under evidence/website-studio/. A first lesson unit run referenced a nonexistent taxonomy filename; it failed, was corrected, and the rerun passed.
- Upcoming website milestones: portable study-plan calendar export, bounded persistent pacing drills, and deeper onboarding and study-flow refinement. Existing publication, identity and mastery boundaries remain intact.

## Portable calendar export — 2026-10-18
- Added authenticated, owner-derived .ics downloads from the planner. Events use all-day date values, exclusive next-day ends, private non-cacheable responses, escaped text and Unicode-safe line folding. No email/raw account IDs or session tokens are embedded.
- Five calendar unit tests and one isolated download/ownership/accessibility browser test passed. The latest complete suite remains the 17-test studio run; this additional calendar test passed separately.
- Calendar screenshots passed automated accessibility and overflow checks at 1440, 820 and 390px and were visually inspected. This is portable export, not external calendar sync. See docs/CALENDAR_EXPORT.md and evidence/calendar/.

## English method catalog — 2026-10-27
- Current user priority: original SAT-style Reading and Writing generation across all 11 skills; defer Math expansion. The earlier website-first note is historical, not the present generation priority.
- Added 156 separately authored contexts in 39 families, with four finite variants each. Methods, rules/heuristics, structures, evidence and option-specific rationales are retained. The command adds no Math; all 5,405 prior records are unchanged.
- Generator version 3.0.0 hashes method metadata, bounds the authored catalog, aborts collisions, and keeps candidate/publication states separate. Repeated generation inserts zero.
- See docs/ENGLISH_METHODS.md, content/blueprints/english-methods.json, the complete editorial pack and evidence/english-methods/. No human approvals, publications or empirical calibration are asserted.
- Prior uncommitted pacing work remains separate from this English content change; its earlier browser failures are not represented as passing verification.
- English verification: 129 Python tests; 187 TypeScript workspace tests (182 excluding the separate pacing work); typecheck and production build passed. The corrected focused browser run passed five English/studio tests. Earlier failing browser attempts are retained in the evidence and are not acceptance runs. The broader English integration run is recorded separately when complete.
