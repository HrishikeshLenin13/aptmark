"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { MathText } from "./math-text";
import type { PublicLesson, LessonProgress } from "@/lib/lessons";
type Payload = {
  lessons: PublicLesson[];
  progress: LessonProgress[];
  preview: boolean;
};
type Result = {
  correct: boolean;
  answer: string;
  explanation: string;
  progress: LessonProgress[];
};
export function LearningCenter() {
  const params = useSearchParams();
  const [data, setData] = useState<Payload | null>(null),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [section, setSection] = useState("all");
  const [answer, setAnswer] = useState(""),
    [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false);
  const id = params.get("lesson");
  const activeLesson = useRef(id);
  activeLesson.current = id;
  useEffect(() => {
    let ignore = false;
    fetch("/api/lessons")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw Error(body.error ?? "The lesson library could not be opened.");
        if (!ignore) setData(body);
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      });
    return () => {
      ignore = true;
    };
  }, []);
  // A changed URL identifies a different comprehension check, not the prior answer state.
  useEffect(() => {
    setAnswer("");
    setResult(null);
    setError("");
    setBusy(false);
  }, [id]);
  const current = data?.lessons.find((lesson) => lesson.id === id);
  const completed = new Set(
    data?.progress
      .filter((progress) => progress.completedAt)
      .map((progress) => progress.lessonId) ?? [],
  );
  const visible =
    data?.lessons.filter(
      (lesson) =>
        (section === "all" || lesson.section === section) &&
        (lesson.title + " " + lesson.summary)
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
    ) ?? [];
  async function submit() {
    if (!current || !answer || busy) return;
    const submittedLesson = current.id;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/lessons/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: current.id, answer }),
      });
      const body = await response.json();
      if (!response.ok)
        throw Error(body.error ?? "Your check could not be saved.");
      if (activeLesson.current !== submittedLesson) return;
      setResult(body);
      setData((previous) =>
        previous ? { ...previous, progress: body.progress } : previous,
      );
    } catch (e) {
      if (activeLesson.current === submittedLesson)
        setError((e as Error).message);
    } finally {
      if (activeLesson.current === submittedLesson) setBusy(false);
    }
  }
  if (!data)
    return (
      <section className="lesson-loading" aria-busy={!error}>
        <BookOpen size={28} />
        <h1>
          {error
            ? "Let’s reopen your library."
            : "Opening the learning library…"}
        </h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <Button onClick={() => location.reload()}>Try again</Button>
          </>
        ) : (
          <p>Short lessons, worked examples, and one clear next step.</p>
        )}
      </section>
    );
  if (!data.preview && !data.lessons.length)
    return (
      <section className="lesson-loading">
        <BookOpen size={28} />
        <h1>The lesson library is being reviewed.</h1>
        <p>
          Original lessons will appear here after independent editorial review.
          Your practice workspace remains available.
        </p>
        <Button asChild>
          <Link href="/practice">Explore practice</Link>
        </Button>
      </section>
    );
  if (id && !current)
    return (
      <section className="lesson-loading">
        <h1>This lesson isn’t in the library.</h1>
        <p>Choose one of the available foundation lessons.</p>
        <Button asChild>
          <Link href="/learn">Browse lessons</Link>
        </Button>
      </section>
    );
  if (current)
    return (
      <div className="lesson-workspace">
        <Link href="/learn" className="text-button">
          <ArrowLeft size={16} />
          All lessons
        </Link>
        <header className="lesson-heading">
          <div>
            <span className="tag">
              {current.section === "math" ? "Math" : "Reading & Writing"} lesson
              preview
            </span>
            <h1>{current.title}</h1>
            <p>{current.summary}</p>
            <span className="lesson-duration">
              <Clock3 size={15} />
              About {current.minutes} minutes{" "}
              {completed.has(current.id) && (
                <span className="lesson-completed">
                  <CheckCircle2 size={15} />
                  Completed check
                </span>
              )}
            </span>
          </div>
        </header>
        <div className="lesson-columns">
          <article className="lesson-reading">
            <section className="lesson-objectives">
              <h2>What you’ll learn</h2>
              <ul>
                {current.objectives.map((objective) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </section>
            {current.steps.map((step) => (
              <section key={step.title}>
                <h2>{step.title}</h2>
                <p>
                  <MathText text={step.text} />
                </p>
              </section>
            ))}
            <section className="worked-example">
              <span className="lesson-example-label">Worked example</span>
              <h2>
                <MathText text={current.example.prompt} />
              </h2>
              <ol>
                {current.example.reasoning.map((reason) => (
                  <li key={reason}>
                    <MathText text={reason} />
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <h2>Keep these ideas</h2>
              <ul>
                {current.takeaways.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </section>
          </article>
          <aside className="lesson-check-panel">
            <div className="lesson-check-heading">
              <GraduationCap size={21} />
              <h2>Check your understanding</h2>
            </div>
            <p className="lesson-check-prompt">
              <MathText text={current.check.prompt} />
            </p>
            <fieldset disabled={busy || !!result}>
              <legend className="sr-only">Lesson answer choices</legend>
              {current.check.options.map((option, index) => (
                <label
                  key={option}
                  className={
                    "lesson-option " + (answer === option ? "selected" : "")
                  }
                >
                  <input
                    type="radio"
                    name={current.id}
                    value={option}
                    checked={answer === option}
                    onChange={() => setAnswer(option)}
                  />
                  <span className="lesson-option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="lesson-option-text">
                    <MathText text={option} />
                  </span>
                </label>
              ))}
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {!result ? (
              <Button onClick={() => void submit()} disabled={!answer || busy}>
                {busy ? "Saving your check…" : "Check understanding"}
              </Button>
            ) : (
              <div
                className={
                  "lesson-feedback " + (result.correct ? "is-correct" : "")
                }
                role="status"
              >
                <h3>
                  {result.correct
                    ? "You’ve got the idea."
                    : "A useful distinction to notice."}
                </h3>
                <p>
                  <MathText text={result.explanation} />
                </p>
                {!result.correct && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAnswer("");
                      setResult(null);
                    }}
                  >
                    Try the check again
                  </Button>
                )}
              </div>
            )}
            <p className="lesson-evidence-note">
              Lesson checks save your learning progress. They do not count as
              independent practice mastery evidence.
            </p>
            <Link
              className="lesson-practice-link"
              href={`/practice?section=${current.section}&skill=${current.skill}&count=5`}
            >
              Try five practice questions
              <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </div>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A little clarity goes a long way.</h1>
          <p>Learn a method, see it in action, then put it into practice.</p>
        </div>
        <span className="lesson-library-progress">
          <BookOpen size={18} />
          {completed.size} of {data.lessons.length} checks completed
        </span>
      </div>
      <section className="learning-intro">
        <div>
          <span className="tag">Foundation library</span>
          <h2>
            Understand the idea.
            <br />
            Make it your own.
          </h2>
          <p>
            Short, original lessons built for focused study. Each one pairs a
            clear explanation with a worked example and a quick understanding
            check.
          </p>
        </div>
        <div className="learning-intro-note">
          <GraduationCap size={32} />
          <strong>Learn. Check. Apply.</strong>
          <p>Use the lesson as a starting point, not a score prediction.</p>
        </div>
      </section>
      <div className="lesson-library-controls">
        <div
          className="section-toggle"
          role="group"
          aria-label="Lesson section"
        >
          {[
            ["all", "All lessons"],
            ["math", "Math"],
            ["rw", "Reading & Writing"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={section === value}
              className={section === value ? "selected" : ""}
              onClick={() => setSection(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="lesson-search">
          <Search size={17} />
          <span className="sr-only">Find a lesson</span>
          <input
            type="search"
            placeholder="Find a concept"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <p className="lesson-preview-note">
        Original lesson previews, pending independent editorial review.
        Estimated reading time, not video duration.
      </p>
      <div className="lesson-grid">
        {visible.map((lesson) => (
          <Link
            href={`/learn?lesson=${lesson.id}`}
            key={lesson.id}
            className="lesson-card"
          >
            <div className="lesson-card-top">
              <span>
                {lesson.section === "math" ? "Math" : "Reading & Writing"}
              </span>
              {completed.has(lesson.id) ? (
                <CheckCircle2 size={19} aria-label="Completed check" />
              ) : (
                <BookOpen size={19} />
              )}
            </div>
            <h2>{lesson.title}</h2>
            <p>{lesson.summary}</p>
            <div className="lesson-card-footer">
              <span>
                <Clock3 size={14} />
                {lesson.minutes} min
              </span>
              <strong>
                {completed.has(lesson.id) ? "Review lesson" : "Open lesson"}
                <ArrowRight size={15} />
              </strong>
            </div>
          </Link>
        ))}
      </div>
      {!visible.length && (
        <section className="lesson-loading">
          <h2>No lessons match yet.</h2>
          <p>Try a broader search or another section.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("");
              setSection("all");
            }}
          >
            Show all lessons
          </Button>
        </section>
      )}
    </>
  );
}
