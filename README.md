# Aptmark

### Practice with purpose.

**Free, adaptive SAT preparation.** Aptmark is an evolving study workspace for focused practice, useful explanations, and a clearer view of what to work on next.

## A more deliberate way to study

- **Practice that responds.** Build focused Math or Reading and Writing sets, then let each submitted response guide what comes next.
- **Build the idea first.** Explore 12 original foundation lesson previews, worked examples, and saved understanding checks. Lesson completion stays separate from independent practice mastery.
- **Find your next step.** Search pages and skills, open saved questions, or choose vocabulary and challenging practice from a keyboard-accessible workspace.
- **Understand the reasoning.** Review worked explanations, progressive hints, and common-mistake notes alongside each question.
- **Make space for study.** Shape a weekly plan around your available days and export its real study reminders to a portable calendar file.
- **Keep your progress honest.** See actual practice history, skill-level signals, review reminders, and study plans—without invented activity or unsupported score predictions.
- **Prepare with structure.** Use a short diagnostic, a timed Math assessment preview, a formula reference, and a simple calculator.
- **Keep content accountable.** Aptmark separates generated candidates from reviewed and published questions; content tools record validation, editorial decisions, and release status.

## Learning, not guesswork

Aptmark is designed around transparent recommendations and an explicit editorial review process. Its adaptive baseline distinguishes a first independent response from hints and repeated attempts, while retaining uncertainty rather than presenting uncalibrated estimates as precise scores. The learning guide is static and grounded in the available content; a generative AI tutor is not connected.

## Current preview

Aptmark is an active local preview, not a finished hosted service. Its content pipeline currently contains **5,405 generated candidates**—4,800 Math and 605 Reading and Writing—across **30 skill areas** and **75 generator families**. No candidates have received human editorial approval, none are published, and the learning model has not been empirically calibrated. Automated checks are useful quality controls, not a substitute for editorial review or student-outcome research. Full-length SAT forms, hosted accounts, cloud synchronization, and a production deployment remain future work.

Aptmark is independent of College Board. SAT is a trademark of College Board.

## Product notes

- [Product and implementation status](IMPLEMENTATION_STATUS.md)
- [Architecture and data boundaries](docs/ARCHITECTURE.md)
- [Research and SAT specification](docs/RESEARCH.md)
- [Development notes](docs/DEVELOPMENT.md)
- [Roadmap](docs/PROJECT_ROADMAP.md)

See [question quality and the review workflow](docs/CONTENT_QUALITY.md) for the current content expansion and its review gates.

## Study calculator

The workspace calculator accepts pasted `×`, `÷`, and `−` symbols as well as keyboard arithmetic operators. Parentheses and normal arithmetic precedence are preserved. Stray decimal punctuation, incomplete expressions, and non-finite results are rejected rather than silently rewritten.

Check it with `npm test`; the full project checks remain in [Development notes](docs/DEVELOPMENT.md). This utility change does not publish questions, change answer keys, or alter assessment scoring.
