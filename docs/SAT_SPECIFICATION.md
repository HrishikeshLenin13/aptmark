# Digital SAT specification — verified 2026-10-18
Version: sat-2026-10-18. Primary source: [College Board structure](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure) and [assessment framework](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf), esp. framework tables on printed pp. 37–43 (PDF pp. 45–51).

Official: Reading & Writing has 54 questions, two 32-minute modules; Math has 44 questions, two 35-minute modules. A ten-minute break separates sections. Total testing time is 134 minutes, excluding break. Module 1 mixes difficulty; Module 2 is routed based on performance. The proprietary route and scoring are not public.

Official: each R&W module has 25 operational + 2 pretest items; each Math module has 20 operational + 2 pretest. This application's engineering simulation reports raw correctness over all its original items and does not reproduce official equating or unscored pretesting.

Official domain proportions (approximate, operational items): R&W Information and Ideas 26%, Craft and Structure 28%, Expression of Ideas 20%, Standard English Conventions 26%. Math Algebra 35%, Advanced Math 35%, Problem-Solving and Data Analysis 15%, Geometry and Trigonometry 15%.

Official taxonomy is encoded in content/taxonomy.json (30 skills: 11 R&W, 19 Math); subdivisions of broad nonlinear skills are local generator families. Local prerequisites and equal allocation within a domain are engineering assumptions, not official skill-frequency estimates.

Official R&W stimuli are short independent passages or paired texts (25–150 six-character words in the framework); all are four-option items. Math includes MCQ and student-produced response (roughly 75%/25%). Practice accepts exact rational equivalents and decimal rounding to a documented tolerance; it does not yet enforce every Bluebook entry-length restriction.

Official universal tools: timer (reappears at five minutes), calculator, formula sheet, highlight/notes, mark for review, line reader, elimination, question menu, zoom. [Bluebook tools](https://bluebook.collegeboard.org/students/tools). Aptmark uses original UI and original content. A simple calculator is not Desmos.

Local approximation: 65% raw first-module correctness chooses a harder second-module candidate route. This is an uncalibrated engineering threshold. No official-equivalent score is computed. Full-length published forms are gated on inventory readiness.

No indication of a structure change was found in the current pages. This is a point-in-time verification, not a claim to have reviewed every College Board notice.
