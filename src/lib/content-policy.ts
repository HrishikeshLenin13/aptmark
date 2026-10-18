export type ContentPolicy = {
  schemaVersion: number;
  localCandidatePreview: boolean;
  requireHumanReview: boolean;
  publishedTarget: number;
};
type PublicationRecord = {
  editorialStatus: string;
  publicationStatus: string;
  reviewer?: string | null;
  reviewNotes?: string | null;
  validationResults: { structural: boolean };
};
export function previewAllowed(policy: ContentPolicy, optIn: boolean) {
  return policy.localCandidatePreview && optIn;
}
export function publicationEligible(q: PublicationRecord) {
  return (
    q.validationResults.structural &&
    q.editorialStatus === "approved" &&
    !!q.reviewer &&
    q.reviewer.length >= 3 &&
    !!q.reviewNotes &&
    q.reviewNotes.length >= 15
  );
}
export function questionEligible(
  q: PublicationRecord,
  policy: ContentPolicy,
  optIn: boolean,
) {
  return (
    q.validationResults.structural &&
    q.editorialStatus !== "rejected" &&
    ((q.publicationStatus === "published" && publicationEligible(q)) ||
      previewAllowed(policy, optIn))
  );
}
