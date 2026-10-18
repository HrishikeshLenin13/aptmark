# Operation and release notes
## Local-only operating costs
No paid API calls, accounts, public deployments, advertising, or billable hosting were purchased. Local practice, recommendations, static explanations and the learning guide have zero external per-request model cost. Electricity, hardware, bandwidth, and human editorial labor are not priced here.

## Hosted cost planning (unverified planning assumptions, not vendor quotes)
A small pilot should budget a provisional $25–100 per month for application/database hosting, backups, monitoring, and mail, plus $0–50 for an optional tightly capped tutor provider. Actual costs depend on provider pricing, concurrency, traffic, geography, and retention. The offline content system costs no hosted-model API fees; human authorship/editorial labor is likely the largest unknown. Before procurement, check live provider quotes and agree an explicit spend cap. No service has been provisioned.

## Security and privacy release gates
The working server is bound to loopback. Keep local candidate preview off for public release. Require independently reviewed hosted identity, verified email and recovery, HTTPS, a defined consent/age policy, privacy disclosures and retention schedules, row-policy integration tests, permission audits, secret rotation, rate-limit load tests, per-request resource budgets, backups and restore drills, deletion of associated free text, an incident contact and abuse reporting.

The Supabase SQL is unexecuted. Hosting credentials and integration are required before its policies can be tested. A local owner-isolation test is not proof that an untested cloud adapter is secure. No legal-compliance certification, audited WCAG conformance, official SAT affiliation, calibrated score accuracy, or comparative outcome superiority is claimed.

## Recovery
Generation commits every 25 seeds and resumes per skill. The JSON export uses atomic rename. SQLite WAL and transactional writes protect local state. A database backup must include a consistent SQLite backup, not just a copied main file while WAL writes are active. Use `sqlite3 .backup` or the Python SQLite backup API. Keep encrypted off-host backups only after an agreed data policy.

`ROLLBACK.sh` restores the original published-only default for the content preview policy and verifies hashes. Its optional argument supports a test copy. It does not delete student data, reverse all application code, or claim to roll back an entire database release. Restoring data from a prior database snapshot is a separate operation requiring an explicit decision about records written afterward.

## Reproducibility
`package-lock.json` locks installed JS packages. `requirements.lock` records the isolated Python packages. `content/bank.json` is the current original-content export, with stable seeds/hashes. `content/manifests/inventory.json` and the local content studio distinguish candidates from published items. Authoritative editorial decisions live in the runtime database. `scripts/export-reviewed.ts` validates publication gates and atomically exports that reviewed runtime inventory. The Python approved-export command reads only the generator staging database; do not confuse the two sources.
