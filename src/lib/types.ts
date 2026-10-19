export type Section = "math" | "rw";
export type Skill = {
  id: string;
  name: string;
  domain: string;
  section: Section;
  weight: number;
  prerequisites: string[];
};
export type Figure = {
  kind: "parabola" | "triangle";
  h?: number;
  k?: number;
  a?: number;
  sides?: number[];
  alt: string;
  toScale: boolean;
};
export type Question = {
  id: string;
  schemaVersion: number;
  section: Section;
  domain: string;
  skill: string;
  subskill: string;
  type: "mcq" | "spr";
  stem: string;
  passage: string | null;
  options: string[];
  correctAnswer: string;
  acceptedResponses: string[];
  difficulty: "easy" | "medium" | "hard";
  difficultyCalibration: string;
  explanation: string;
  steps: string[];
  hints: string[];
  distractorExplanations: Record<string, string>;
  misconceptionTags: string[];
  estimatedSeconds: number;
  family: string;
  seed: number;
  contentVersion: number;
  contentHash: string;
  license: string;
  editorialStatus: "pending" | "approved" | "rejected";
  publicationStatus: "candidate" | "published";
  reviewer: string | null;
  reviewNotes: string | null;
  validationResults: {
    structural: boolean;
    answerCheck: string;
    educationalValidity: string;
  };
  diagram: Figure | null;
  table: { headers: string[]; rows: (string | number)[][] } | null;
  similarityCluster: string;
  calibration: { difficulty: number; n: number };
  source: string;
  generatorVersion?: string;
  answerEvidence?: { quotes: string[]; reasoning: string };
  alignment?: { source: string; basis: string; frameworkVersion: string };
  qualityMetadata?: {
    difficultyBasis: string[];
    reviewFlags: string[];
    passageOrigin?: string;
  };
};
export type PublicQuestion = Pick<
  Question,
  | "id"
  | "schemaVersion"
  | "section"
  | "domain"
  | "skill"
  | "subskill"
  | "type"
  | "stem"
  | "passage"
  | "options"
  | "difficulty"
  | "difficultyCalibration"
  | "estimatedSeconds"
  | "family"
  | "seed"
  | "contentVersion"
  | "contentHash"
  | "license"
  | "editorialStatus"
  | "publicationStatus"
  | "diagram"
  | "table"
  | "similarityCluster"
  | "calibration"
  | "source"
>;
export type Attempt = {
  id: string;
  questionId: string;
  skill: string;
  section: Section;
  domain: string;
  answer: string;
  correct: boolean;
  seconds: number;
  assisted: boolean;
  first: boolean;
  createdAt: string;
  difficulty: Question["difficulty"];
  note: string;
  misconception: string;
  dueAt: string;
  contentHash?: string;
  contentVersion?: number;
};
export type Mastery = {
  skill: string;
  mean: number;
  low: number;
  high: number;
  n: number;
  correct: number;
  last: string | null;
  retention: number;
  due: boolean;
};
export type Grade = {
  correct: boolean;
  answer: string;
  explanation: string;
  steps: string[];
  distractor: string | null;
  attempt: Attempt;
  replayed?: boolean;
};
export type Preferences = {
  testDate: string;
  targetScore: number;
  weeklyMinutes: number;
  days: number[];
};
export type ModuleState = {
  index: number;
  section: Section;
  durationSeconds: number;
  questionIds: string[];
  answers: Record<string, string>;
  flags: string[];
  notes: Record<string, string>;
  startedAt: string | null;
  deadline: string | null;
  submittedAt: string | null;
  route: string;
  correct?: number;
};
export type Exam = {
  id: string;
  userId: string;
  mode: "simulation" | "diagnostic";
  modules: ModuleState[];
  current: number;
  status: "active" | "break" | "complete";
  breakUntil: string | null;
  createdAt: string;
  completedAt: string | null;
  preview: boolean;
};
