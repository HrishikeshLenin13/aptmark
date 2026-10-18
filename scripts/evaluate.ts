import { db } from "../src/lib/db";
import {
  evaluation,
  masteryFor,
  provisionalPrediction,
  MODEL_VERSION,
} from "../src/lib/engine";
import type { Attempt } from "../src/lib/types";
const rows = db()
  .prepare("SELECT user_id,data FROM attempts ORDER BY rowid")
  .all() as { user_id: string; data: string }[];
const histories = new Map<string, Attempt[]>(),
  model: { p: number; correct: boolean }[] = [],
  baseline: { p: number; correct: boolean }[] = [];
for (const row of rows) {
  const a = JSON.parse(row.data) as Attempt;
  const old = histories.get(row.user_id) ?? [];
  if (
    a.first &&
    !a.assisted &&
    !old.some((x) => x.questionId === a.questionId)
  ) {
    model.push({
      p: provisionalPrediction(
        masteryFor(a.skill, old, new Date(a.createdAt)),
        { easy: -1, medium: 0, hard: 1 }[a.difficulty],
      ),
      correct: a.correct,
    });
    baseline.push({ p: 0.5, correct: a.correct });
  }
  old.push(a);
  histories.set(row.user_id, old);
}
console.log(
  JSON.stringify(
    {
      modelVersion: MODEL_VERSION,
      method: "chronological prequential first-exposure evaluation",
      dataStatus: model.length
        ? "local observations, not a generalizable outcome study"
        : "no independent observations; no accuracy claim",
      model: evaluation(model),
      constantBaseline: evaluation(baseline),
      empiricallyCalibrated: false,
    },
    null,
    2,
  ),
);
