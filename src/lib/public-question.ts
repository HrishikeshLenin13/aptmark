import type { PublicQuestion, Question } from "./types";

// An allowlist, not a rest/spread: future editorial fields must stay private by default.
export function serializePublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    schemaVersion: q.schemaVersion,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    subskill: q.subskill,
    type: q.type,
    stem: q.stem,
    passage: q.passage,
    options: q.options,
    difficulty: q.difficulty,
    difficultyCalibration: q.difficultyCalibration,
    estimatedSeconds: q.estimatedSeconds,
    family: q.family,
    seed: q.seed,
    contentVersion: q.contentVersion,
    contentHash: q.contentHash,
    license: q.license,
    editorialStatus: q.editorialStatus,
    publicationStatus: q.publicationStatus,
    diagram: q.diagram,
    table: q.table,
    similarityCluster: q.similarityCluster,
    calibration: q.calibration,
    source: q.source,
  };
}
