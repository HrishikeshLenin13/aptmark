# Content regression checks

The GitHub **Content regression** workflow runs on pushes, pull requests, and manual dispatch. It reads the repository without content-write permissions and never approves, publishes, deploys, or calls a paid generation provider.

It uses commit-pinned checkout and Python setup actions, Python 3.12, a virtual environment, and the bounded dependencies in `requirements.txt`. The setup and pip-cache configuration follows the [GitHub Python workflow documentation](https://docs.github.com/en/actions/tutorials/build-and-test-code/python).

The job checks:

1. Python generator contracts, all Reading and Writing skills, finite authored-variant bounds, collision rollback, and preservation of prior question records.
2. Every committed candidate’s structural validation and deterministic seed replay, including earlier generator versions.
3. Fresh-clone generator-database hydration followed by English-only generation. `content/bank.json` must remain byte-identical; an unexpected addition, change, or reorder fails the job.

A job timeout and cancellation of superseded runs bound execution. The separate **Core regression** workflow checks TypeScript unit tests and typechecking. Browser integration and accessibility evidence is recorded separately; neither workflow establishes human editorial approval, semantic uniqueness, empirical difficulty, or student outcomes.

When a new family is authored, update its finite registry and coverage tests, generate and review its candidate records, then inspect both workflows on the resulting commit. An existing family’s seed slot must not silently change its prior question content.
