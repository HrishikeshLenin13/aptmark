# Aptmark
### Free, focused SAT preparation — a working local foundation

Original-content pipeline + a real persistent practice application. **Not a finished public platform:** the inventory currently contains **4,555 candidates (4,500 Math + 55 Reading & Writing), 41 families, 30 skills, 0 human-approved, 0 published, 0 empirically calibrated.** The 10,000-published-question target remains open.

## Run locally
Requires Node 24+ (tested with 26.8.1), npm, and Python 3.10+ for the offline content tools.

```sh
cd .
npm ci
# Only when a local configuration does not already exist:
cp -n .env.example .env.local
node scripts/admin-token.mjs
npm run dev
```
Study-day calculations use America/Chicago for this local workspace, matching the supplied user timezone.

Open [Aptmark locally](http://127.0.0.1:3000). The server binds to loopback only. `CONTENT_PREVIEW=true` explicitly enables visibly labelled unapproved candidate practice. Without it, only approved/published content is eligible. A private administrator token is stored in the ignored `.env.local`; enter it in Content studio to inspect answer keys and make actual editorial decisions. Do not share or commit that file.

A guest workspace persists to SQLite on this server. Optional local email/password accounts retain guest history on registration. Passwords use scrypt; sessions use random HttpOnly cookies and hashed stored tokens. Email verification, hosted authentication/recovery, and cloud synchronization are not configured.

## Working experiences
- Overview with genuine empty states, actual activity and explainable next steps.
- Custom sets by section, skill, difficulty, question count and mode; Math MCQ/SPR and short/paired reading passages, tables and deterministic SVG figures.
- Server-side scoring, equivalent numeric answers, explanation review, bookmarks, reasoning notes, autosaved drafts, student issue reports.
- Adaptive practice re-ranks unseen items after each submitted answer; repeated/hinted answers do not inflate independent mastery evidence.
- Conservative weighted Beta baseline, approximate uncertainty, spaced review, preference-based plans, skill analytics and mistake reflections.
- Short diagnostic and a timed Math engineering preview with server deadlines, autosave/recovery, navigator, review flags, submission locking, simple calculator and formula reference. Four-module locking/break logic has unit tests; validated full-length forms remain gated.
- Grounded **static** learning guide with progressive hints. No generative AI provider is connected or advertised as active.
- Restricted editorial queue with reviewer notes, approval/rejection, separate publication/unpublication and audit records; runtime reviewed-release export CLI.

## Content tools
```sh
uv venv .venv
uv pip install --python .venv/bin/python -r requirements.lock
.venv/bin/python python/pipeline.py generate --math 4500
.venv/bin/python python/pipeline.py validate --replay
.venv/bin/python python/pipeline.py dedupe
.venv/bin/python python/pipeline.py report
.venv/bin/python python/pipeline.py sample --count 20 --seed 2026
.venv/bin/python python/pipeline.py export-approved --output content/staging-approved.json
# Actual runtime editorial release, separate from generator staging:
node --env-file=.env.local --import tsx scripts/export-reviewed.ts
```
Generation is seeded, resumable and transaction-backed, with checkpoints, structured failures, content hashes, problem-text fingerprints, separate template clusters and atomic exports. Mathematics uses symbolic/independent arithmetic assertions. Reading validation is structural, not a proof of answer unambiguity. Original reading scenarios are explicitly self-contained/hypothetical; no invented real research, quotes or attributions are used. Generator output never self-approves. Question instances within a family are not advertised as unique families. Semantic-embedding deduplication and general editorial validity remain unverified.

## Verify
```sh
npm test
npm run typecheck
npm run build
.venv/bin/python -m pytest tests/test_content.py -q
.venv/bin/python python/pipeline.py validate --replay
npm run test:e2e
npm audit
npm run model:evaluate
```
Playwright starts a separate loopback server on port 3001 with a fresh isolated test database and a separate Next output directory. QA-generated approvals are test fixtures only, never real editorial decisions in the local app. Screenshot and accessibility evidence is in `evidence/`; a production build and automated axe checks do not certify a public launch.

## Structure
- `python/` — taxonomy, seeded Math/reading generators, validation/coverage/export pipeline.
- `content/` — original candidate export, taxonomy, manifests, reviewed export.
- `src/lib/` — types, SQLite persistence, auth, mastery/recommendation, assessment state machine, arithmetic parser.
- `src/app/api/[...path]/route.ts` — validated owner-scoped API.
- `src/components/` — responsive application, accessible dialogs, question/math/figure rendering.
- `migrations/` — unexecuted PostgreSQL/Supabase RLS scaffold; not an active backend adapter.
- `tests/` — TypeScript/Python/property and actual-browser integration tests.
- `docs/` — primary-source research, specification, competitor observations, architecture, operations and remaining roadmap.
- `IMPLEMENTATION_STATUS.md` — current acceptance status and exact resume commands.
- `VERIFICATION.txt`, `DIFF_FILE.patch`, `ROLLBACK.sh` — bounded preview-policy change and tested rollback evidence.

## Remaining before public release
Human editorial validation and 10,000 published questions; stronger reading/family/distractor diversity; real student model evaluation and calibration; validated preassembled full-length forms and genuine route-pool selection; cloud database/auth adapters and RLS integration tests; email recovery; hosted grounded AI with cost controls; full exam-tool parity/offline write recovery; privacy/consent/retention and independent security/accessibility review. No public deployment, service purchase, score-prediction accuracy or learning-outcome claim has been made.

## References
Current test structure, domains, and tools were checked against [College Board](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure), its [assessment framework](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf), and [Bluebook testing tools](https://bluebook.collegeboard.org/students/tools). Detailed links and distinctions between official facts and local assumptions are in `docs/RESEARCH.md` and `docs/SAT_SPECIFICATION.md`.
