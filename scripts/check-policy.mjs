import fs from "node:fs";
import assert from "node:assert/strict";
import {
  questionEligible,
  publicationEligible,
} from "../src/lib/content-policy.ts";
const p = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
assert.equal(p.requireHumanReview, true);
const candidate = {
  editorialStatus: "pending",
  publicationStatus: "candidate",
  reviewer: null,
  reviewNotes: null,
  validationResults: { structural: true },
};
assert.equal(questionEligible(candidate, p, true), p.localCandidatePreview);
assert.equal(questionEligible(candidate, p, false), false);
assert.equal(
  publicationEligible({ ...candidate, publicationStatus: "published" }),
  false,
);
assert.equal(
  questionEligible({ ...candidate, editorialStatus: "rejected" }, p, true),
  false,
);
const approved = {
  ...candidate,
  publicationStatus: "published",
  editorialStatus: "approved",
  reviewer: "Test fixture reviewer",
  reviewNotes: "Isolated assertion fixture, not an actual published question.",
};
assert.equal(questionEligible(approved, p, false), true);
console.log(
  `localCandidatePreview=${p.localCandidatePreview}; requireHumanReview=${p.requireHumanReview}; publishedTarget=${p.publishedTarget}`,
);
