import fs from "node:fs";
import path from "node:path";
import { validateReferenceAudit } from "../src/lib/reference-audit.ts";
const filename = process.argv[2] ?? "docs/reference-audit.json";
const audit = JSON.parse(fs.readFileSync(filename, "utf8"));
const errors = validateReferenceAudit(audit, {
  fileExists: (p) => fs.existsSync(path.resolve(p)),
});
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `comparison=valid; providers=${audit.providers.join(",")}; capabilities=${audit.capabilities.length}; checkedAt=${audit.checkedAt}; cadence=${audit.reviewCadence}`,
  );
