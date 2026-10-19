import { db, now } from "./db";
import { checkLesson, LESSONS, type LessonProgress } from "./lessons";
export function lessonProgress(user: string): LessonProgress[] {
  const rows = db()
    .prepare(
      "SELECT lesson_id,content_version,attempts,completed_at FROM lesson_progress WHERE user_id=?",
    )
    .all(user) as {
    lesson_id: string;
    content_version: number;
    attempts: number;
    completed_at: string | null;
  }[];
  return rows
    .filter((row) =>
      LESSONS.some(
        (lesson) =>
          lesson.id === row.lesson_id && lesson.version === row.content_version,
      ),
    )
    .map((row) => ({
      lessonId: row.lesson_id,
      version: row.content_version,
      attempts: row.attempts,
      completedAt: row.completed_at,
    }));
}
export function recordLessonCheck(
  user: string,
  lessonId: string,
  answer: string,
) {
  const result = checkLesson(lessonId, answer);
  if (!result) throw Error("Lesson not found.");
  const at = now();
  db()
    .prepare(
      `INSERT INTO lesson_progress(user_id,lesson_id,content_version,attempts,completed_at,updated_at)
    VALUES(?,?,?,1,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET
    attempts=CASE WHEN lesson_progress.content_version=excluded.content_version THEN lesson_progress.attempts+1 ELSE 1 END,
    completed_at=CASE WHEN lesson_progress.content_version=excluded.content_version THEN COALESCE(lesson_progress.completed_at,excluded.completed_at) ELSE excluded.completed_at END,
    content_version=excluded.content_version,updated_at=excluded.updated_at`,
    )
    .run(user, lessonId, result.version, result.correct ? at : null, at);
  return { ...result, progress: lessonProgress(user) };
}
