# Aptmark website-first direction

## Current priority
2026-10-18: the website and its behavior now come before bulk content generation. Existing candidates are preserved; the proposed 20,000-item expansion is a later milestone, not a published inventory claim.

## Reference audit
OnePrep’s public [home page](https://www.oneprep.com/) and [question-bank description](https://www.oneprep.com/question-bank) advertise a broad study experience: a filterable bank, explanations, diagnostics, a planner, analytics, tutoring, lessons, vocabulary, timed drills and practice tests. The public [Question Rush page](https://www.oneprep.com/question-rush) describes configurable pacing drills. Its vocabulary entry redirects to sign-in, so the authenticated experience has not been inspected. Public marketing descriptions are not independent evidence of educational outcomes.

Aptmark uses these capabilities as product requirements, not a source of questions, copy, screenshots, branding, or proprietary UI assets.

| Capability | Aptmark status / next acceptance condition |
|---|---|
| Skill-filtered practice, explanations, bookmarks | Working persistent local implementation; improve discovery, deep links and session tools |
| Diagnostics and assessment tools | Diagnostic and Math preview work; full validated forms remain gated |
| Planning and analytics | Actual-record local features; add schedule export and clearer pacing insights |
| Lessons and guided practice | Implemented local preview: 12 original short lessons, server-graded comprehension checks and version-aware owner-scoped completion |
| Vocabulary and challenging practice | Implemented explicit entry points into context vocabulary, hard practice and saved questions |
| Timed drills | Next website behavior milestone: persistent bounded sessions, not an ornamental timer |
| Conversational AI | Static grounded guide works; provider, operating budget and evaluation remain open |
| Calendar sync | Not connected; implement portable schedule export before external calendar authorization |
| Full-length tests / predicted scores | Not advertised as ready without reviewed forms and psychometric support |
| ACT/AP, college planning, native apps, parent/teacher workflows | Separate product tracks, currently unimplemented; no fake tabs or parity claim |

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
Each milestone must pass relevant unit and browser tests, keyboard/focus checks, mobile/tablet/desktop overflow checks and screenshots. Working milestones are pushed as meaningful Git commits. Passing a UI audit is not a claim of educational superiority or completed feature parity.

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
