// Server-side lesson source. Client components import types only; check keys are never serialized.
export type Lesson = {
  id: string;
  version: number;
  title: string;
  section: "math" | "rw";
  skill: string;
  minutes: number;
  summary: string;
  objectives: string[];
  steps: { title: string; text: string }[];
  example: { prompt: string; reasoning: string[] };
  takeaways: string[];
  check: {
    prompt: string;
    options: string[];
    answer: string;
    explanation: string;
  };
};
export type PublicLesson = Omit<Lesson, "check"> & {
  check: Pick<Lesson["check"], "prompt" | "options">;
};
export type LessonProgress = {
  lessonId: string;
  version: number;
  attempts: number;
  completedAt: string | null;
};
export const LESSONS: Lesson[] = [
  {
    id: "equations-balance",
    version: 1,
    title: "Keep an equation in balance",
    section: "math",
    skill: "linear-one",
    minutes: 5,
    summary:
      "Treat every operation as a change to both sides, then check the result in the original equation.",
    objectives: [
      "Choose inverse operations",
      "Verify a solution by substitution",
    ],
    steps: [
      {
        title: "Find the structure",
        text: "In a linear equation, identify what is being done to the unknown. Reverse those operations in a convenient order while doing the same thing to each side.",
      },
      {
        title: "Check the original",
        text: "Substitute your proposed value into the original equation, not just the final rearranged line. This catches a sign error that might otherwise go unnoticed.",
      },
    ],
    example: {
      prompt: "Solve $4x+7=31$.",
      reasoning: [
        "Subtract 7 from both sides: $4x=24$.",
        "Divide both sides by 4: $x=6$.",
        "Check: $4(6)+7=31$. Both sides agree.",
      ],
    },
    takeaways: [
      "An operation on only one side generally changes the equation.",
      "A quick substitution is an independent check.",
    ],
    check: {
      prompt: "Which value satisfies $3x-5=16$?",
      options: ["3", "7", "11", "21"],
      answer: "7",
      explanation:
        "Add 5 to obtain 3x=21, then divide by 3. Substitution gives 3(7)-5=16.",
    },
  },
  {
    id: "systems-meaning",
    version: 1,
    title: "Read the structure of a system",
    section: "math",
    skill: "linear-systems",
    minutes: 6,
    summary:
      "Decide whether two equations meet once, never, or describe the same line.",
    objectives: [
      "Compare coefficient ratios",
      "Separate parallel lines from coincident lines",
    ],
    steps: [
      {
        title: "Compare whole equations",
        text: "Multiplying every term of an equation by the same nonzero number leaves its solution set unchanged. If the entire second equation is that multiple, the two equations describe the same line.",
      },
      {
        title: "Watch the constant",
        text: "If x and y coefficients have the same scale factor but the constants do not, the lines are parallel and distinct. No point satisfies both equations.",
      },
    ],
    example: {
      prompt: "Compare $2x+3y=12$ and $4x+6y=25$.",
      reasoning: [
        "Doubling the first equation gives $4x+6y=24$.",
        "The second equation requires the same left side to equal 25.",
        "Those conditions contradict one another, so there is no solution.",
      ],
    },
    takeaways: [
      "Do not compare only the x coefficients.",
      "A contradiction signals no solution, not a zero-valued solution.",
    ],
    check: {
      prompt:
        "The equations are x+2y=8 and 3x+6y=24. How many solutions do they have?",
      options: ["None", "Exactly one", "Exactly two", "Infinitely many"],
      answer: "Infinitely many",
      explanation:
        "The second equation is three times the entire first equation, including its constant, so both describe the same line.",
    },
  },
  {
    id: "quadratic-structure",
    version: 1,
    title: "Use a quadratic’s structure",
    section: "math",
    skill: "nonlinear-functions",
    minutes: 6,
    summary: "Choose a representation that makes a requested feature visible.",
    objectives: [
      "Read a vertex from vertex form",
      "Distinguish an input from a minimum output",
    ],
    steps: [
      {
        title: "Match form to purpose",
        text: "Factored form makes roots visible. Vertex form makes an extreme value visible. Expanded form can make the y-intercept easy to read. Rewriting is useful when it exposes the feature being asked about.",
      },
      {
        title: "Name the coordinate",
        text: "For a positive a, a(x-h)^2+k has its minimum when x=h. The minimum output is k. The input and output are different quantities.",
      },
    ],
    example: {
      prompt: "For $f(x)=3(x-4)^2+2$, identify the minimum point.",
      reasoning: [
        "The square is nonnegative and the multiplier is positive.",
        "At x=4, the square is zero and f(x)=2.",
        "The vertex is (4,2): minimum input 4, minimum output 2.",
      ],
    },
    takeaways: [
      "Read exactly what quantity the question requests.",
      "A larger coefficient changes vertical scaling, not the vertex input.",
    ],
    check: {
      prompt: "For f(x)=2(x+3)^2+5, what is the x-coordinate of the minimum?",
      options: ["3", "-3", "5", "-5"],
      answer: "-3",
      explanation:
        "The squared term is zero when x+3=0, so the minimum occurs at x=-3. The minimum output is 5, which is not the requested coordinate.",
    },
  },
  {
    id: "percent-multipliers",
    version: 1,
    title: "Use multipliers for percent change",
    section: "math",
    skill: "percentages",
    minutes: 5,
    summary:
      "Apply each percent to the correct base, especially when changes happen in sequence.",
    objectives: [
      "Translate a percent change into a multiplier",
      "Avoid adding successive percentages",
    ],
    steps: [
      {
        title: "Keep the base in view",
        text: "An increase of p percent multiplies the current value by 1+p/100. A decrease multiplies it by 1-p/100. The word current matters: a later percent usually applies to a new base.",
      },
      {
        title: "Multiply successive changes",
        text: "Apply multipliers in sequence. Equal percentage increases and decreases do not normally cancel, because the second change uses a different base.",
      },
    ],
    example: {
      prompt: "A price of $80 rises by 25%, then falls by 20%.",
      reasoning: [
        "First multiply 80 by 1.25 to get 100.",
        "Then multiply 100 by 0.80 to get 80.",
        "Here the changes cancel because 1.25×0.80=1, not because their percentages are equal.",
      ],
    },
    takeaways: [
      "A percent is relative to a base.",
      "Check the product of growth factors, not the sum of percentage labels.",
    ],
    check: {
      prompt:
        "A value of 100 increases by 10% and then decreases by 10%. What is the final value?",
      options: ["90", "99", "100", "101"],
      answer: "99",
      explanation:
        "100×1.10×0.90=99. The decrease is 10% of 110, not 10% of the original 100.",
    },
  },
  {
    id: "conditional-probability",
    version: 1,
    title: "Choose the right sample space",
    section: "math",
    skill: "probability",
    minutes: 5,
    summary:
      "Translate a condition into the group that actually belongs in your denominator.",
    objectives: [
      "Identify the conditioned group",
      "Keep joint and conditional probabilities separate",
    ],
    steps: [
      {
        title: "Start with the condition",
        text: "A phrase such as given that or among those who narrows the sample space. Count that group before choosing a numerator.",
      },
      {
        title: "Count the overlap",
        text: "Within the narrowed group, count the members that also satisfy the requested property. Divide the overlap by the narrowed total.",
      },
    ],
    example: {
      prompt:
        "A club has 12 attending seniors and 18 attending juniors. A member who attended is selected at random. What is the probability of selecting a senior?",
      reasoning: [
        "The condition is attendance, so the sample space contains 12+18=30 members.",
        "Of those 30 members, 12 are seniors.",
        "The conditional probability is 12/30=2/5.",
      ],
    },
    takeaways: [
      "The denominator is not automatically the full population.",
      "Label both the numerator and denominator in words.",
    ],
    check: {
      prompt:
        "Of 40 workshop attendees, 15 are beginners. One attendee is selected at random. What is the probability that the selected attendee is a beginner?",
      options: ["15/25", "25/40", "15/40", "40/15"],
      answer: "15/40",
      explanation:
        "The sample space is the 40 attendees. The 15 beginners are the favorable outcomes, giving 15/40=3/8.",
    },
  },
  {
    id: "calculator-judgment",
    version: 1,
    title: "Choose algebra or a graph deliberately",
    section: "math",
    skill: "linear-systems",
    minutes: 6,
    summary:
      "Use a calculator to reduce work while keeping the mathematical meaning in view.",
    objectives: [
      "Recognize intersections as simultaneous solutions",
      "Check graph-window and rounding limits",
    ],
    steps: [
      {
        title: "Decide what the tool should show",
        text: "For two equations in x and y, an intersection is a point satisfying both. A graph can help locate it, but an empty viewing window is not proof that there are no intersections.",
      },
      {
        title: "Confirm the requested quantity",
        text: "Read both coordinates, note whether an exact value is required, and substitute when possible. A graph provides a representation; it does not replace interpreting the question.",
      },
    ],
    example: {
      prompt: "Solve y=2x+1 and y=7-x.",
      reasoning: [
        "An intersection must have 2x+1=7-x.",
        "Thus 3x=6, giving x=2 and y=5.",
        "A calculator graph can confirm (2,5); substitution verifies both original equations.",
      ],
    },
    takeaways: [
      "Change the viewing window before concluding a graph has no intersection.",
      "Use exact algebra when a rounded display could hide the required value.",
    ],
    check: {
      prompt:
        "A graph shows the intersection (3,8). The question asks for x+y. What should you report?",
      options: ["3", "5", "8", "11"],
      answer: "11",
      explanation:
        "The requested quantity is the sum of coordinates: 3+8=11, not either coordinate alone.",
    },
  },
  {
    id: "central-idea-scope",
    version: 1,
    title: "Keep a central idea at the right scope",
    section: "rw",
    skill: "central-ideas",
    minutes: 5,
    summary:
      "Summarize the passage’s controlling relationship without enlarging or narrowing its claim.",
    objectives: [
      "Distinguish a main claim from a supporting detail",
      "Reject unsupported absolute language",
    ],
    steps: [
      {
        title: "Say what changed or was argued",
        text: "After reading, summarize the passage in one sentence before comparing options. Include a qualification or contrast if it is essential to the writer’s point.",
      },
      {
        title: "Check coverage and strength",
        text: "A true detail may be too narrow to serve as the central idea. A broad claim may sound important while saying more than the text supports. Words such as always and never need textual support.",
      },
    ],
    example: {
      prompt:
        "An original example: A fictional archive digitizes its records to widen access but keeps the originals because annotations and physical features remain useful.",
      reasoning: [
        "Digitization widens access; the originals retain a distinct use.",
        "The controlling idea is complementarity, not replacement.",
        "A summary that says physical records are obsolete contradicts the passage.",
      ],
    },
    takeaways: [
      "A central idea should cover the passage, not just one interesting sentence.",
      "Keep the author’s qualifications intact.",
    ],
    check: {
      prompt:
        "A fictional museum reorganizes objects by theme but preserves dates on labels to retain historical context. Which summary fits best?",
      options: [
        "Chronology is always useless.",
        "A thematic arrangement can coexist with historical context.",
        "Every visitor dislikes chronological displays.",
        "The museum removed all dates.",
      ],
      answer: "A thematic arrangement can coexist with historical context.",
      explanation:
        "This summary captures both the new arrangement and the retained dates without adding a universal claim or contradicting a detail.",
    },
  },
  {
    id: "inference-boundaries",
    version: 1,
    title: "Draw only the inference you can support",
    section: "rw",
    skill: "inferences",
    minutes: 5,
    summary:
      "Separate what the text permits from what merely sounds plausible.",
    objectives: [
      "Connect explicit details carefully",
      "Avoid turning possibilities into certainties",
    ],
    steps: [
      {
        title: "Locate the evidence first",
        text: "Identify the sentences that constrain a conclusion. A supported inference follows from those details without needing a new fact about the world or an unstated motive.",
      },
      {
        title: "Match the strength",
        text: "If several explanations remain possible, an answer that declares one certain is too strong. Watch shifts from may to must and from some cases to every case.",
      },
    ],
    example: {
      prompt:
        "In an original fictional scene, a designer revises the entrance in every model but keeps the building’s dimensions unchanged.",
      reasoning: [
        "The repeated local revisions show attention to the entrance.",
        "They do not establish that every model failed or that the designer disliked the whole building.",
        "A bounded inference concerns the area being reconsidered.",
      ],
    },
    takeaways: [
      "Plausible is not the same as textually supported.",
      "Do not infer a mental state without sufficient evidence.",
    ],
    check: {
      prompt:
        "A writer revises a title repeatedly while leaving the main text unchanged. Which inference is best supported?",
      options: [
        "The writer reconsidered the title.",
        "The writer never intended to share the work.",
        "Every version was a failure.",
        "Several unrelated people wrote the work.",
      ],
      answer: "The writer reconsidered the title.",
      explanation:
        "The revisions directly support attention to the title. The other answers add unsupported intentions, judgments or authorship claims.",
    },
  },
  {
    id: "vocabulary-context",
    version: 1,
    title: "Let the sentence define the word",
    section: "rw",
    skill: "words-context",
    minutes: 5,
    summary:
      "Use contrast, examples, and restatements to find the meaning needed here.",
    objectives: [
      "Use local context clues",
      "Distinguish a word’s possible meanings",
    ],
    steps: [
      {
        title: "Predict before comparing",
        text: "Replace the tested word with a simple phrase that fits the sentence’s logic. Then compare options with that prediction instead of choosing a familiar dictionary definition automatically.",
      },
      {
        title: "Read the relationship",
        text: "A contrast can limit an endorsement, while an example can clarify an abstract term. Check that your chosen meaning preserves the relationship between ideas.",
      },
    ],
    example: {
      prompt:
        "An original example: The reviewer offered qualified praise, admiring the catalog’s detail but noting its incomplete index.",
      reasoning: [
        "The word but introduces a reservation.",
        "Qualified therefore means limited or conditional in this sentence.",
        "It does not refer to professional credentials here.",
      ],
    },
    takeaways: [
      "A valid dictionary meaning can still be wrong in context.",
      "Read beyond the tested word before deciding.",
    ],
    check: {
      prompt:
        "A proposal is described as tentative because the committee expects to revise it after feedback. What does tentative most nearly mean?",
      options: ["final", "secret", "provisional", "unrelated"],
      answer: "provisional",
      explanation:
        "Expected revision makes the proposal provisional, not final. The sentence provides no evidence that it is secret or unrelated.",
    },
  },
  {
    id: "transitions-logic",
    version: 1,
    title: "Name the relationship before the transition",
    section: "rw",
    skill: "transitions",
    minutes: 5,
    summary:
      "Choose a connector for the logic between ideas, not just for a smooth sound.",
    objectives: [
      "Separate contrast, example and consequence",
      "Read both sides of the blank",
    ],
    steps: [
      {
        title: "Classify the connection",
        text: "Ask whether the second idea adds information, contrasts with an expectation, gives an example, or follows as a result. The transition should label that relationship.",
      },
      {
        title: "Test the completed pair",
        text: "Read the two sentences together with your choice. A connector can be grammatically possible but logically wrong.",
      },
    ],
    example: {
      prompt:
        "An original example: The first design required fewer materials. However, the second was easier to repair.",
      reasoning: [
        "Each design has a different advantage.",
        "However signals the contrast between those advantages.",
        "Therefore would incorrectly suggest that ease of repair follows from the first design’s material use.",
      ],
    },
    takeaways: [
      "Grammar alone does not determine the best transition.",
      "Use the meaning of both statements.",
    ],
    check: {
      prompt:
        "The workshop had no seats left. _____ the organizers added another session. Which transition fits?",
      options: [
        "Nevertheless,",
        "Consequently,",
        "Similarly,",
        "For instance,",
      ],
      answer: "Consequently,",
      explanation:
        "The additional session follows as a response to full capacity, so the relationship is consequence.",
    },
  },
  {
    id: "sentence-boundaries",
    version: 1,
    title: "Find the clauses before the punctuation",
    section: "rw",
    skill: "boundaries",
    minutes: 6,
    summary:
      "Use clause structure to avoid comma splices and sentence fragments.",
    objectives: [
      "Identify independent clauses",
      "Distinguish semicolons and colons",
    ],
    steps: [
      {
        title: "Check for a complete thought",
        text: "An independent clause contains a subject and a finite predicate and can function as a sentence. A semicolon can join two closely related independent clauses.",
      },
      {
        title: "Identify what follows",
        text: "A colon follows a complete introducing clause and can introduce a list or explanation. A comma alone does not join two independent clauses without an appropriate conjunction.",
      },
    ],
    example: {
      prompt:
        "An original example: The archive contains fragile papers; visitors must use book supports.",
      reasoning: [
        "The archive contains fragile papers is an independent clause.",
        "Visitors must use book supports is another independent clause.",
        "A semicolon joins them without a comma splice.",
      ],
    },
    takeaways: [
      "Do not punctuate solely by where you would pause.",
      "An introductory phrase is not necessarily an independent clause.",
    ],
    check: {
      prompt:
        "Which punctuation correctly joins these clauses: The hall has limited seating_____ reservations are required.",
      options: [",", ";", "[no punctuation]", ": and"],
      answer: ";",
      explanation:
        "Both parts are independent clauses. The semicolon joins them; a comma alone would create a comma splice.",
    },
  },
  {
    id: "rhetorical-goal",
    version: 1,
    title: "Match the notes to the writer’s goal",
    section: "rw",
    skill: "synthesis",
    minutes: 5,
    summary:
      "An accurate sentence is not enough; it must do the requested rhetorical job.",
    objectives: [
      "Identify the requested comparison or emphasis",
      "Use only the notes needed for that goal",
    ],
    steps: [
      {
        title: "Read the goal before the options",
        text: "The task may request a similarity, difference, introduction, or illustration. Treat this as a selection rule for the notes.",
      },
      {
        title: "Reject true but off-goal details",
        text: "A sentence can accurately repeat a note while failing the task. Choose the relevant relationship, not the largest amount of information.",
      },
    ],
    example: {
      prompt:
        "Original fictional notes: Team A used photographs. Team B examined objects in person. Both used the same checklist. Goal: emphasize a methodological similarity.",
      reasoning: [
        "The shared checklist supplies the requested similarity.",
        "Photographs versus in-person examination is a difference, not the requested relationship.",
        "The goal determines which accurate details are relevant.",
      ],
    },
    takeaways: [
      "State the rhetorical goal in a few words.",
      "Do not invent a comparison not supported by the notes.",
    ],
    check: {
      prompt:
        "Fictional notes say Team A examined 12 objects and Team B examined 20. Which sentence emphasizes a numerical contrast?",
      options: [
        "Both teams examined objects.",
        "Team B examined 20 objects, compared with Team A’s 12.",
        "Team A examined 12 objects.",
        "Team B’s objects were better.",
      ],
      answer: "Team B examined 20 objects, compared with Team A’s 12.",
      explanation:
        "The sentence includes both counts and explicitly compares them. The quality judgment is not supported by the notes.",
    },
  },
];
export function publicLesson(lesson: Lesson): PublicLesson {
  return {
    id: lesson.id,
    version: lesson.version,
    title: lesson.title,
    section: lesson.section,
    skill: lesson.skill,
    minutes: lesson.minutes,
    summary: lesson.summary,
    objectives: lesson.objectives,
    steps: lesson.steps,
    example: lesson.example,
    takeaways: lesson.takeaways,
    check: { prompt: lesson.check.prompt, options: lesson.check.options },
  };
}
export function checkLesson(id: string, answer: string) {
  const lesson = LESSONS.find((l) => l.id === id);
  if (!lesson) return null;
  if (!lesson.check.options.includes(answer))
    throw Error("Choose one of the lesson’s answer options.");
  return {
    correct: answer === lesson.check.answer,
    answer: lesson.check.answer,
    explanation: lesson.check.explanation,
    version: lesson.version,
  };
}
