import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const shaPattern = /^(?:[a-f\d]{40}|[a-f\d]{64})$/;
function execute(run, command, args, cwd, input) {
  return String(
    run(command, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      ...(input !== undefined ? { input } : {}),
    }),
  ).trim();
}
export function readHistory({
  cwd = process.cwd(),
  ref = "origin/main",
  run = execFileSync,
} = {}) {
  const git = (args, input) => execute(run, "git", args, cwd, input);
  const sha = git([
    "rev-parse",
    "--verify",
    "--end-of-options",
    ref + "^{commit}",
  ]);
  if (!shaPattern.test(sha)) throw Error("Git did not return a commit SHA.");
  if (git(["rev-parse", "--is-shallow-repository"]) !== "false")
    throw Error(
      "A complete Git history is required; fetch the full history before counting.",
    );
  const emptyTree = git(["hash-object", "-t", "tree", "--stdin"], "");
  const nodes = git(["log", "--format=%H%x09%P%x09%T", sha])
    .split("\n")
    .map((line) => {
      const [id, parents, tree] = line.split("\t");
      if (!shaPattern.test(id ?? "") || !shaPattern.test(tree ?? ""))
        throw Error("Invalid Git history row.");
      return { sha: id, parents: parents ? parents.split(" ") : [], tree };
    });
  const bySha = new Map(nodes.map((node) => [node.sha, node]));
  const units = nodes.filter((node) => {
    if (node.parents.length > 1) return false;
    const previous = node.parents.length
      ? bySha.get(node.parents[0])?.tree
      : emptyTree;
    if (!previous) throw Error("Incomplete parent history.");
    return node.tree !== previous;
  });
  return {
    ref,
    sha,
    nodes,
    units,
    totalCommits: nodes.length,
    nonEmptyNonMergeCommits: units.length,
    mergeCommits: nodes.filter((n) => n.parents.length > 1).length,
    emptyCommits: nodes.filter(
      (n) =>
        n.parents.length <= 1 &&
        n.tree ===
          (n.parents.length ? bySha.get(n.parents[0])?.tree : emptyTree),
    ).length,
  };
}
export function validateTarget(config) {
  if (
    !config ||
    config.schemaVersion !== 1 ||
    !/^[\w.-]+\/[\w.-]+$/.test(config.repository ?? "") ||
    !/^[\w-]+$/.test(config.authorLogin ?? "") ||
    typeof config.defaultBranch !== "string" ||
    !config.defaultBranch ||
    typeof config.ref !== "string" ||
    !config.ref ||
    !Number.isInteger(config.targetCommits) ||
    config.targetCommits < 1 ||
    config.unit !== "pushed-nonempty-nonmerge-author-associated-commits" ||
    config.profileGraphIsSeparate !== true
  )
    throw Error("Invalid explicit development target.");
  return config;
}
export function resolveGitHub(
  history,
  config,
  { cwd = process.cwd(), run = execFileSync } = {},
) {
  validateTarget(config);
  const gh = (args) => JSON.parse(execute(run, "gh", args, cwd));
  const repository = gh(["api", `repos/${config.repository}`]);
  if (
    repository.default_branch !== config.defaultBranch ||
    repository.fork !== false
  )
    throw Error(
      "Verify the standalone repository and default branch before associating target progress.",
    );
  const remote = gh([
    "api",
    `repos/${config.repository}/git/ref/heads/${encodeURIComponent(config.defaultBranch)}`,
  ]);
  if (remote.object?.sha !== history.sha)
    throw Error(
      "The selected ref is not current remote default-branch HEAD; fetch origin before counting pushed work.",
    );
  const pages = gh([
    "api",
    "--paginate",
    "--slurp",
    `repos/${config.repository}/commits?sha=${history.sha}&per_page=100`,
  ]);
  if (!Array.isArray(pages) || !pages.every(Array.isArray))
    throw Error("Invalid paginated commit response.");
  const commits = pages.flat();
  const bySha = new Map(commits.map((commit) => [commit.sha, commit]));
  if (
    commits.length !== bySha.size ||
    bySha.size !== history.nodes.length ||
    history.nodes.some((node) => !bySha.has(node.sha))
  )
    throw Error("GitHub commit coverage is incomplete or duplicated.");
  const associated = (node) =>
    bySha.get(node.sha)?.author?.login?.toLowerCase() ===
    config.authorLogin.toLowerCase();
  return {
    authorLogin: config.authorLogin,
    verifiedAt: new Date().toISOString(),
    sha: history.sha,
    authorAssociatedCommits: history.nodes.filter(associated).length,
    targetUnits: history.units.filter(associated).length,
    unlinkedCommits: commits.filter((commit) => !commit.author?.login).length,
    otherAccountCommits: commits.filter(
      (commit) =>
        commit.author?.login &&
        commit.author.login.toLowerCase() !== config.authorLogin.toLowerCase(),
    ).length,
    profileGraphContributionCount: null,
    graphNote:
      "Author association and default-branch history are verified; profile-window observations are handled separately.",
  };
}
/** Read the separate profile-window observation; missing/truncated data stays unknown. */
export function resolveProfile(
  config,
  { cwd = process.cwd(), run = execFileSync } = {},
) {
  validateTarget(config);
  const query = `query { user(login:"${config.authorLogin}") { contributionsCollection { startedAt endedAt totalCommitContributions commitContributionsByRepository(maxRepositories:100) { repository { nameWithOwner } contributions(first:100) { totalCount nodes { commitCount occurredAt } pageInfo { hasNextPage } } } } } }`;
  const response = JSON.parse(
    execute(run, "gh", ["api", "graphql", "-f", `query=${query}`], cwd),
  );
  const collection = response.data?.user?.contributionsCollection;
  if (
    !collection ||
    !Number.isInteger(collection.totalCommitContributions) ||
    collection.totalCommitContributions < 0 ||
    !Number.isFinite(Date.parse(collection.startedAt)) ||
    !Number.isFinite(Date.parse(collection.endedAt)) ||
    !Array.isArray(collection.commitContributionsByRepository)
  )
    throw Error("Profile contribution data is unavailable or malformed.");
  const repository = collection.commitContributionsByRepository.find(
    (row) =>
      row.repository?.nameWithOwner?.toLowerCase() ===
      config.repository.toLowerCase(),
  );
  const connection = repository?.contributions;
  let count = null,
    reason = "repository-not-listed";
  if (connection) {
    if (
      !Array.isArray(connection.nodes) ||
      !Number.isInteger(connection.totalCount) ||
      typeof connection.pageInfo?.hasNextPage !== "boolean" ||
      connection.nodes.some(
        (row) =>
          !Number.isInteger(row.commitCount) ||
          row.commitCount < 0 ||
          !Number.isFinite(Date.parse(row.occurredAt)),
      )
    )
      throw Error("Profile repository contribution data is malformed.");
    const total = connection.nodes.reduce(
      (sum, row) => sum + row.commitCount,
      0,
    );
    if (!connection.pageInfo.hasNextPage && total === connection.totalCount) {
      count = total;
      reason = "complete-returned-window";
    } else reason = "incomplete-connection";
  }
  return {
    observedAt: new Date().toISOString(),
    windowStart: collection.startedAt,
    windowEnd: collection.endedAt,
    repository: config.repository,
    repositoryCommitContributions: count,
    reason,
    accountCommitContributions: collection.totalCommitContributions,
    note: "GitHub profile-window commit contributions; not all-time repository history, issue/PR activity, or a learning-outcome measure.",
  };
}
/**
 * @param {ReturnType<typeof resolveGitHub> | null} github
 * @param {ReturnType<typeof resolveProfile> | null} profile
 */
export function developmentReport(
  config,
  history,
  github = null,
  profile = null,
) {
  validateTarget(config);
  const count = github?.targetUnits ?? null;
  return {
    repository: config.repository,
    ref: history.ref,
    sha: history.sha,
    git: {
      totalCommits: history.totalCommits,
      nonEmptyNonMergeCommits: history.nonEmptyNonMergeCommits,
      emptyCommits: history.emptyCommits,
      mergeCommits: history.mergeCommits,
    },
    github,
    profile,
    target: {
      requested: config.targetCommits,
      unit: config.unit,
      counted: count,
      remaining:
        count === null ? null : Math.max(0, config.targetCommits - count),
      percent:
        count === null
          ? null
          : Math.min(
              100,
              Math.round((count / config.targetCommits) * 10000) / 100,
            ),
    },
    note:
      count === null
        ? "Git history is counted; run with --github to verify author association and current remote default-branch membership."
        : "Counts describe real nonempty, nonmerge commits, not learning outcomes or a certified profile-graph total.",
  };
}
export function renderMarkdown(report) {
  return `## Aptmark development progress\n\nRepository: ${report.repository}\n\nRef: ${report.ref} at ${report.sha}\n\n- Repository commits: ${report.git.totalCommits}\n- Nonempty, nonmerge history units: ${report.git.nonEmptyNonMergeCommits}\n- Requested target: ${report.target.requested}\n- Author-associated target units: ${report.target.counted ?? "not queried"}\n- Remaining: ${report.target.remaining ?? "not inferred"}\n\n${report.note}\n\n${report.profile ? `Profile-window Aptmark commit contributions: ${report.profile.repositoryCommitContributions ?? "unknown"} (${report.profile.windowStart} to ${report.profile.windowEnd}).` : "GitHub profile contribution count: not queried."}\n`;
}
export function main(args = process.argv.slice(2)) {
  const allowed = new Set(["--github", "--markdown", "--profile"]);
  if (args.some((arg) => !allowed.has(arg)))
    throw Error(
      "Usage: development-status.mjs [--github] [--profile] [--markdown]",
    );
  const config = validateTarget(
    JSON.parse(fs.readFileSync("docs/development-target.json", "utf8")),
  );
  const history = readHistory({ ref: config.ref });
  const github =
    args.includes("--github") || args.includes("--profile")
      ? resolveGitHub(history, config)
      : null;
  const profile = args.includes("--profile") ? resolveProfile(config) : null;
  const report = developmentReport(config, history, github, profile);
  console.log(
    args.includes("--markdown")
      ? renderMarkdown(report)
      : JSON.stringify(report, null, 2),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
