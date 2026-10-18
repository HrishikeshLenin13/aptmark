import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [
  ["typecheck", ["npm", "run", "typecheck"], "typecheck.log"],
  ["typescript-tests", ["npm", "test"], "vitest.log"],
  [
    "python-tests",
    [".venv/bin/python", "-m", "pytest", "tests/test_content.py", "-q"],
    "pytest.log",
  ],
  [
    "content-replay",
    [".venv/bin/python", "python/pipeline.py", "validate", "--replay"],
    "content-validation.json",
  ],
  [
    "deduplication",
    [".venv/bin/python", "python/pipeline.py", "dedupe"],
    "deduplication.json",
  ],
  ["production-build", ["npm", "run", "build"], "build.log"],
  ["browser-tests", ["npm", "run", "test:e2e"], "playwright.log"],
  ["dependency-audit", ["npm", "audit", "--json"], "npm-audit.json"],
  [
    "model-evaluation",
    ["node", "--env-file=.env.local", "--import", "tsx", "scripts/evaluate.ts"],
    "model-evaluation.json",
  ],
  [
    "reviewed-export",
    [
      "node",
      "--env-file=.env.local",
      "--import",
      "tsx",
      "scripts/export-reviewed.ts",
    ],
    "reviewed-export.json",
  ],
  [
    "baseline-policy",
    [
      "node",
      "scripts/check-policy.mjs",
      "evidence/content-policy.original.json",
    ],
    "baseline.log",
  ],
  [
    "modified-policy",
    ["node", "scripts/check-policy.mjs", "src/lib/content-policy.json"],
    "modified.log",
  ],
];
const results = [];
for (const [name, argv, log] of checks) {
  const begin = Date.now();
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20_000_000,
  });
  fs.writeFileSync(
    path.join(root, "evidence", log),
    result.stdout + (result.stderr ?? ""),
  );
  const record = {
    name,
    command: argv.join(" "),
    cwd: root,
    exitStatus: result.status,
    seconds: Math.round((Date.now() - begin) / 10) / 100,
    log: path.join(root, "evidence", log),
  };
  results.push(record);
  console.log(`${name}: exit ${result.status}`);
  fs.writeFileSync(
    path.join(root, "evidence/check-results.json"),
    JSON.stringify(
      { completedAt: new Date().toISOString(), results },
      null,
      2,
    ) + "\n",
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
fs.copyFileSync(
  path.join(root, "src/lib/content-policy.json"),
  path.join(root, "evidence/rollback-test.json"),
);
const rollback = spawnSync(
  path.join(root, "ROLLBACK.sh"),
  [path.join(root, "evidence/rollback-test.json")],
  { cwd: root, encoding: "utf8" },
);
fs.writeFileSync(
  path.join(root, "evidence/rollback.log"),
  rollback.stdout + (rollback.stderr ?? ""),
);
const equal = fs
  .readFileSync(path.join(root, "evidence/rollback-test.json"))
  .equals(
    fs.readFileSync(path.join(root, "evidence/content-policy.original.json")),
  );
results.push({
  name: "rollback-on-copy",
  command: `${root}/ROLLBACK.sh ${root}/evidence/rollback-test.json`,
  cwd: root,
  exitStatus: rollback.status,
  originalHashRestored: equal,
});
fs.writeFileSync(
  path.join(root, "evidence/check-results.json"),
  JSON.stringify({ completedAt: new Date().toISOString(), results }, null, 2) +
    "\n",
);
if (rollback.status !== 0 || !equal) process.exit(1);
console.log("All verification checks passed; live modified policy preserved.");
