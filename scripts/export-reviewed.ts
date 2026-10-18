import fs from "node:fs";
import path from "node:path";
import { allQuestions } from "../src/lib/db";
const output = path.resolve(
  process.argv[2] ?? "content/reviewed/published.json",
);
const published = allQuestions().filter(
  (q) => q.publicationStatus === "published",
);
for (const q of published) {
  if (
    q.editorialStatus !== "approved" ||
    !q.reviewer ||
    !q.reviewNotes ||
    !q.validationResults.structural
  )
    throw Error(`Publication gate failed for ${q.id}`);
}
fs.mkdirSync(path.dirname(output), { recursive: true });
const temporary = output + ".tmp";
fs.writeFileSync(temporary, JSON.stringify(published, null, 2) + "\n");
fs.renameSync(temporary, output);
console.log(
  JSON.stringify({
    published: published.length,
    path: output,
    source: "runtime editorial database",
  }),
);
