# Incremental delivery and comparison review

The requested target is approximately **1,000 genuine pushed commits for Aptmark**, not a claim that the application or learning model is complete at that count. A coherent implemented feature, bug correction, original question family with contracts, or independently useful verification improvement is a reasonable commit unit. Preserve existing dates and authorship; ship tested work rather than empty counters or artificial history rewrites.

## Three separate observations
1. **Repository history:** commits reachable from the selected pinned ref, with empty and merge-only entries separately reported.
2. **Author-associated work units:** nonempty, nonmerge commits that GitHub resolves to the configured account, after checking the standalone repository's current default-branch SHA. Historical aliases are resolved through GitHub, not guessed from the current local email.
3. **Profile-window commit contributions:** the separate GraphQL contribution collection, with its actual start/end dates. Missing or truncated repository connections stay unknown rather than becoming zero. This is not an all-time repository count or a count of issue/PR activity.

At the initial 2026-10-28 check, all 166 repository commits were author-associated; GitHub's separately queried Aptmark profile-window figure was 82. The target therefore had 834 remaining repository work units at that snapshot. These dated observations are not hardcoded into the report and should not be assumed to remain current.

GitHub applies its own [contribution criteria](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference), including author-account association, repository/default-branch requirements and contribution dates. A commit count is neither a prediction of the profile graph nor a measure of student learning.

## Read-only progress reports
- `npm run development:status`: inspect complete local `origin/main` history without claiming GitHub author or profile verification.
- `npm run development:status -- --github`: verify the pinned ref against current remote main and resolve every paginated commit's author association.
- `npm run development:status -- --github --profile`: additionally query GitHub's separate profile contribution window.
- `npm run development:status -- --markdown`: produce a CI-friendly summary with unqueried values explicitly labelled.

Fetch the full default-branch history first when necessary. The report intentionally rejects shallow history, stale/mismatched remote refs, incomplete/duplicated API coverage, forks and unexpected default branches. It reads Git/REST/GraphQL state; it does not create commits, change timestamps, rewrite authors, push, or purchase any service.

## Ongoing competitor/reference review
At each feature milestone:
1. Read the relevant current **College Board** and **OnePrep** primary descriptions, rather than treating either provider's claims about the other as verified facts.
2. Update [the dated comparison](WEBSITE_DIRECTION.md) and [structured audit](reference-audit.json), keeping public descriptions distinct from observed Aptmark behavior.
3. Link the local tests/source evidence and state the specific remaining acceptance gate. A larger generated inventory is not proof of better question validity.
4. Run `npm run compare:check` and the engineering test suite before publishing the milestone's commit.

CI checks review freshness (maximum 30 days), provider/URL attribution, local evidence paths and claim boundaries on every push/PR. It also emits an offline history summary from a complete clone. The checker does not itself re-browse or evaluate competitors; dated primary-source inspection remains part of each milestone. The review data explicitly retains full-form, calibration, hosted-service and connected-tutor gaps rather than declaring blanket parity.

This delivery/process milestone does not change any student capability in the eight-row College Board/OnePrep comparison. The dated public-reference observations remain attributed in the audit; GitHub activity is not used to claim an advantage over either learning platform.
