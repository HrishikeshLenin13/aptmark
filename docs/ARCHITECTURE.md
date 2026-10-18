# Architecture
## Working implementation
A strict-TypeScript Next.js App Router modular monolith. React renders an original Aptmark design system, customized shadcn-style button and Radix dialogs. KaTeX produces HTML and accessible MathML with trust disabled. Lucide supplies restrained icons. CSS tokens, responsive layouts, and reduced-motion support are local, with no font/CDN/advertising dependencies.

Python/SymPy generation is separate from the student web runtime. `python/pipeline.py` writes candidates transactionally with checkpoints in `content/candidates.sqlite`, exports an atomic JSON snapshot and a real coverage manifest. Named generator families are separately reported as template/similarity clusters. No LLM, paid call, or copied assessment content is used.

The web runtime imports the bank into a local SQLite WAL database (`data/folio.sqlite` by default; the internal filename is retained for local data continuity). Users, hashed sessions, attempts, drafts, bookmarks, tutor exposure, preferences, exam states, reports, editorial decisions, and rate-limit windows are persistent. Scoring and answer keys stay server-side. Public question serialization omits keys, explanations, hints, and distractor explanations before submission. Candidate previews require explicit local configuration. Publication remains an independent approval action.

Scrypt passwords, random 256-bit HttpOnly/SameSite=Strict session cookies, hashed stored tokens, exact same-origin POST checks, request schemas/size caps, prepared SQL, per-owner reads/writes, and authorization for answer-key/editorial endpoints are implemented. HTTPS enables Secure cookies. This local authentication is not a substitute for an independently reviewed hosted identity service. No verified email, password reset, MFA, or production consent flow is represented as implemented.

## Learning model
`beta-weighted-first-exposure-1.0` starts at Beta(2,2). Independent first responses update weighted successes/failures (easy: .6/1.3, medium: 1/1, hard: 1.3/.6). Assisted/exposed retries are excluded. Approximate 90% intervals show uncertainty. This is an interpretable experimental baseline, not a calibrated measure of latent ability or an official SAT score.

Retention uses a documented exponential half-life baseline (3+2×independent successes days). Review dates use 1 day after incorrect responses and a 3-day exponentially increasing successful-retry schedule capped at 30 days. These separate scheduling heuristics need empirical evaluation; the app does not claim a trained forgetting curve.

Recommendations rank low mean, wide interval, official domain weight, due evidence, recent misses, and prerequisite concerns. Adaptive practice re-ranks the unseen remainder after each submitted answer. Question selection penalizes exposure and repeated families and matches provisional difficulty after at least three independent observations. Reasons use real counts. Goals and weekly availability shape a forward-looking plan. Test-date proximity and target score are stored goals, not yet a validated learning-utility optimizer.

## Assessment
`src/lib/assessment.ts` is a four-module state machine with absolute deadlines, locking, section break, raw grading, and a documented provisional route threshold. The public API offers a short diagnostic and a 22-question Math engineering preview; full-length forms are release-gated. Diagnostic progression has no ten-minute break. No official-score conversion is performed. The state machine currently records a provisional route marker; selecting among preassembled higher/lower validated forms, calibration, and empirically validated routing are unfinished.

## Tutor
The active provider is grounded static guidance, not an AI chatbot. Levels progress from reflection to concept hint, stored reasoning, full explanation, and a fresh-question prompt. Tutor exposure is recorded server-side so assisted attempts cannot masquerade as independent evidence. No external model receives student data. A hosted model adapter, caching/coalescing, and model output validation remain roadmap work.

## Future hosted storage
`migrations/001_supabase_foundation.sql` separates public question fields from a private version/key schema and applies owner-scoped RLS. It is a deployment scaffold, not an applied migration or a working Supabase adapter. PostgreSQL integration/transaction/RLS testing, hosted identity and credential setup, independent security review, backups, deletion/retention obligations, and privacy review precede public deployment.
