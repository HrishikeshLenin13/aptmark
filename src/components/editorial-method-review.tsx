import type { Question } from "@/lib/types";

type ReviewQuestion = Pick<
  Question,
  "id" | "skill" | "steps" | "solutionMethod" | "difficultyCalibration"
>;

export function EditorialMethodReview({
  question,
}: {
  question: ReviewQuestion;
}) {
  const method = question.solutionMethod;
  if (!method)
    return (
      <p className="editor-review-legacy">
        This generation has no recorded method blueprint. Review the reasoning,
        evidence and provenance below before recording a decision.
      </p>
    );
  const id = `method-${question.id}`;
  return (
    <section className="editor-review" aria-labelledby={id}>
      <header>
        <h4 id={id}>Method & structure</h4>
        <span>
          Authored variant {method.variantIndex + 1} of{" "}
          {method.authoredVariantCount}
        </span>
      </header>
      <dl>
        <div>
          <dt>Blueprint</dt>
          <dd>{method.blueprintId}</dd>
        </div>
        <div>
          <dt>Solution method</dt>
          <dd>{method.method}</dd>
        </div>
        <div>
          <dt>Rule or heuristic</dt>
          <dd>{method.formula}</dd>
        </div>
        <div>
          <dt>Question structure</dt>
          <dd>{method.structure}</dd>
        </div>
      </dl>
      <p className="editor-review-note">
        An instructional method is not a score formula or editorial approval.
        Difficulty status: {question.difficultyCalibration}.
      </p>
      {method.skill !== question.skill && (
        <p className="error" role="alert">
          The blueprint skill does not match this item. Resolve the mismatch
          before review.
        </p>
      )}
      <h5>Reasoning steps to verify</h5>
      <ol>
        {question.steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <h5>Distractor patterns to check</h5>
      <ul>
        {method.misconceptions.map((misconception) => (
          <li key={misconception}>{misconception}</li>
        ))}
      </ul>
    </section>
  );
}
