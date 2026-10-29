# Aptmark engineering instructions
- This is a local-first SAT platform, not a completed public release.
- Read IMPLEMENTATION_STATUS.md before continuing work.
- Never publish content without a named human reviewer, review notes, and passing validation. Generated and published counts are distinct.
- Read current library documentation through Context7 for framework/API changes.
- Keep scoring, answer keys, identity, and ownership checks on the server. All user writes derive identity from the session.
- Preserve original content provenance, exact seeds, clusters, and provisional calibration labels.
- Run npm test, npm run typecheck, npm run build, Python content tests, content validation, and Playwright after meaningful changes.
- Public launch needs independent editorial, privacy, security, accessibility, and psychometric review. No paid API or public deployment without explicit authorization.
- Do not invent learning histories, score estimates, testimonials, or trained-model claims.

- At every feature milestone, compare the changed workflow with current College Board and OnePrep primary descriptions; update docs/reference-audit.json and docs/WEBSITE_DIRECTION.md as needed. Separate public descriptions from tested local behavior and avoid unsupported superiority claims. Run the reference-audit checker alongside the project checks.
- Track the requested 1,000-commit target using real pushed work and verified GitHub author association; keep profile contribution-window counts separate. Preserve existing history, authorship and dates; use coherent tested feature/question-family commits.
