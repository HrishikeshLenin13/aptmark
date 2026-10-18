# Research and environment audit — 2026-10-18
- Initial checkout: empty Git repository; no existing application or remote was overwritten.
- Host: macOS; Node 26.8.1, npm 11.19.0; system Python 3.14.7. uv selected Python 3.10.20 for the isolated generator environment. See lockfile for JS dependency resolution.
- Context7 resolve/query calls worked for Next.js and SymPy. Next.js App Router uses async cookies and explicit authenticated route handlers. Sources: https://github.com/vercel/next.js/tree/canary/docs and https://docs.sympy.org/latest/.
- shadcn MCP component lookup worked for button/dialog. Accessible Radix dialog primitives and a customized button implement the original Aptmark design system.
- Playwright MCP is available; actual browser results are recorded in evidence and IMPLEMENTATION_STATUS.md after testing.
- Next DevTools MCP is not configured. Production compilation, HTTP tests, and browser console checks provide local diagnostics instead. Existing MCP configuration was not edited.
- No Supabase connection/project credentials were supplied. The working local database uses SQLite transactions. A PostgreSQL/RLS migration is supplied separately and is not claimed to have been applied to a cloud database.
- Git repository has no remote. No public repository, paid infrastructure, third-party student data, or paid-model call was created.

## Primary assessment sources inspected
1. https://satsuite.collegeboard.org/sat/whats-on-the-test/structure — current structure/timing.
2. https://satsuite.collegeboard.org/higher-ed-professionals/sat-validity/content-domains — official domains/skills.
3. https://satsuite.collegeboard.org/practice/student-question-bank/math — task descriptions only, no content copied.
4. https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing — question format descriptions only.
5. https://bluebook.collegeboard.org/students/tools — tool behaviors.
6. https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf — 245-page public framework; relevant specification tables and proportions inspected.
7. https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing — section overview. An earlier /reading-writing/overview URL returned an error; the current page resolved.

Official facts, local approximations, and unverified claims are separated in SAT_SPECIFICATION.md. Editorial quality, calibration, and comparative learning outcomes are not established by automated tests.

## Dependency audit follow-up
The initial dependency audit identified development-tool advisories in Vitest/Tinypool and a KaTeX trust-hardening advisory. After checking the maintainers’ [Vitest migration guide](https://vitest.dev/guide/migration/), [Vitest advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9), [KaTeX options](https://katex.org/docs/options), and [KaTeX advisory](https://github.com/KaTeX/KaTeX/security/advisories/GHSA-238p-pmpm-9mq7), the installed versions were updated to Vitest 5.0.5 and KaTeX 0.19.0. The final npm audit reports zero known advisories for the resolved dependency tree; that is not a security certification.

## Final local checks
Context7, shadcn MCP and Playwright MCP were actually exercised. Browser QA also used the installed Playwright runner and axe. At the end, a direct browser fetch of `/api/state` observed 4,555 candidates, 4,555 structurally validated, 0 approved, 0 published, 41 families, and a fresh workspace with zero student attempts. MCP browser console checks observed zero errors on the final overview page. See VERIFICATION.txt for command/status evidence.
