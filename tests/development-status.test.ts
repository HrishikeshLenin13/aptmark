import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  readHistory,
  resolveGitHub,
  resolveProfile,
  developmentReport,
  renderMarkdown,
  validateTarget,
} from "../scripts/development-status.mjs";
const folders: string[] = [];
const config = {
  schemaVersion: 1,
  repository: "fixture/repo",
  authorLogin: "Learner",
  defaultBranch: "main",
  ref: "HEAD",
  targetCommits: 1000,
  unit: "pushed-nonempty-nonmerge-author-associated-commits",
  profileGraphIsSeparate: true,
};
function fixture() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "aptmark-history-test-"));
  folders.push(cwd);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-b", "main");
  git("config", "core.hooksPath", "/dev/null");
  git("config", "commit.gpgsign", "false");
  git("config", "user.name", "Local fixture");
  git("config", "user.email", "fixture@example.invalid");
  fs.writeFileSync(path.join(cwd, "a"), "one");
  git("add", "a");
  git("commit", "-m", "first feature");
  git("commit", "--allow-empty", "-m", "empty fixture");
  git("checkout", "-b", "feature");
  fs.writeFileSync(path.join(cwd, "b"), "two");
  git("add", "b");
  git("commit", "-m", "second feature");
  git("checkout", "main");
  fs.writeFileSync(path.join(cwd, "a"), "three");
  git("commit", "-am", "third feature");
  git("merge", "--no-ff", "feature", "-m", "merge fixture");
  return { cwd, git, history: readHistory({ cwd, ref: "HEAD" }) };
}
afterEach(() => {
  folders
    .splice(0)
    .forEach((p) => fs.rmSync(p, { recursive: true, force: true }));
});
function api(
  history: ReturnType<typeof readHistory>,
  transform = (pages: unknown[][]) => pages,
) {
  return ((_command: string, args: string[]) => {
    const endpoint = args.at(-1)!;
    if (endpoint.endsWith("fixture/repo"))
      return JSON.stringify({ default_branch: "main", fork: false });
    if (endpoint.includes("/git/ref/"))
      return JSON.stringify({ object: { sha: history.sha } });
    const pages = [
      history.nodes
        .slice(0, 2)
        .map((n) => ({ sha: n.sha, author: { login: "Learner" } })),
      history.nodes
        .slice(2)
        .map((n) => ({ sha: n.sha, author: { login: "Learner" } })),
    ];
    return JSON.stringify(transform(pages));
  }) as unknown as typeof execFileSync;
}
describe("real pushed-work progress", () => {
  it("counts full history while excluding empty and merge-only units", () => {
    const { history } = fixture();
    expect(history.totalCommits).toBe(5);
    expect(history.nonEmptyNonMergeCommits).toBe(3);
    expect(history.emptyCommits).toBe(1);
    expect(history.mergeCommits).toBe(1);
  });
  it("leaves author association, target remainder and graph counts unverified in offline mode", () => {
    const { history } = fixture();
    const report = developmentReport(config, history);
    expect(report.target.counted).toBeNull();
    expect(report.target.remaining).toBeNull();
    expect(report.github).toBeNull();
    expect(renderMarkdown(report)).toContain("not queried");
  });
  it("counts all paginated GitHub-associated aliases without relying on local email equality", () => {
    const { history } = fixture();
    const github = resolveGitHub(history, config, { run: api(history) });
    expect(github.authorAssociatedCommits).toBe(5);
    expect(github.targetUnits).toBe(3);
    expect(github.profileGraphContributionCount).toBeNull();
    expect(developmentReport(config, history, github).target.remaining).toBe(
      997,
    );
  });
  it("does not give target credit to an unlinked or differently associated commit", () => {
    const { history } = fixture();
    const excluded = history.units[0].sha;
    const github = resolveGitHub(history, config, {
      run: api(history, (pages) =>
        pages.map((page) =>
          page.map((value) => {
            const v = value as { sha: string };
            return v.sha === excluded ? { ...v, author: null } : v;
          }),
        ),
      ),
    });
    expect(github.targetUnits).toBe(2);
    expect(github.unlinkedCommits).toBe(1);
  });
  it("rejects duplicate or incomplete GitHub coverage", () => {
    const { history } = fixture();
    for (const transform of [
      (pages: unknown[][]) => [pages[0]],
      (pages: unknown[][]) => [...pages, pages[0]],
    ])
      expect(() =>
        resolveGitHub(history, config, { run: api(history, transform) }),
      ).toThrow("coverage");
  });
  it("rejects a different remote head, nondefault branch or fork", () => {
    const { history } = fixture();
    const base = api(history);
    for (const override of [
      { object: { sha: "0".repeat(40) } },
      { default_branch: "other", fork: false },
      { default_branch: "main", fork: true },
    ]) {
      const run = ((command: string, args: string[], opts: unknown) => {
        const endpoint = args.at(-1)!;
        if (
          ("object" in override && endpoint.includes("/git/ref/")) ||
          (!("object" in override) && endpoint.endsWith("fixture/repo"))
        )
          return JSON.stringify(override);
        return base(command, args, opts as never);
      }) as unknown as typeof execFileSync;
      expect(() => resolveGitHub(history, config, { run })).toThrow();
    }
  });
  it("rejects malformed targets and shallow histories", () => {
    expect(() => validateTarget({ ...config, targetCommits: 0 })).toThrow();
    expect(() =>
      validateTarget({ ...config, profileGraphIsSeparate: false }),
    ).toThrow();
    const { history } = fixture();
    const run = ((_command: string, args: string[]) =>
      args.includes("--is-shallow-repository")
        ? "true"
        : history.sha) as unknown as typeof execFileSync;
    expect(() => readHistory({ run })).toThrow("complete Git history");
  });
  it("clamps the remainder at zero when a genuine target has been exceeded", () => {
    const { history } = fixture();
    const github = resolveGitHub(history, config, { run: api(history) });
    expect(
      developmentReport({ ...config, targetCommits: 2 }, history, github)
        .target,
    ).toMatchObject({ remaining: 0, percent: 100 });
  });
});

function profileApi(
  nodes: { commitCount: number; occurredAt: string }[],
  hasNextPage = false,
  listed = true,
) {
  return (() =>
    JSON.stringify({
      data: {
        user: {
          contributionsCollection: {
            startedAt: "2025-10-28T00:00:00Z",
            endedAt: "2026-10-28T00:00:00Z",
            totalCommitContributions: 100,
            commitContributionsByRepository: listed
              ? [
                  {
                    repository: { nameWithOwner: "fixture/repo" },
                    contributions: {
                      totalCount: nodes.reduce(
                        (sum, row) => sum + row.commitCount,
                        0,
                      ),
                      nodes,
                      pageInfo: { hasNextPage },
                    },
                  },
                ]
              : [],
          },
        },
      },
    })) as unknown as typeof execFileSync;
}
it("keeps actual profile-window observations separate from all-time associated work units", () => {
  const { history } = fixture();
  const github = resolveGitHub(history, config, { run: api(history) });
  const profile = resolveProfile(config, {
    run: profileApi([{ commitCount: 7, occurredAt: "2026-10-27T00:00:00Z" }]),
  });
  const report = developmentReport(config, history, github, profile);
  expect(report.target.counted).toBe(3);
  expect(report.profile?.repositoryCommitContributions).toBe(7);
  expect(renderMarkdown(report)).toContain(
    "Profile-window Aptmark commit contributions: 7",
  );
});
it("does not turn an unlisted or truncated profile connection into a zero or a total", () => {
  for (const run of [
    profileApi([], false, false),
    profileApi([{ commitCount: 3, occurredAt: "2026-10-27T00:00:00Z" }], true),
  ])
    expect(
      resolveProfile(config, { run }).repositoryCommitContributions,
    ).toBeNull();
});
it("rejects malformed profile data instead of inventing contribution credit", () => {
  expect(() =>
    resolveProfile(config, {
      run: profileApi([{ commitCount: -1, occurredAt: "invalid" }]),
    }),
  ).toThrow("malformed");
  expect(() =>
    resolveProfile(config, {
      run: (() => "{}") as unknown as typeof execFileSync,
    }),
  ).toThrow("unavailable");
});

it("uses weighted daily commit counts rather than equating connection totals with bucket length", () => {
  const profile = resolveProfile(config, {
    run: profileApi([
      { commitCount: 10, occurredAt: "2026-10-28T07:00:00Z" },
      { commitCount: 30, occurredAt: "2026-10-27T07:00:00Z" },
    ]),
  });
  expect(profile.repositoryCommitContributions).toBe(40);
  expect(profile.reason).toBe("complete-returned-window");
});

it("does not infer zero when a complete-looking connection omits its declared commits", () => {
  const base = profileApi([]);
  const run = ((...args: unknown[]) => {
    const response = JSON.parse(
      (base as (...args: unknown[]) => string)(...args),
    );
    response.data.user.contributionsCollection.commitContributionsByRepository[0].contributions.totalCount = 5;
    return JSON.stringify(response);
  }) as unknown as typeof execFileSync;
  expect(
    resolveProfile(config, { run }).repositoryCommitContributions,
  ).toBeNull();
});
