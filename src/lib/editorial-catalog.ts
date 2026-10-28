import type { Question } from "./types";

export type EditorialFamily = { id: string; skill: string; count: number };
export type EditorialCatalogOptions = {
  skill?: string | null;
  version?: string | null;
  status?: string | null;
  family?: string | null;
  offset?: string | number | null;
};
export type EditorialPagination = {
  offset: number;
  limit: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

// This function is used only after administrator authentication. It never
// changes a candidate or turns an automated check into an editorial decision.
export function editorialCatalog(
  all: readonly Question[],
  options: EditorialCatalogOptions = {},
) {
  const scoped = all.filter(
    (q) =>
      (!options.skill || q.skill === options.skill) &&
      (!options.version || q.generatorVersion === options.version) &&
      (!options.status || q.editorialStatus === options.status),
  );
  const groups = new Map<string, EditorialFamily>();
  for (const q of scoped) {
    const group = groups.get(q.family);
    if (group) group.count++;
    else groups.set(q.family, { id: q.family, skill: q.skill, count: 1 });
  }
  // Facets cover the complete scoped catalog, not just a 50-item page. They
  // deliberately ignore the active family so reviewers can switch families.
  const families = [...groups.values()].sort((a, b) =>
    a.id.localeCompare(b.id, "en"),
  );
  const matched = scoped.filter(
    (q) => !options.family || q.family === options.family,
  );
  const parsed = Number(options.offset);
  const offset = Number.isFinite(parsed)
    ? Math.min(1_000_000, Math.max(0, Math.floor(parsed)))
    : 0;
  const limit = 50;
  return {
    questions: matched.slice(offset, offset + limit),
    families,
    counts: {
      matching: matched.length,
      pending: matched.filter((q) => q.editorialStatus === "pending").length,
      approved: matched.filter((q) => q.editorialStatus === "approved").length,
      published: matched.filter((q) => q.publicationStatus === "published")
        .length,
    },
    pagination: {
      offset,
      limit,
      total: matched.length,
      hasPrevious: offset > 0,
      hasNext: offset + limit < matched.length,
    } satisfies EditorialPagination,
  };
}
