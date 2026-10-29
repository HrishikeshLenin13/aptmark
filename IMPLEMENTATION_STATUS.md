# Aptmark implementation status

Updated: 2026-10-29. Active local development; not a complete or hosted release.

## Implemented
- SAT specification and source research, a 30-skill taxonomy, and weighted coverage allocation.
- Deterministic Python/SymPy generation, resumable SQLite checkpoints, mathematical checks, structural validators, fingerprints, family clusters, coverage, export, and sampling tools.
- Next.js/React/strict TypeScript application with a responsive, original Aptmark design system.
- Persistent local guest and email/password accounts; server sessions, drafts, history, bookmarks, deletion, and owner-scoped data access.
- Server-authoritative answer checking, explanations, issue reports, reasoning notes, and mistake reflections.
- Interpretable first-exposure mastery baseline, uncertainty, spaced review, deterministic explainable selection, preference-based planning, and real-record analytics.
- Time-based assessment state machine, locking and recovery; a diagnostic, Math preview, and configurable English/Math pacing lab with saved deadlines and locked post-set review.
- Searchable 12-lesson original foundation preview library, worked examples, server-graded understanding checks, version-aware completion and owner-isolated progress. These checks do not update independent practice mastery.
- Refined desktop/tablet/mobile spacing and reading sizes, keyboard workspace search, a focus-managed mobile drawer, and vocabulary/challenge/bookmark shortcuts.
- Grounded static learning guide with progressive hints; no connected generative AI tutor.
- Token-protected editorial queue with review notes, approval/rejection, publication/unpublication, and audit records.
- PostgreSQL/Supabase migration scaffold; no active cloud adapter.

## Content inventory
The pipeline contains 4,800 Math and 1,017 Reading and Writing candidates (5,817 total), across 30 skills and 178 generator families/clusters. All require human editorial review. **0 approved, 0 published, 0 empirically calibrated.** Automated validation does not establish educational validity. The target of 10,000 published questions remains open.

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
`/`, `/welcome`, `/practice`, `/learn`, `/drills`, `/planner`, `/analytics`, `/mistakes`, `/tests`, `/exam`, `/content`; server endpoints under `/api/`.

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

## Detail and boundaries extension — 2026-10-27
- Added 12 further original candidates: explicit-detail retrieval, simple series separators, and semicolon/conjunctive-adverb boundaries. English inventory is now 773; total inventory 5,573 across 117 families.
- All 5,561 records from the prior catalog commit remain unchanged, including all 4,800 Math records. The complete English catalog is 168 candidates across 42 finite families.
- Added a read-only, pinned-action GitHub content workflow for Python contracts, complete seed replay, and fresh-clone English idempotency; it does not publish or deploy content.
- Final supplemental verification: 134 Python tests; 187 workspace TypeScript tests (182 excluding the separate pacing work); typecheck and production build; 20 selected browser integration tests all passed. All 5,573 seeds replayed without mismatches, and real full-bank fresh-clone generation was byte-identical. The three uncommitted pacing browser tests are not included in that 20-test claim.
- GitHub Content regression and Core regression passed on the new content-workflow commit (5be87ea); final supplemental-commit workflow status is checked after push. See docs/CONTENT_CHECKS.md.

## English depth batch — 2026-10-27
- Added 44 original contexts, four in each of the 11 English skills; the method catalog now has 212 candidates across 53 authored families. The bank contains 817 English and 4,800 Math candidates (5,617 total, 128 total families).
- All prior 5,573 complete records remain unchanged. Additional tests independently verify the unequal-denominator percentages, paired dash structure, embedded-predicate keys and full-bank preservation. Candidate approval/publication/calibration remain zero.
- GitHub content CI includes the depth-batch contracts. New browser tests exercise all 44 keys, one wrong response per skill, private metadata, table/grammar rendering and automated accessibility. See docs/ENGLISH_DEPTH.md and evidence/english-depth/. Verification results follow the completed runs, not this implementation note.
- Final depth verification (2026-10-28): 167 Python tests, 182 committed-scope TypeScript tests (187 including five separate pacing tests), typecheck, build, all 5,617 seed replays and 22 selected browser integration tests passed. Every new key, representative wrong responses and content-version hashes were verified against the real server. All prior 5,573 complete records and all Math records remain unchanged. Two draft-only rationale corrections are recorded; no independent human review is implied.

## Private English method review — 2026-10-28
- The existing English method catalog is now directly selectable in the private studio. Complete family facets, matching-state counts and bounded pagination expose all 212 contexts across 53 families and all 11 English skills; the bank remains 817 English and 4,800 Math candidates (5,617 total). This feature generates no questions or editorial decisions.
- A private method inspector shows the authored variant, blueprint, solution method, rule/heuristic, structure, reasoning steps and distractor patterns. Legacy generations retain their original metadata and display an explicit no-blueprint notice. Student serialization remains unchanged.
- Item notes reset across filters/selections and stay disabled during loading. Real out-of-order response and held-write tests verify that Lock clears access locally, permits reopening while an old request is pending, and prevents old callbacks from changing newer review controls. The tests abort held review writes before server delivery; they do not record decisions.
- Verification: 188 committed-scope TypeScript tests (193 workspace tests including five separate pacing tests), 167 Python tests, all 5,617 seed replays, strict typechecks and production builds passed. The complete selected browser run passed 27 tests in a clean index export without pacing edits, including five new editorial contracts. Final screenshots use a separate editorial test database with no recorded review decisions. Earlier selector/setup failures remain in the evidence and are not passing acceptance runs.
- The catalog backend was independently committed and pushed as 50a7168; both GitHub regression workflows passed and GitHub linked the author to HrishikeshLenin13. The UI feature is a separate commit. No paid API or hosted deployment was used. Human approvals, publications and empirical calibration remain zero in the source bank.
- See docs/EDITORIAL_METHODS.md and evidence/editorial-methods/VERIFICATION.txt. Next content work remains original English depth and structure diversity; defer Math expansion. Unfinished pacing source and browser tests remain separate from this acceptance claim.


## English reasoning and structure — 2026-10-28
- Added 44 original contexts, four per Reading and Writing skill: narrative reappraisal, exclusive-cause counterevidence, crossover data, necessity controls, academic verb senses, concessions, analysis scales, procedural synthesis, summary transitions, complex series and relative possession. No Math expansion. Current inventory: 861 English + 4,800 Math = 5,661 candidates across 139 families; method catalog 256 contexts in 64 finite families.
- Every prior 5,617 complete record and every Math record matches saved full-record digests and content hashes. New questions retain exact seeds, explicit clusters, private method/evidence/rationale metadata and provisional calibration. One awkward transition was corrected before committing that candidate; no older record was changed.
- 204 Python tests, 188 committed-scope unit tests (193 including five separate pacing tests), strict typecheck, production build, all 5,661 seed replays, fresh-clone hydration and byte-identical repeat generation passed. The clean index export without pacing changes passed 29 selected browser tests, including all 44 new keys, representative distractors, privacy, paired texts, tables and grammar layouts. A copied dash assertion failed in the initial run and was corrected to test the new semicolon structure; that failed run is retained separately.
- The actual local preview had cached the previous bank. After refreshing its verified project-local Next dev process with the same startup command, the live API reports 5,661 candidates and 861 English. Eleven new skill representatives loaded with matching hashes; the temporary probe submitted no practice answers and its guest was deleted.
- Historical batch tests now select their immutable batch manifests instead of rejecting later additions. This preservation-contract change was independently pushed as 30aeba7; both GitHub workflows passed. The content workflow now also runs the new reasoning contracts.
- See docs/ENGLISH_REASONING.md, the batch manifest and 44-item review pack, and evidence/english-reasoning/VERIFICATION.txt. Source and live inventory still have 0 human-approved and 0 published candidates; independent editorial, accessibility, privacy, security and psychometric release work remains open. Unfinished pacing code remains separate; Math remains deferred.


## English precision batch — 2026-10-28
- Authored and integrated 88 original contexts: two finite four-context families per English skill. New structures cover contrasting evidence and conditional predictions, baseline changes and inclusive references, selection and fixed-part inferences, definitions and proposed tests across passages, procedural/rhetorical precision, integrated quotations, compound predicates, inverted agreement and past-perfect reference.
- Current inventory is 949 English + 4,800 Math = 5,749 candidates across 161 full-bank families. The method catalog has 344 contexts in 86 families. All 5,661 earlier complete records and every Math record retain their full-record digests, hashes, seeds, clusters and calibration labels. No Math expansion or automatic publication occurred.
- The authoring catalog and direct numerical/grammar contracts were independently pushed as b7de3c5; both GitHub workflows passed before activation. Integration added disjoint seed slots, the batch manifest, the 88-item review pack and global replay/preservation checks. The content workflow includes both authoring and bank-integration contracts.
- Verification passed: 277 Python tests; 188 committed-scope unit tests (193 including five separate pacing tests); strict typecheck; production build; all 5,749 seed replays; zero-insert, byte-identical repeat and fresh-clone generation. A clean index export without pacing changes passed 31 selected browser tests, grading all 88 keys plus one wrong answer per new family and checking private fields, hashes, tables, quotations, notes, paired texts and grammar layouts.
- Four draft quote-evidence spans were corrected before authoring commit/insertion. An eager table-test constructor and a copied browser attempt-count assertion failed in initial runs and were corrected without weakening the data checks. Failed runs remain separate from passing acceptance evidence.
- The local preview initially cached 861 English / 5,661 total. Refreshing its verified project-local Next dev process with the same startup command loaded 949 / 5,749. Twenty-two new family representatives loaded with matching hashes and no private fields. The temporary probe submitted no practice answers and its guest was deleted.
- See docs/ENGLISH_PRECISION.md and evidence/english-precision/VERIFICATION.txt. Source and live inventory still have 0 human-approved, 0 published and 0 empirically calibrated candidates. Full platform acceptance and independent review remain open; unfinished pacing work stays separate, and Math remains deferred.

## Pacing lab — 2026-10-28
- `/drills` now provides real configurable English/Math timed sets, defaulting to Reading & Writing. All 11 English skills can assemble a bounded set from eligible candidates.
- Skill/difficulty filters, supported count/time budgets, saved absolute deadlines, answer/flag/note persistence, ownership checks, locked explanations and subject-labelled recent history reuse the real assessment engine. Concurrent starts reuse one saved session.
- A keyboard/focus-managed alert dialog confirms final submission and retains actionable errors for retry. Assessment tool buttons retain accessible names and 44px touch targets in compact layouts.
- Timed-attempt records identify module-average time rather than presenting it as measured time on each question. No improvement or SAT-score estimate is inferred from a pacing result.
- Exact clean-index checks passed: 196 TypeScript tests, 277 Python tests, all 5,749 seed replays, typecheck, production build and 38 browser tests. Automated axe/overflow checks passed at 1440/820/390px; desktop and mobile renders were inspected. See docs/PACING_LAB.md and evidence/pacing-completion/VERIFICATION.txt for scope and retained failures.
- Content remains unchanged: 949 English + 4,800 Math candidates, zero human approvals/publications/calibrated items. Full validated forms and the broader release gates remain open.

## Assessment save recovery — 2026-10-28
- Versioned in-memory assessment writes preserve newer answers, flags and controlled notes across background reads and delayed/failed acknowledgements. Queued intermediate edits are coalesced, and the saved indicator waits for the last acknowledgement.
- Failed work remains retryable in the open workspace; reconnection also retries it. Compact layouts now retain the saving indicator. A native close/reload prompt protects unresolved work, without claiming durable offline persistence.
- Server locks remain authoritative. Unreceived work is explicitly ungraded and inspectable; expired-module drafts are retired so they do not block the next diagnostic module. Account/assessment changes remount isolated client state.
- Clean-index acceptance passed 206 TypeScript tests (including 10 new queue contracts), 277 Python tests, all 5,749 seed replays, typecheck, production build and 45 browser tests (including 7 network-fault cases). See evidence/assessment-sync/VERIFICATION.txt for commands, retained failures and component-only rollback. Durable offline storage, multi-device conflict resolution, and the wider release requirements remain open.

## Reference comparison — 2026-10-28
- Refreshed the primary-source College Board/OnePrep comparison across eight capabilities, with explicit Aptmark evidence and remaining acceptance gates.
- A structured audit validates provider attribution, HTTPS primary sources, review dates, evidence paths and the distinction between public descriptions and local previews. Reviews older than 30 days require a source refresh; schema/freshness checks are not independent quality or outcome verification.
- Ongoing feature milestones retain the two-provider comparison requirement in AGENTS.md. The requested contribution target remains distinct from learning outcomes, published content and GitHub profile-window counts.
- Final clean-index checks passed 214 TypeScript tests, 277 Python tests, all 5,749 seed replays, typecheck, production build and 45 browser tests. The earlier 42/45 browser attempt is retained separately; see evidence/reference-audit/VERIFICATION.txt. No content or runtime application changes were made in this milestone.

## Genuine development progress — 2026-10-29
- Added a read-only 1,000-work-unit target report that excludes empty/merge-only commits and verifies each pinned default-branch commit's GitHub author association. Existing dates, authorship and history remain intact.
- Repository history, author-associated work units and GitHub's separate profile contribution window are independently labelled. Missing, truncated or inconsistent profile data remains unknown; daily bucket counts are weighted by commitCount rather than mistaken for contribution totals.
- CI now fetches complete history, checks the dated College Board/OnePrep evidence audit and emits an offline history summary without inferring GitHub profile contributions. No student workflow, bank record, public deployment or quality/publication gate changed.
- Clean-index acceptance passed 227 TypeScript tests, 277 Python tests, all 5,749 seed replays, typecheck, production build and 45 browser tests. Real pre-push verification observed 167 author-associated main commits and 83 separate profile-window contributions; these dated observations are not a promise of future graph totals. See docs/DEVELOPMENT_PROGRESS.md and evidence/development-progress/VERIFICATION.txt.


## English application families — 2026-10-29
- Added 44 original contexts in 11 finite families, four per English skill. The batch includes revised interpretations, discriminating controls, condition-specific mean gaps, necessary conditions, contextual word senses, concessions, cross-text evaluation criteria, audience-aware notes, contrast transitions, conjunctive-adverb boundaries and modifier attachment.
- Original stimuli, four choices, answer-specific rationales, exact evidence spans, methods, instructional heuristics, stable disjoint seed slots and provisional difficulty labels are retained. Existing 5,749 records and all 4,800 Math records are preserved; this is no Math expansion.
- Current inventory: 993 English + 4,800 Math candidates; 0 human-approved, 0 published, 0 empirically calibrated. A pending editorial pack and explicit batch manifest support independent review; generation is not publication.
- Clean-index checks passed 228 TypeScript tests, 321 Python tests, all 5,793 seed replays, zero-insert/byte-identical bank regeneration, typecheck, production build and 47 browser tests. All 44 keys and 132 distractors were server-graded; desktop/mobile checks and retained failures are documented in evidence/english-application/VERIFICATION.txt.


## Original literary reading — 2026-10-29
- Added 24 finite original contexts in six reading families: held tension in poems, action-based quotation evidence, limited narrative perspective, contextual word shades, final-image function and evidence-constrained cross-text interpretation.
- Eight original poems (four paired with original commentary) and sixteen fictional prose contexts carry specific interpretation-review flags, two-step reasoning and explained distractors. No real author, publication or study is falsely cited. All 5,793 prior records and all 4,800 Math records remain unchanged.
- The pending pack and manifest expose actual key positions, genres and descriptive option-length diagnostics. Current inventory is 1,017 English + 4,800 Math candidates, with 0 human approvals, 0 publications and 0 empirical calibrations. Reaching 1,000 English candidates does not satisfy the independent-review or larger platform gates.
- Clean-index acceptance passed 228 TypeScript tests, 361 Python tests, all 5,817 replays, byte-identical zero-insert bank generation, typecheck, build and 49 browser tests. All 24 keys/72 distractors were server-graded; poetry/paired-text screenshots were inspected. See docs/ENGLISH_LITERARY.md and evidence/english-literary/VERIFICATION.txt.
