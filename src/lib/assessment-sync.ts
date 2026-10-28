import type { Exam } from "./types";

export type AssessmentWrite = {
  id: string;
  index: number;
  questionId: string;
  answer: string;
  flag: boolean;
  note: string;
};
type Draft = {
  payload: AssessmentWrite;
  version: number;
  failed: boolean;
  error: string;
};
export type SyncSnapshot = Readonly<{
  revision: number;
  pending: number;
  unsaved: number;
  stranded: number;
  error: string;
  closed: boolean;
}>;

/** One mounted assessment's optimistic writes. No answer keys, identity or scoring. */
export class AssessmentSync {
  private tail: Promise<void> = Promise.resolve();
  private drafts = new Map<string, Draft>();
  private stranded = new Map<string, Draft>();
  private listeners = new Set<() => void>();
  private version = 0;
  private snapshot: SyncSnapshot = {
    revision: 0,
    pending: 0,
    unsaved: 0,
    stranded: 0,
    error: "",
    closed: false,
  };
  constructor(
    readonly examId: string,
    private write: (payload: AssessmentWrite) => Promise<void>,
  ) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(
    pending = this.snapshot.pending,
    closed = this.snapshot.closed,
  ) {
    this.snapshot = {
      revision: this.snapshot.revision + 1,
      pending,
      closed,
      unsaved: this.drafts.size,
      stranded: this.stranded.size,
      error: [...this.drafts.values()].find((d) => d.failed)?.error ?? "",
    };
    this.listeners.forEach((listener) => listener());
  }
  enqueue(payload: AssessmentWrite) {
    if (this.snapshot.closed) throw Error("This assessment is locked.");
    if (payload.id !== this.examId)
      throw Error("Write belongs to another assessment.");
    const key = `${payload.index}:${payload.questionId}`;
    const draft: Draft = {
      payload: { ...payload },
      version: ++this.version,
      failed: false,
      error: "",
    };
    this.drafts.set(key, draft);
    this.publish(this.snapshot.pending + 1);
    this.tail = this.tail.then(async () => {
      try {
        // Intermediate text edits that have not left the browser are superseded.
        if (
          this.snapshot.closed ||
          this.drafts.get(key)?.version !== draft.version
        )
          return;
        await this.write({ ...draft.payload });
        if (this.drafts.get(key)?.version === draft.version)
          this.drafts.delete(key);
      } catch (error) {
        if (this.drafts.get(key)?.version === draft.version) {
          draft.failed = true;
          draft.error =
            error instanceof Error
              ? error.message
              : "Changes could not be saved. Retry before leaving.";
        }
      } finally {
        this.publish(this.snapshot.pending - 1);
      }
    });
  }
  retry() {
    if (this.snapshot.closed) return;
    for (const draft of [...this.drafts.values()])
      if (draft.failed) this.enqueue(draft.payload);
  }
  async drain() {
    let observed: Promise<void>;
    do {
      observed = this.tail;
      await observed;
    } while (observed !== this.tail);
    if (this.drafts.size)
      throw Error(
        this.snapshot.error || "Some changes have not reached the server.",
      );
  }
  close() {
    if (!this.snapshot.closed) this.publish(this.snapshot.pending, true);
  }
  retireLocked(exam: Exam) {
    if (exam.id !== this.examId) return;
    let changed = false;
    for (const [key, draft] of this.drafts) {
      const p = draft.payload,
        module = exam.modules[p.index];
      if (
        !module ||
        (exam.status !== "complete" &&
          !module.submittedAt &&
          p.index === exam.current)
      )
        continue;
      const matches =
        (module.answers[p.questionId] ?? "") === p.answer &&
        (module.notes[p.questionId] ?? "") === p.note &&
        module.flags.includes(p.questionId) === p.flag;
      if (!matches) this.stranded.set(key, draft);
      this.drafts.delete(key);
      changed = true;
    }
    if (changed) this.publish();
  }
  unsent(lockedOnly = false) {
    return [
      ...this.stranded.values(),
      ...(lockedOnly ? [] : this.drafts.values()),
    ].map((d) => ({ ...d.payload }));
  }
  overlay(exam: Exam): Exam {
    if (exam.id !== this.examId || exam.status !== "active") return exam;
    const next = structuredClone(exam);
    const module = next.modules[next.current];
    for (const { payload: p } of this.drafts.values()) {
      if (
        p.index !== next.current ||
        !module.questionIds.includes(p.questionId) ||
        module.submittedAt
      )
        continue;
      module.answers[p.questionId] = p.answer;
      module.notes[p.questionId] = p.note;
      module.flags = p.flag
        ? [...new Set([...module.flags, p.questionId])]
        : module.flags.filter((id) => id !== p.questionId);
    }
    return next;
  }
}
