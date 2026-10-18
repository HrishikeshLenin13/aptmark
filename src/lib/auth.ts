import { cookies } from "next/headers";
import { db, hash, id, now } from "./db";
import crypto from "node:crypto";
export type User = { id: string; email: string | null; guest: number };
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("folio_session")?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      "SELECT u.id,u.email,u.guest FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
    )
    .get(hash(token), now()) as User | undefined;
  return row ?? null;
}
export async function setSession(user: string, secure: boolean) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 86400000);
  db()
    .prepare("INSERT INTO sessions VALUES(?,?,?)")
    .run(hash(token), user, expires.toISOString());
  (await cookies()).set("folio_session", token, {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    expires,
  });
}
export function makeGuest() {
  const user = id();
  db().prepare("INSERT INTO users(id,created_at) VALUES(?,?)").run(user, now());
  return user;
}
export function passwordHash(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  const expected = Buffer.from(key, "hex");
  return crypto.timingSafeEqual(
    expected,
    crypto.scryptSync(password, salt, 64),
  );
}
