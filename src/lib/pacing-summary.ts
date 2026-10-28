import type { Exam } from "./types";
export function pacingSummary(exam: Exam) {
  const module = exam.modules[0];
  const elapsed =
    module.startedAt && exam.completedAt
      ? Math.min(
          module.durationSeconds,
          Math.max(
            0,
            Math.round(
              (Date.parse(exam.completedAt) - Date.parse(module.startedAt)) /
                1000,
            ),
          ),
        )
      : 0;
  return {
    elapsed,
    answered: module.questionIds.filter((id) => !!module.answers[id]).length,
    total: module.questionIds.length,
    correct: module.correct ?? 0,
  };
}
