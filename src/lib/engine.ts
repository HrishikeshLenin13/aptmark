import { calendarDate } from "./time";
import type { Attempt, Question, Skill, Mastery, Preferences } from "./types";
export const MODEL_VERSION = "beta-weighted-first-exposure-1.0";
export function gradeNumeric(input: string, expected: string): boolean {
  const parse = (s: string): number | null => {
    s = s.trim();
    if (
      s.length > 32 ||
      !/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[-+]?\d+)?$/.test(s)
    )
      return null;
    const [n, d = "1"] = s.split("/").map(Number);
    if (!d) return null;
    const v = n / Number(d);
    return Number.isFinite(v) ? v : null;
  };
  const x = parse(input),
    y = parse(expected);
  if (x === null || y === null) return false;
  if (x === y) return true;
  // SAT-style rounding: at least three decimal places, within half a thousandth.
  return (
    !input.includes("/") &&
    /\.\d{3,}$/.test(input.trim()) &&
    Math.abs(x - y) <= 0.0005
  );
}
export function gradeAnswer(q: Question, answer: string): boolean {
  return q.type === "spr"
    ? gradeNumeric(answer, q.correctAnswer)
    : q.options.includes(answer) && answer === q.correctAnswer;
}
export function masteryFor(
  skill: string,
  attempts: Attempt[],
  now = new Date(),
): Mastery {
  const seen = new Set<string>();
  const evidence = attempts
    .filter((a) => a.skill === skill && a.first && !a.assisted)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .filter((a) => {
      if (seen.has(a.questionId)) return false;
      seen.add(a.questionId);
      return true;
    });
  let alpha = 2,
    beta = 2;
  for (const a of evidence) {
    const w = a.correct
      ? { easy: 0.6, medium: 1, hard: 1.3 }[a.difficulty]
      : { easy: 1.3, medium: 1, hard: 0.6 }[a.difficulty];
    if (a.correct) alpha += w;
    else beta += w;
  }
  const mean = alpha / (alpha + beta),
    sd = Math.sqrt((alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1)));
  const last = evidence.at(-1)?.createdAt ?? null;
  const days = last
    ? Math.max(0, (now.getTime() - new Date(last).getTime()) / 86400000)
    : 0;
  const halfLife = 3 + evidence.filter((a) => a.correct).length * 2;
  return {
    skill,
    mean,
    low: Math.max(0, mean - 1.645 * sd),
    high: Math.min(1, mean + 1.645 * sd),
    n: evidence.length,
    correct: evidence.filter((a) => a.correct).length,
    last,
    retention: mean * Math.pow(0.5, days / halfLife),
    due: evidence.length > 0 && evidence.some((a) => new Date(a.dueAt) <= now),
  };
}
export function recommend(
  skills: Skill[],
  attempts: Attempt[],
  now = new Date(),
) {
  return skills
    .map((s) => {
      const m = masteryFor(s.id, attempts, now);
      const recent = attempts
        .filter((a) => a.skill === s.id && a.first && !a.assisted)
        .slice(-5);
      const misses = recent.filter((a) => !a.correct).length;
      const weakPrerequisite = s.prerequisites.find((id) => {
        const p = masteryFor(id, attempts, now);
        return p.n >= 3 && p.mean < 0.45;
      });
      const score =
        (1 - m.mean) * 2 +
        (m.high - m.low) +
        Math.min(s.weight * 8, 0.6) +
        (m.due ? 0.8 : 0) +
        (misses ? misses * 0.15 : 0) -
        (weakPrerequisite ? 0.4 : 0);
      const reason = weakPrerequisite
        ? `Review ${skills.find((x) => x.id === weakPrerequisite)?.name.toLowerCase()} first; ${s.name.toLowerCase()} builds on it.`
        : m.n === 0
          ? `No independent answers yet. A short set will establish a starting point in ${s.name.toLowerCase()}.`
          : misses
            ? `${misses} of your last ${recent.length} independent answers in this skill were incorrect. Use new questions to check the concept.`
            : m.due
              ? "This skill is due for a spaced review. Check what you remember with a new question."
              : `${m.correct} of ${m.n} independent answers correct. Try a fresh question to strengthen the evidence.`;
      return {
        ...m,
        skill: s,
        rank: score,
        reason,
        prerequisite: weakPrerequisite ?? null,
      };
    })
    .sort((a, b) => b.rank - a.rank || a.skill.id.localeCompare(b.skill.id));
}
export function selectQuestions(
  bank: Question[],
  skills: Skill[],
  attempts: Attempt[],
  options: {
    section?: string;
    skill?: string;
    difficulty?: string;
    mode?: string;
    count: number;
    exclude?: string[];
    bookmarks?: string[];
  },
) {
  const seen = new Set(attempts.map((a) => a.questionId));
  const misses = new Set(
    attempts.filter((a) => !a.correct).map((a) => a.questionId),
  );
  const exclude = new Set(options.exclude ?? []);
  const ranks = recommend(skills, attempts);
  const map = new Map(ranks.map((r, i) => [r.skill.id, { ...r, order: i }]));
  const eligible = bank.filter(
    (q) =>
      !exclude.has(q.id) &&
      (!options.section ||
        options.section === "all" ||
        q.section === options.section) &&
      (!options.skill || q.skill === options.skill) &&
      (!options.difficulty ||
        options.difficulty === "all" ||
        q.difficulty === options.difficulty) &&
      (options.mode !== "mistakes" || misses.has(q.id)) &&
      (options.mode !== "bookmarks" || options.bookmarks?.includes(q.id)) &&
      (options.mode !== "review" ||
        attempts.some(
          (a) => a.questionId === q.id && new Date(a.dueAt) <= new Date(),
        )),
  );
  const used = new Map<string, number>();
  const result: Question[] = [];
  while (result.length < options.count && eligible.length) {
    eligible.sort((a, b) => {
      const score = (q: Question) => {
        const m = map.get(q.skill);
        const target = m && m.n >= 3 ? (m.mean - 0.5) * 2 : 0;
        return (
          (m?.rank ?? 0) -
          (seen.has(q.id) &&
          !["mistakes", "review", "bookmarks"].includes(options.mode ?? "")
            ? 3
            : 0) -
          (used.get(q.family) ?? 0) * 1.6 -
          Math.abs(q.calibration.difficulty - target) * 0.3
        );
      };
      return score(b) - score(a) || a.id.localeCompare(b.id);
    });
    const q = eligible.shift()!;
    result.push(q);
    used.set(q.family, (used.get(q.family) ?? 0) + 1);
  }
  return result;
}
export function studyPlan(
  skills: Skill[],
  attempts: Attempt[],
  preferences: Preferences,
  now = new Date(),
) {
  const ranks = recommend(skills, attempts, now);
  const chosen = preferences.days.length ? preferences.days : [1, 3, 5];
  const budget = Math.max(
    10,
    Math.round(preferences.weeklyMinutes / chosen.length),
  );
  const days: {
    date: string;
    skill: Skill;
    minutes: number;
    count: number;
    reason: string;
  }[] = [];
  for (let i = 0; i < 14 && days.length < chosen.length; i++) {
    const date = new Date(calendarDate(now) + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() + i);
    if (!chosen.includes(date.getUTCDay())) continue;
    const rec = ranks[days.length % ranks.length];
    days.push({
      date: date.toISOString().slice(0, 10),
      skill: rec.skill,
      minutes: budget,
      count: Math.max(3, Math.floor((budget * 60) / 85)),
      reason: rec.reason,
    });
  }
  return days;
}
export function evaluation(predictions: { p: number; correct: boolean }[]) {
  if (!predictions.length)
    return { n: 0, brier: null, logLoss: null, calibrationError: null };
  const brier =
    predictions.reduce((s, x) => s + (x.p - Number(x.correct)) ** 2, 0) /
    predictions.length;
  const logLoss =
    -predictions.reduce(
      (s, x) =>
        s +
        (x.correct
          ? Math.log(Math.max(1e-9, x.p))
          : Math.log(Math.max(1e-9, 1 - x.p))),
      0,
    ) / predictions.length;
  let calibrationError = 0;
  for (let i = 0; i < 10; i++) {
    const bin = predictions.filter(
      (x) => Math.min(9, Math.floor(x.p * 10)) === i,
    );
    if (bin.length)
      calibrationError +=
        (bin.length / predictions.length) *
        Math.abs(
          bin.reduce((s, x) => s + x.p, 0) / bin.length -
            bin.filter((x) => x.correct).length / bin.length,
        );
  }
  return { n: predictions.length, brier, logLoss, calibrationError };
}
/** Provisional Rasch/1PL interface; parameters are never labelled empirically calibrated. */
export function raschProbability(theta: number, difficulty: number) {
  return 1 / (1 + Math.exp(-(theta - difficulty)));
}
export function provisionalPrediction(mastery: Mastery, difficulty: number) {
  const p = Math.max(0.01, Math.min(0.99, mastery.mean));
  return raschProbability(Math.log(p / (1 - p)), difficulty);
}
