import { startModule } from "./assessment";
import type { Exam, Question, Section } from "./types";
export type DrillConfig = {
  section: Section;
  skill?: string;
  difficulty: "all" | "easy" | "medium" | "hard";
  count: 5 | 10 | 15 | 20;
  seconds: 180 | 300 | 600 | 900;
};
export function createPacingSession(input: {
  id: string;
  owner: string;
  config: DrillConfig;
  questions: Question[];
  preview: boolean;
  at?: Date;
}): Exam {
  const { id, owner, config, questions, preview } = input,
    at = input.at ?? new Date();
  if (
    ![5, 10, 15, 20].includes(config.count) ||
    ![180, 300, 600, 900].includes(config.seconds)
  )
    throw Error("Choose a supported pacing preset.");
  if (
    questions.length !== config.count ||
    new Set(questions.map((q) => q.id)).size !== config.count
  )
    throw Error(
      "There are not enough distinct eligible questions for this drill.",
    );
  if (
    questions.some(
      (q) =>
        q.section !== config.section ||
        (config.skill && q.skill !== config.skill) ||
        (config.difficulty !== "all" && q.difficulty !== config.difficulty),
    )
  )
    throw Error("The selected questions do not match this drill.");
  const exam: Exam = {
    id,
    userId: owner,
    mode: "drill",
    drill: { ...config },
    current: 0,
    status: "active",
    breakUntil: null,
    createdAt: at.toISOString(),
    completedAt: null,
    preview,
    modules: [
      {
        index: 0,
        section: config.section,
        durationSeconds: config.seconds,
        questionIds: questions.map((q) => q.id),
        answers: {},
        flags: [],
        notes: {},
        startedAt: null,
        deadline: null,
        submittedAt: null,
        route: "pacing-practice-uncalibrated",
      },
    ],
  };
  startModule(exam.modules[0], at);
  return exam;
}
