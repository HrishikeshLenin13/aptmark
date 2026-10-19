import { serializePublicQuestion } from "./public-question";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import policy from "./content-policy.json";
import { questionEligible, previewAllowed } from "./content-policy";
import type {
  Question,
  Skill,
  Attempt,
  Preferences,
  Exam,
  PublicQuestion,
} from "./types";
let instance: DatabaseSync | undefined;
export function db() {
  if (instance) return instance;
  const location = process.env.DATABASE_PATH
    ? path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH)
    : path.join(process.cwd(), "data", "folio.sqlite");
  fs.mkdirSync(path.dirname(location), { recursive: true });
  const d = (instance = new DatabaseSync(location));
  d.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,guest INTEGER NOT NULL DEFAULT 1,preferences TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS questions(id TEXT PRIMARY KEY,data TEXT NOT NULL,source_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS question_versions(question_id TEXT NOT NULL,content_hash TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(question_id,content_hash));
 CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,question_id TEXT NOT NULL REFERENCES questions(id),data TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS attempt_user ON attempts(user_id,question_id);
 CREATE TABLE IF NOT EXISTS bookmarks(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,question_id TEXT NOT NULL REFERENCES questions(id),PRIMARY KEY(user_id,question_id));
 CREATE TABLE IF NOT EXISTS exams(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS exam_user ON exams(user_id);
 CREATE TABLE IF NOT EXISTS drafts(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,question_id TEXT NOT NULL REFERENCES questions(id),data TEXT NOT NULL,PRIMARY KEY(user_id,question_id));
 CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE SET NULL,question_id TEXT NOT NULL REFERENCES questions(id),message TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS editorial(id TEXT PRIMARY KEY,question_id TEXT NOT NULL REFERENCES questions(id),reviewer TEXT NOT NULL,action TEXT NOT NULL,notes TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS tutor_usage(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,question_id TEXT NOT NULL,level INTEGER NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
 `);
  if (
    !(
      d.prepare("PRAGMA table_info(questions)").all() as { name: string }[]
    ).some((c) => c.name === "active")
  )
    d.exec(
      "ALTER TABLE questions ADD COLUMN active INTEGER NOT NULL DEFAULT 1",
    );
  const bankPath = path.join(process.cwd(), "content", "bank.json");
  if (fs.existsSync(bankPath)) {
    const bank = JSON.parse(fs.readFileSync(bankPath, "utf8")) as Question[];
    const insert = d.prepare(
      "INSERT INTO questions(id,data,source_hash) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, source_hash=excluded.source_hash WHERE questions.source_hash <> excluded.source_hash",
    );
    d.exec("BEGIN");
    try {
      d.exec("UPDATE questions SET active=0");
      const activate = d.prepare("UPDATE questions SET active=1 WHERE id=?");
      const version = d.prepare(
        "INSERT OR IGNORE INTO question_versions VALUES(?,?,?,?)",
      );
      for (const q of bank) {
        const old = d
          .prepare("SELECT data,source_hash FROM questions WHERE id=?")
          .get(q.id) as { data: string; source_hash: string } | undefined;
        if (old && old.source_hash !== q.contentHash)
          version.run(
            q.id,
            old.source_hash,
            old.data,
            new Date().toISOString(),
          );
        insert.run(q.id, JSON.stringify(q), q.contentHash);
        activate.run(q.id);
      }
      d.exec("COMMIT");
    } catch (e) {
      d.exec("ROLLBACK");
      throw e;
    }
  }
  return d;
}
export function transaction<T>(f: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const result = f();
    d.exec("COMMIT");
    return result;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function id() {
  return crypto.randomUUID();
}
export function hash(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
export function now() {
  return new Date().toISOString();
}
export function skills(): Skill[] {
  return JSON.parse(
    fs.readFileSync(path.resolve("content/taxonomy.json"), "utf8"),
  );
}
export function allQuestions(): Question[] {
  return (
    db()
      .prepare("SELECT data FROM questions WHERE active=1 ORDER BY id")
      .all() as { data: string }[]
  ).map((r) => JSON.parse(r.data));
}
export function previewEnabled() {
  return previewAllowed(policy, process.env.CONTENT_PREVIEW === "true");
}
export function eligibleQuestions(): Question[] {
  return allQuestions().filter((q) =>
    questionEligible(q, policy, process.env.CONTENT_PREVIEW === "true"),
  );
}
export function question(id: string): Question | undefined {
  const row = db().prepare("SELECT data FROM questions WHERE id=?").get(id) as
    { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}
export const publicQuestion = serializePublicQuestion;
export function attempts(user: string): Attempt[] {
  return (
    db()
      .prepare("SELECT data FROM attempts WHERE user_id=? ORDER BY rowid")
      .all(user) as { data: string }[]
  ).map((r) => JSON.parse(r.data));
}
export function bookmarks(user: string): string[] {
  return (
    db()
      .prepare("SELECT question_id FROM bookmarks WHERE user_id=?")
      .all(user) as { question_id: string }[]
  ).map((r) => r.question_id);
}
export const DEFAULT_PREFERENCES: Preferences = {
  testDate: "",
  targetScore: 1400,
  weeklyMinutes: 120,
  days: [1, 3, 5],
};
export function preferences(user: string): Preferences {
  const row = db()
    .prepare("SELECT preferences FROM users WHERE id=?")
    .get(user) as { preferences: string };
  return { ...DEFAULT_PREFERENCES, ...JSON.parse(row.preferences) };
}
export function saveExam(e: Exam) {
  db()
    .prepare(
      "INSERT INTO exams(id,user_id,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
    )
    .run(e.id, e.userId, JSON.stringify(e));
}
export function loadExam(examId: string, userId: string): Exam | undefined {
  const r = db()
    .prepare("SELECT data FROM exams WHERE id=? AND user_id=?")
    .get(examId, userId) as { data: string } | undefined;
  return r ? JSON.parse(r.data) : undefined;
}
export function rateLimit(key: string, limit: number, windowMs = 60000) {
  const d = db(),
    t = Date.now();
  d.prepare("DELETE FROM rate_limits WHERE reset_at<?").run(t - windowMs);
  const row = d
    .prepare("SELECT count,reset_at FROM rate_limits WHERE key=?")
    .get(key) as { count: number; reset_at: number } | undefined;
  if (!row || row.reset_at < t) {
    d.prepare("INSERT OR REPLACE INTO rate_limits VALUES(?,?,?)").run(
      key,
      1,
      t + windowMs,
    );
    return true;
  }
  if (row.count >= limit) return false;
  d.prepare("UPDATE rate_limits SET count=count+1 WHERE key=?").run(key);
  return true;
}
