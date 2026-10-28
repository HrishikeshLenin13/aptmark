import { describe, expect, it } from "vitest";
import {
  AssessmentSync,
  type AssessmentWrite,
} from "../src/lib/assessment-sync";
import type { Exam } from "../src/lib/types";
const payload = (answer = "A", questionId = "q1"): AssessmentWrite => ({
  id: "exam",
  index: 0,
  questionId,
  answer,
  flag: false,
  note: "",
});
function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
const frame = (): Exam => ({
  id: "exam",
  userId: "owner",
  mode: "drill",
  current: 0,
  status: "active",
  breakUntil: null,
  createdAt: "2026-10-28T00:00:00Z",
  completedAt: null,
  preview: true,
  modules: [
    {
      index: 0,
      section: "rw",
      durationSeconds: 300,
      questionIds: ["q1", "q2"],
      answers: {},
      flags: [],
      notes: {},
      startedAt: null,
      deadline: null,
      submittedAt: null,
      route: "pacing",
    },
  ],
});
describe("assessment optimistic write synchronization", () => {
  it("keeps cached snapshots stable and notifies/unsubscribes listeners", async () => {
    const sync = new AssessmentSync("exam", async () => {});
    const original = sync.getSnapshot();
    expect(sync.getSnapshot()).toBe(original);
    let updates = 0;
    const off = sync.subscribe(() => updates++);
    sync.enqueue(payload());
    expect(updates).toBe(1);
    off();
    await sync.drain();
    expect(updates).toBe(1);
    expect(sync.getSnapshot().unsaved).toBe(0);
  });
  it("does not report saved while a newer edit is still pending", async () => {
    const one = deferred(),
      two = deferred();
    let calls = 0;
    const sync = new AssessmentSync("exam", () =>
      ++calls === 1 ? one.promise : two.promise,
    );
    sync.enqueue(payload("A"));
    await Promise.resolve();
    sync.enqueue(payload("B"));
    one.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sync.getSnapshot().unsaved).toBe(1);
    expect(sync.overlay(frame()).modules[0].answers.q1).toBe("B");
    two.resolve();
    await sync.drain();
    expect(calls).toBe(2);
    expect(sync.getSnapshot().pending).toBe(0);
  });
  it("coalesces superseded queued writes while keeping different questions", async () => {
    const sent: AssessmentWrite[] = [];
    const sync = new AssessmentSync("exam", async (p) => {
      sent.push(p);
    });
    sync.enqueue(payload("A"));
    sync.enqueue(payload("B"));
    sync.enqueue(payload("C", "q2"));
    await sync.drain();
    expect(sent.map((p) => p.answer)).toEqual(["B", "C"]);
  });
  it("retains failed answers, flags and notes across server frames and retries them", async () => {
    let fail = true;
    const sent: AssessmentWrite[] = [];
    const sync = new AssessmentSync("exam", async (p) => {
      if (fail) throw Error("Offline");
      sent.push(p);
    });
    sync.enqueue({ ...payload("B"), flag: true, note: "evidence" });
    await expect(sync.drain()).rejects.toThrow("Offline");
    const server = frame(),
      local = sync.overlay(server);
    expect(server.modules[0].answers).toEqual({});
    expect(local.modules[0].answers.q1).toBe("B");
    expect(local.modules[0].flags).toEqual(["q1"]);
    expect(local.modules[0].notes.q1).toBe("evidence");
    fail = false;
    sync.retry();
    await sync.drain();
    expect(sent).toHaveLength(1);
    expect(sync.getSnapshot().unsaved).toBe(0);
  });
  it("does not let a failed older request taint its newer successful replacement", async () => {
    const old = deferred();
    let calls = 0;
    const sync = new AssessmentSync("exam", () =>
      ++calls === 1 ? old.promise : Promise.resolve(),
    );
    sync.enqueue(payload("A"));
    await Promise.resolve();
    sync.enqueue(payload("B"));
    old.reject(Error("Old failure"));
    await sync.drain();
    expect(sync.getSnapshot().error).toBe("");
  });
  it("drains writes appended while a drain was already waiting", async () => {
    const gate = deferred();
    let calls = 0;
    const sync = new AssessmentSync("exam", () =>
      ++calls === 1 ? gate.promise : Promise.resolve(),
    );
    sync.enqueue(payload());
    await Promise.resolve();
    const drain = sync.drain();
    sync.enqueue(payload("B", "q2"));
    gate.resolve();
    await drain;
    expect(calls).toBe(2);
  });
  it("never overlays another module, unknown question, another assessment or a locked frame", async () => {
    const sync = new AssessmentSync("exam", async () => {
      throw Error("offline");
    });
    sync.enqueue({ ...payload("B"), index: 1 });
    sync.enqueue(payload("C", "unknown"));
    await expect(sync.drain()).rejects.toThrow();
    expect(sync.overlay(frame()).modules[0].answers).toEqual({});
    const closed = { ...frame(), status: "complete" as const };
    expect(sync.overlay(closed)).toBe(closed);
    const other = { ...frame(), id: "other" };
    expect(sync.overlay(other)).toBe(other);
    expect(() => sync.enqueue({ ...payload(), id: "other" })).toThrow(
      "another",
    );
  });
  it("stops queued/retried writes at closure while preserving unsent work for inspection", async () => {
    let sent = 0;
    const sync = new AssessmentSync("exam", async () => {
      sent++;
    });
    sync.enqueue(payload());
    sync.close();
    sync.retry();
    await expect(sync.drain()).rejects.toThrow();
    expect(sent).toBe(0);
    expect(sync.unsent()).toEqual([payload()]);
    expect(() => sync.enqueue(payload())).toThrow("locked");
  });
});

it("retires failed writes from a server-locked previous module without blocking the next module", async () => {
  let fail = true;
  const sync = new AssessmentSync("exam", async () => {
    if (fail) throw Error("offline");
  });
  sync.enqueue(payload("B"));
  await expect(sync.drain()).rejects.toThrow("offline");
  const next = frame();
  next.modules[0].submittedAt = "2026-10-28T00:08:00Z";
  next.modules.push({
    ...next.modules[0],
    index: 1,
    questionIds: ["q3"],
    answers: {},
    submittedAt: null,
  });
  next.current = 1;
  sync.retireLocked(next);
  expect(sync.getSnapshot().unsaved).toBe(0);
  expect(sync.getSnapshot().stranded).toBe(1);
  expect(sync.unsent(true)).toEqual([payload("B")]);
  fail = false;
  sync.enqueue({ ...payload("C", "q3"), index: 1 });
  await sync.drain();
  expect(sync.getSnapshot().unsaved).toBe(0);
  expect(sync.getSnapshot().stranded).toBe(1);
});
it("does not label server-confirmed content as stranded when a module locks", async () => {
  const sync = new AssessmentSync("exam", async () => {
    throw Error("ack lost");
  });
  sync.enqueue(payload("B"));
  await expect(sync.drain()).rejects.toThrow();
  const server = frame();
  server.status = "complete";
  server.modules[0].answers.q1 = "B";
  sync.retireLocked(server);
  expect(sync.getSnapshot().unsaved).toBe(0);
  expect(sync.getSnapshot().stranded).toBe(0);
});
