# Aptmark website-first direction

## Current priority
2026-10-18: the website and its behavior now come before bulk content generation. Existing candidates are preserved; the proposed 20,000-item expansion is a later milestone, not a published inventory claim.

## Reference audit — 2026-10-28

At every feature milestone, compare the changed student workflow against current primary descriptions from **both College Board and OnePrep**, then record the Aptmark test evidence and the remaining acceptance condition. The machine-readable record is [reference-audit.json](reference-audit.json); its freshness/traceability checker rejects reviews older than 30 days. A passing checker does not itself browse the sites or prove educational superiority.

### Primary sources and inspection boundaries
- College Board: [student question bank](https://satsuite.collegeboard.org/practice/student-question-bank), [Reading and Writing task guide](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing), and [official practice forms](https://satsuite.collegeboard.org/practice/practice-tests). Official descriptions distinguish the student bank, digital Bluebook practice and nonadaptive paper forms.
- OnePrep: [question bank](https://www.oneprep.com/question-bank), [timed practice](https://www.oneprep.com/question-rush), and [public product overview](https://www.oneprep.com/). These advertise study workflows; authenticated behavior, content review quality and outcome claims have not been independently verified here.
- OnePrep's public bank headline and displayed section subtotals do not agree: 1,492 + 2,390 = 3,882, while the headline says 4,000+. These are reported figures, not an audited inventory. Aptmark's generated candidates are not comparable to officially authored or independently reviewed questions merely because they are numerous.
- Do not repeat a competitor's characterization of College Board as if College Board confirmed it. The current official student-bank page describes a student sign-in experience and targeted filters; it is not interchangeable with an educator PDF-export tool.

### Capability matrix
| Capability | College Board reference | OnePrep public description | Aptmark tested status / next condition |
|---|---|---|---|
| Targeted practice | Official student bank with assessment/domain/skill/difficulty filters | Skill/difficulty filters, explanations and progress | Local filters, grading, bookmarks and history work; improve discovery without equating inventory with validity |
| English task structure | Official task categories and question-stem guide | Skill-organized English bank | Original candidates cover all 11 skills; add varied contexts and independent editorial review |
| Content quality | Official questions from the assessment developer | Human-written content is advertised | Generated candidates remain subject to explicit review and calibration gates; obtain actual human decisions |
| Timed study | Official full-length digital practice uses Bluebook | Configurable pacing with speed/accuracy rewards | Local bounded pacing, saved deadlines and retryable saves; personal drills are not validated test forms |
| Full forms and scores | Official digital forms and distinct nonadaptive paper forms | Practice tests and projected scores are promoted | Diagnostic/Math engineering previews only; full forms and SAT predictions stay gated |
| Planning and progress | Targeted self-directed practice is documented | Responsive study plans are promoted | Actual-record planner/analytics and calendar export work; evaluate usefulness and distinguish export from live sync |
| Guided explanations | Official skill/stem guidance | Follow-up tutoring is promoted | Worked explanations and a static grounded guide; connected AI needs provider, budget and evaluation |
| Broader platform | SAT Suite practice is the reference scope | ACT/AP and college-application tools are promoted | Local SAT foundations first; hosted accounts and other courses have separate unmet acceptance gates |

Aptmark uses these references to identify requirements, not to copy questions, branding, passages or proprietary UI. No overall parity or superiority claim follows from this matrix. [Implementation status](../IMPLEMENTATION_STATUS.md) and tests are authoritative for local behavior; source descriptions are authoritative only for what the reference pages publicly say.

## Incremental delivery and contribution target

The requested target is **about 1,000 real pushed commits**, tracked separately from GitHub's profile contribution graph. Ship a coherent tested feature, correction, question family, or independently useful review/verification improvement per commit. Preserve existing authorship and dates; do not manufacture empty commits or rewrite already-pushed history to increase the counter.

Resolve progress at a pinned default-branch SHA, check GitHub author association, and distinguish empty/merge-only history from independent work units. This is a development measure, not a measure of learning effectiveness. GitHub applies its own [contribution criteria](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference); author-linked repository commits and the profile graph are reported distinctly.

## Studio layout plan

Preserve Aptmark’s own identity: a compact black a mark, forest-green actions and a quiet, readable study surface.

- Colors: paper `#F6F8F7`, surface `#FFFFFF`, ink `#25372E`, muted `#617166`, action `#285E45`, rule `#E2E8E4`.
- Type: humanist system sans for navigation and learning interfaces; Georgia only for the existing study-desk hero. No remote font dependency. Stronger 14–16px supporting copy and balanced display headings.
- Spacing: 4/8/12/16/24/32/48px rhythm. Stable content gutters, wider main reading measure, visible group separation, consistent 44px primary controls.
- Structure: left navigation, quiet utility bar, a focused next-action surface and supporting study rail. Search should find actual routes and skills, not suggest inactive products.

```text
Navigation | current page                 search / test date
           | page title + one next action
           | primary study task           | weekly plan
           | practice entry points        | diagnostic
           | real progress / next lesson  | content status
```

Critique before implementation: the existing screen is attractive but has small supporting text, uneven control sizing, too little route discovery, and a mobile drawer without a complete dialog lifecycle. Keep the recognizable study-desk layout; improve the utility layer and task clarity rather than covering every view with new cards or competitor styling. No decorative animation, gradients, fake scores or testimonial filler.

## Verification
Each milestone must pass relevant unit and browser tests, keyboard/focus checks, mobile/tablet/desktop overflow checks and screenshots. Working milestones are pushed as meaningful Git commits. At every feature milestone, refresh the relevant College Board/OnePrep comparison and its local acceptance evidence. Passing a UI audit is not a claim of educational superiority or completed feature parity.

## Reusable continuation brief
```text
Continue Aptmark website-first from IMPLEMENTATION_STATUS.md. Read the current
capability matrix, preserve all question IDs/hashes and session-derived ownership,
and choose one complete student workflow. Keep unreviewed content preview-only
and separate lesson completion from independent mastery. Use current framework
docs, implement the real interaction, test server behavior and keyboard focus,
inspect 1440/820/390px screenshots, run the documented checks, update evidence,
and push a meaningful feature commit. Do not generate the proposed 20,000-item
bank until the website foundation and editorial plan are ready.
```


## English application milestone — 2026-10-29
Rechecked the College Board public Reading and Writing stem guide and OnePrep’s public question-bank description. College Board describes consistent task patterns; OnePrep describes skill/difficulty filtering, explanations and progress. Aptmark’s new 44 original candidates extend all 11 local English skills with four distinct contexts each, retaining private methods and option-specific explanations. See docs/ENGLISH_APPLICATION.md and the batch manifest. The new hypothetical stimuli are not reconstructed official items. Candidate volume does not establish equivalence to official questions, superior learning outcomes or calibrated difficulty. Prior dated descriptions of other capabilities remain unchanged.


## Literary reading milestone — 2026-10-29
Rechecked the College Board public Reading and Writing task guide, OnePrep’s bank overview and its specific Text Structure and Purpose guide. The latter describes contextual function analysis, not just summarizing the selected sentence. Aptmark’s new literary cohort tests the role of final imagery alongside central ideas, quoted evidence, limited perspective, contextual vocabulary and cross-text interpretation. All poems, scenes and commentary are original. Current scope is 24 additional pending candidates across six reading skills; neither numerical inventory nor automated checks establish equivalence to official questions or superior outcomes. See docs/ENGLISH_LITERARY.md and the dated structured audit. Other capability observations retain their actual earlier review dates.
