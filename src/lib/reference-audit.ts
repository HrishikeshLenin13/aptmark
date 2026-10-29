export type AuditSource = {
  id: string;
  provider: "college-board" | "oneprep";
  url: string;
  checkedAt: string;
  verification: "public-description";
  observation: string;
};
export type AuditCapability = {
  id: string;
  title: string;
  references: Record<
    "college-board" | "oneprep",
    { source: string; observation: string }
  >;
  aptmark: {
    status: "local-preview" | "partial" | "gated" | "planned";
    observation: string;
    evidence: string[];
  };
  nextAcceptance: string;
};
export type ReferenceAudit = {
  schemaVersion: 1;
  checkedAt: string;
  maxAgeDays: number;
  reviewCadence: "every-feature-milestone";
  scope: "public-primary-descriptions-vs-tested-local-preview";
  superiorityClaim: false;
  providers: ["college-board", "oneprep"];
  sources: AuditSource[];
  capabilities: AuditCapability[];
  countCaveat: string;
};
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const day = (value: unknown) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;

/** Validates freshness, traceability and claim boundaries, not educational superiority. */
export function validateReferenceAudit(
  input: unknown,
  {
    today = new Date(),
    fileExists = () => true,
  }: { today?: Date; fileExists?: (path: string) => boolean } = {},
): string[] {
  const errors: string[] = [];
  if (!record(input)) return ["Audit must be an object."];
  if (
    input.schemaVersion !== 1 ||
    input.reviewCadence !== "every-feature-milestone" ||
    input.scope !== "public-primary-descriptions-vs-tested-local-preview" ||
    input.superiorityClaim !== false
  )
    errors.push(
      "Audit requires the versioned milestone/public-description/no-superiority policy.",
    );
  if (
    JSON.stringify(input.providers) !==
    JSON.stringify(["college-board", "oneprep"])
  )
    errors.push("Both reference providers are required.");
  const maxAge = input.maxAgeDays;
  if (
    typeof maxAge !== "number" ||
    !Number.isInteger(maxAge) ||
    maxAge < 1 ||
    maxAge > 30
  )
    errors.push("Review age must be an integer from 1 to 30 days.");
  const now = Date.parse(today.toISOString().slice(0, 10));
  function checkDate(value: unknown, label: string) {
    let valid = false;
    try {
      valid = !!day(value);
    } catch {
      /* Invalid calendar dates remain invalid. */
    }
    if (!valid) {
      errors.push(`${label}: invalid review date.`);
      return;
    }
    const age = (now - Date.parse(value as string)) / 86400000;
    if (age < 0 || (typeof maxAge === "number" && age > maxAge))
      errors.push(`${label}: review is future-dated or stale.`);
  }
  checkDate(input.checkedAt, "Audit");
  if (!text(input.countCaveat))
    errors.push("Reported inventory needs a count/quality caveat.");
  const sources = new Map<string, string>();
  if (!Array.isArray(input.sources) || !input.sources.length)
    errors.push("Primary sources are required.");
  else
    for (const source of input.sources) {
      if (
        !record(source) ||
        !text(source.id) ||
        !["college-board", "oneprep"].includes(String(source.provider)) ||
        !text(source.observation) ||
        source.verification !== "public-description"
      ) {
        errors.push("Invalid or overclaimed public source.");
        continue;
      }
      if (sources.has(source.id)) errors.push(`Duplicate source: ${source.id}`);
      sources.set(source.id, String(source.provider));
      checkDate(source.checkedAt, source.id);
      try {
        const url = new URL(String(source.url));
        const host = url.hostname;
        const primary =
          source.provider === "college-board"
            ? host === "collegeboard.org" || host.endsWith(".collegeboard.org")
            : host === "oneprep.com" || host === "www.oneprep.com";
        if (
          url.protocol !== "https:" ||
          url.username ||
          url.password ||
          !primary
        )
          throw Error();
      } catch {
        errors.push(`${source.id}: use the provider's HTTPS primary source.`);
      }
    }
  const ids = new Set<string>();
  if (!Array.isArray(input.capabilities) || !input.capabilities.length)
    errors.push("Capabilities are required.");
  else
    for (const row of input.capabilities) {
      if (!record(row) || !text(row.id) || !text(row.title)) {
        errors.push("Invalid capability.");
        continue;
      }
      if (ids.has(row.id)) errors.push(`Duplicate capability: ${row.id}`);
      ids.add(row.id);
      for (const provider of ["college-board", "oneprep"]) {
        const reference = record(row.references)
          ? row.references[provider]
          : null;
        if (
          !record(reference) ||
          !text(reference.source) ||
          sources.get(reference.source) !== provider ||
          !text(reference.observation)
        )
          errors.push(`${row.id}: missing/mismatched ${provider} evidence.`);
      }
      if (
        !record(row.aptmark) ||
        !["local-preview", "partial", "gated", "planned"].includes(
          String(row.aptmark.status),
        ) ||
        !text(row.aptmark.observation)
      ) {
        errors.push(
          `${row.id}: Aptmark status must distinguish previews, gaps and release gates.`,
        );
        continue;
      }
      if (!Array.isArray(row.aptmark.evidence) || !row.aptmark.evidence.length)
        errors.push(`${row.id}: local evidence is required.`);
      else
        for (const path of row.aptmark.evidence) {
          if (
            !text(path) ||
            path.startsWith("/") ||
            path.includes("\\") ||
            path.split("/").includes("..") ||
            !fileExists(path)
          )
            errors.push(`${row.id}: evidence path is invalid or missing.`);
        }
      if (!text(row.nextAcceptance) || row.nextAcceptance.length < 30)
        errors.push(
          `${row.id}: a concrete next acceptance condition is required.`,
        );
    }
  return errors;
}
