"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as NavigationDialog from "@radix-ui/react-dialog";
import { WorkspaceSearch } from "./workspace-search";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  RotateCcw,
  ClipboardList,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Check,
  Clock3,
  Target,
  Bookmark,
  Flag,
  Lightbulb,
  PanelLeftClose,
  Menu,
  X,
  Search,
  LogOut,
  SlidersHorizontal,
  CheckCircle2,
  TriangleAlert,
  Minus,
  MessageCircle,
  FileText,
  Play,
  Grid2X2,
  Eye,
  EyeOff,
  Calculator,
  ZoomIn,
  Highlighter,
  PenLine,
  ExternalLink,
  Layers3,
  GraduationCap,
} from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";
import { MathText } from "./math-text";
import { Figure } from "./figure";
import { calculate } from "@/lib/calculator";
import { calendarDate, WORKSPACE_TIMEZONE } from "@/lib/time";
import type {
  Attempt,
  Exam,
  Grade,
  Mastery,
  Preferences,
  PublicQuestion,
  Question,
  Skill,
} from "@/lib/types";

type Recommendation = {
  skill: Skill;
  reason: string;
  n: number;
  mean: number;
  due: boolean;
};
type Plan = {
  date: string;
  skill: Skill;
  minutes: number;
  count: number;
  reason: string;
};
type AppState = {
  user: { id: string; email: string | null; guest: number };
  preview: boolean;
  inventory: {
    generated: number;
    validated: number;
    approved: number;
    published: number;
    rejected: number;
    families: number;
    math: number;
    rw: number;
    target: number;
  };
  skills: Skill[];
  attempts: Attempt[];
  bookmarks: string[];
  preferences: Preferences;
  recommendations: Recommendation[];
  mastery: Mastery[];
  plan: Plan[];
  exams: {
    id: string;
    mode: string;
    status: string;
    createdAt: string;
    correct: number;
    total: number;
  }[];
  readiness: { rw: number; math: number; ready: boolean; reason: string };
  serverTime: string;
};
const nav = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/practice", label: "Question bank", icon: BookOpen },
  { path: "/planner", label: "Study plan", icon: CalendarDays },
  { path: "/analytics", label: "Your progress", icon: ChartNoAxesCombined },
  { path: "/mistakes", label: "Mistake studio", icon: RotateCcw },
  { path: "/tests", label: "Practice tests", icon: ClipboardList },
];
async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? "Request failed.");
  return result;
}
const date = (s: string) =>
  new Date(s.length === 10 ? s + "T12:00:00Z" : s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: WORKSPACE_TIMEZONE,
  });
const pct = (v: number) => Math.round(v * 100) + "%";
function Logo() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M21 14.3c0-3-2-4.8-5.5-4.8-2.1 0-4 .6-5.6 1.8l1.5 2c1.1-.8 2.4-1.2 3.8-1.2 2 0 3.2.9 3.2 2.7v.5h-3c-3.8 0-5.8 1.4-5.8 4.1 0 2.4 1.8 3.8 4.8 3.8 1.8 0 3.2-.6 4.2-1.8l.2 1.5h2.2v-8.6zm-5.3 6.9c-1.9 0-2.9-.7-2.9-1.9 0-1.1 1-1.8 3.1-1.8h2.5v1c0 1.7-1 2.7-2.7 2.7z"
            fill="currentColor"
          />
        </svg>
      </span>
      aptmark
    </span>
  );
}
function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"tag tag-" + tone}>{children}</span>;
}
function Empty({
  icon: Icon = BookOpen,
  title,
  description,
  action,
}: {
  icon?: typeof BookOpen;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={23} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export default function AptmarkApp() {
  const [state, setState] = useState<AppState | null>(null),
    [error, setError] = useState(""),
    [mobile, setMobile] = useState(false),
    [modal, setModal] = useState(""),
    [notice, setNotice] = useState("");
  const pathname = usePathname(),
    router = useRouter();
  const active = nav.find((n) => n.path === pathname);
  const firstLoad = useRef(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const modalOpener = useRef<HTMLElement | null>(null);
  const openUtility = (name: string) => {
    modalOpener.current = mobile
      ? navigationTrigger.current
      : (document.activeElement as HTMLElement);
    setMobile(false);
    setModal(name);
  };
  const refresh = useCallback(async () => {
    const s = await api<AppState>("state");
    setState(s);
  }, []);
  useEffect(() => {
    if (firstLoad.current) return;
    firstLoad.current = true;
    (async () => {
      try {
        await api("session", {});
        await refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [refresh]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobile(false);
        setModal((current) => (current === "search" ? "" : "search"));
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const notify = (s: string) => setNotice(s);
  const goPractice = (opts: Record<string, string> = {}) =>
    router.push("/practice?" + new URLSearchParams(opts).toString());
  if (error && !state)
    return (
      <div className="startup">
        <Logo />
        <h1>Let’s reconnect your workspace.</h1>
        <p>{error}</p>
        <Button onClick={() => location.reload()}>Try again</Button>
      </div>
    );
  if (!state)
    return (
      <div className="startup">
        <Logo />
        <p>Opening your workspace…</p>
        <div className="loading-line" />
      </div>
    );
  if (pathname === "/welcome")
    return (
      <Welcome
        onStart={() => router.push("/")}
        onPractice={() => goPractice()}
      />
    );
  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <Link href="/" aria-label="Aptmark overview">
          <Logo />
        </Link>
        <button
          className="icon-button mobile-only"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X size={18} />
        </button>
      </div>
      <div className="workspace-label">
        <span className="workspace-square">
          <GraduationCap size={17} />
        </span>
        <div>
          Your workspace<small>Digital SAT preparation</small>
        </div>
        <ChevronRight size={14} />
      </div>
      <nav aria-label="Main navigation">
        {nav.map((n) => (
          <Link
            key={n.path}
            href={n.path}
            className={"nav-item " + (pathname === n.path ? "active" : "")}
            onClick={() => setMobile(false)}
            aria-current={pathname === n.path ? "page" : undefined}
          >
            <n.icon size={18} />
            <span>{n.label}</span>
            {n.path === "/mistakes" &&
              state.attempts.some((a) => !a.correct) && (
                <span className="nav-count">
                  {
                    new Set(
                      state.attempts
                        .filter((a) => !a.correct)
                        .map((a) => a.questionId),
                    ).size
                  }
                </span>
              )}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="free-note">
          <span className="free-symbol">
            <BookOpen size={19} />
          </span>
          <strong>
            Good preparation.
            <br />
            Open to everyone.
          </strong>
          <p>Core learning stays free.</p>
          <Link href="/welcome" onClick={() => setMobile(false)}>
            Our approach <ArrowUpRight size={13} />
          </Link>
        </div>
        <Link
          href="/content"
          onClick={() => setMobile(false)}
          className={"nav-item " + (pathname === "/content" ? "active" : "")}
        >
          <Layers3 size={17} />
          Content studio
        </Link>
        <button className="nav-item" onClick={() => openUtility("settings")}>
          <Settings2 size={17} />
          Settings
        </button>
        <button className="profile" onClick={() => openUtility("account")}>
          <span className="avatar">
            {state.user.email?.[0].toUpperCase() ?? "G"}
          </span>
          <span>
            {state.user.guest ? "Guest workspace" : state.user.email}
            <small>
              {state.user.guest ? "Saved on this server" : "Local account"}
            </small>
          </span>
          <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
  return (
    <NavigationDialog.Root open={mobile} onOpenChange={setMobile}>
      <div className="app-shell studio-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <aside className="sidebar desktop-sidebar">{sidebarContent}</aside>

        <div className="app-body" inert={mobile}>
          <header className="topbar">
            <div className="breadcrumb">
              <NavigationDialog.Trigger asChild>
                <button
                  className="icon-button mobile-only"
                  ref={navigationTrigger}
                  aria-label="Open navigation"
                >
                  <Menu size={20} />
                </button>
              </NavigationDialog.Trigger>
              <span>Workspace</span>
              <ChevronRight size={12} />
              <strong>
                {active?.label ??
                  (pathname === "/exam" ? "Assessment" : "Content studio")}
              </strong>
            </div>
            <div className="topbar-actions">
              <button
                ref={searchTrigger}
                className="workspace-search-trigger"
                onClick={() => setModal("search")}
                aria-label="Search workspace"
              >
                <Search size={16} />
                <span>Search your workspace</span>
                <kbd>⌘ K</kbd>
              </button>
              {state.preview && (
                <Tag tone="preview">
                  <span className="status-dot" />
                  Local content preview
                </Tag>
              )}
              <button
                className="date-button"
                onClick={() => openUtility("settings")}
              >
                <CalendarDays size={15} />
                {state.preferences.testDate
                  ? date(state.preferences.testDate)
                  : "Set your test date"}
              </button>
            </div>
          </header>
          <main
            id="main-content"
            className={
              pathname === "/exam" ? "main-content exam-main" : "main-content"
            }
          >
            {pathname === "/" && (
              <Dashboard
                state={state}
                onPractice={goPractice}
                onSettings={() => openUtility("settings")}
                onDiagnostic={() => router.push("/tests")}
              />
            )}
            {pathname === "/practice" && (
              <Practice state={state} refresh={refresh} notify={notify} />
            )}
            {pathname === "/planner" && (
              <Planner
                state={state}
                onPractice={goPractice}
                onSettings={() => openUtility("settings")}
              />
            )}
            {pathname === "/analytics" && (
              <Analytics state={state} onPractice={goPractice} />
            )}
            {pathname === "/mistakes" && (
              <Mistakes
                state={state}
                onPractice={goPractice}
                refresh={refresh}
                notify={notify}
              />
            )}
            {pathname === "/tests" && <Tests state={state} notify={notify} />}
            {pathname === "/exam" && (
              <ExamWorkspace state={state} refresh={refresh} notify={notify} />
            )}
            {pathname === "/content" && (
              <ContentStudio state={state} refresh={refresh} notify={notify} />
            )}
            {![
              "/",
              "/practice",
              "/planner",
              "/analytics",
              "/mistakes",
              "/tests",
              "/exam",
              "/content",
            ].includes(pathname) && (
              <Empty
                title="Find your next step"
                description="This page is not part of your workspace."
                action={
                  <Button asChild>
                    <Link href="/">Back to overview</Link>
                  </Button>
                }
              />
            )}
          </main>
          <footer className="app-footer">
            <span>Made for the work that matters.</span>
            <span>
              Independent SAT-style preparation. Not affiliated with College
              Board.
            </span>
          </footer>
        </div>
        <WorkspaceSearch
          open={modal === "search"}
          close={() => setModal("")}
          skills={state.skills}
          restoreFocus={() => searchTrigger.current?.focus()}
        />
        <SettingsModal
          restoreFocus={() => modalOpener.current?.focus()}
          open={modal === "settings"}
          close={() => setModal("")}
          state={state}
          refresh={refresh}
          notify={notify}
        />
        <AccountModal
          restoreFocus={() => modalOpener.current?.focus()}
          open={modal === "account"}
          close={() => setModal("")}
          state={state}
          refresh={refresh}
          notify={notify}
        />
        {notice && (
          <div className="toast" role="status">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}
      </div>
      <NavigationDialog.Portal>
        <NavigationDialog.Overlay className="navigation-overlay" />
        <NavigationDialog.Content
          className="sidebar mobile-sidebar"
          onCloseAutoFocus={(event) => {
            if (modal) event.preventDefault();
          }}
        >
          <NavigationDialog.Title className="sr-only">
            Workspace navigation
          </NavigationDialog.Title>
          <NavigationDialog.Description className="sr-only">
            Choose a study page or manage your workspace.
          </NavigationDialog.Description>
          {sidebarContent}
        </NavigationDialog.Content>
      </NavigationDialog.Portal>
    </NavigationDialog.Root>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="heading-date">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Dashboard({
  state: s,
  onPractice,
  onSettings,
  onDiagnostic,
}: {
  state: AppState;
  onPractice: (o?: Record<string, string>) => void;
  onSettings: () => void;
  onDiagnostic: () => void;
}) {
  const first = s.attempts.filter((a) => a.first && !a.assisted),
    accuracy = first.length
      ? first.filter((a) => a.correct).length / first.length
      : null;
  const rec = s.recommendations[0];
  const studied = new Set(s.attempts.map((a) => a.skill)).size;
  const totalMinutes = Math.round(
    s.attempts.reduce((n, a) => n + a.seconds, 0) / 60,
  );
  const activity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const day = calendarDate(d);
    return {
      day,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: s.attempts.filter(
        (a) => calendarDate(new Date(a.createdAt)) === day,
      ).length,
    };
  });
  return (
    <>
      <PageHeading
        eyebrow={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={
          s.attempts.length
            ? "Welcome back to your practice."
            : "A fresh page. A stronger start."
        }
        description="A little focus today goes a long way. Let’s make it count."
        action={
          <Button variant="secondary" size="small" onClick={onSettings}>
            <SlidersHorizontal size={14} />
            Personalize your plan
          </Button>
        }
      />
      <div className="dashboard-grid">
        <div className="dashboard-primary">
          <section className="focus-panel">
            <div className="focus-copy">
              <span className="focus-label">
                <span className="status-dot" />
                Your next step
              </span>
              <h2>
                {first.length
                  ? "Turn a little practice into lasting progress."
                  : "Start where you are.\nBuild from there."}
              </h2>
              <p>
                {first.length
                  ? rec.reason
                  : "Discover what feels familiar and what needs a little more attention. Your first answers will help shape the path ahead."}
              </p>
              <div className="focus-buttons">
                <Button onClick={() => onPractice({ count: "8" })}>
                  {first.length
                    ? "Continue adaptive practice"
                    : "Start a focused session"}
                  <ArrowRight size={16} />
                </Button>
                <span>
                  <Clock3 size={14} />
                  About 10 minutes
                </span>
              </div>
            </div>
            <div className="focus-art" aria-hidden="true">
              <svg viewBox="0 0 260 245">
                <g transform="rotate(7 130 120)">
                  <rect
                    x="40"
                    y="20"
                    width="175"
                    height="210"
                    rx="9"
                    fill="#e0e9e1"
                  />
                  <rect
                    x="30"
                    y="10"
                    width="175"
                    height="210"
                    rx="9"
                    fill="#fff"
                    stroke="#d3ded5"
                  />
                  <path
                    d="M55 47h54M55 59h85"
                    stroke="#b7cbbd"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {[70, 95, 120, 145, 170].map((x) => (
                    <line
                      key={x}
                      x1={x}
                      y1="80"
                      x2={x}
                      y2="185"
                      stroke="#edf1ed"
                    />
                  ))}
                  {[90, 115, 140, 165].map((y) => (
                    <line
                      key={y}
                      x1="55"
                      y1={y}
                      x2="180"
                      y2={y}
                      stroke="#edf1ed"
                    />
                  ))}
                  <path
                    d="M58 180H185M65 188V78"
                    stroke="#97b4a1"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M70 100 Q125 220 180 100"
                    stroke="#245c45"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle cx="125" cy="160" r="4" fill="#245c45" />
                  <text
                    x="145"
                    y="87"
                    fill="#698171"
                    fontSize="12"
                    fontFamily="Georgia"
                  >
                    f(x)
                  </text>
                </g>
                <circle
                  cx="214"
                  cy="192"
                  r="24"
                  fill="#d6e5d5"
                  stroke="#f1f6ee"
                  strokeWidth="5"
                />
                <path
                  d="m204 192 7 7 13-15"
                  stroke="#245c45"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          </section>
          <div className="metric-row">
            <div>
              <span>Questions practiced</span>
              <strong>
                {s.attempts.length}
                <small>across {studied} skills</small>
              </strong>
            </div>
            <div>
              <span>Independent accuracy</span>
              <strong>
                {accuracy === null ? "—" : pct(accuracy)}
                <small>
                  {first.length
                    ? `${first.length} first, unassisted answers`
                    : "Your first session starts this"}
                </small>
              </strong>
            </div>
            <div>
              <span>Time invested</span>
              <strong>
                {totalMinutes}
                <em> min</em>
                <small>Every focused minute counts</small>
              </strong>
            </div>
          </div>
          <section className="section">
            <div className="section-header">
              <h2>Make room for practice</h2>
              <Link href="/practice">
                Explore question bank
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="subject-list">
              {[
                {
                  section: "math",
                  title: "Math",
                  desc: "Find the logic. Build your confidence.",
                  symbol: "ƒ",
                  count: s.inventory.math,
                },
                {
                  section: "rw",
                  title: "Reading & Writing",
                  desc: "Read closely. Think clearly. Make your case.",
                  symbol: "Aa",
                  count: s.inventory.rw,
                },
              ].map((x) => (
                <button
                  className="subject-row"
                  key={x.section}
                  onClick={() => onPractice({ section: x.section })}
                >
                  <span className={"subject-symbol " + x.section}>
                    {x.symbol}
                  </span>
                  <div>
                    <h3>{x.title}</h3>
                    <p>{x.desc}</p>
                    <span>
                      4 domains <span className="tiny-dot" />
                      {x.count.toLocaleString()} candidate questions
                    </span>
                  </div>
                  <ArrowUpRight size={20} />
                </button>
              ))}
            </div>
          </section>
          <section className="section">
            <div className="section-header">
              <h2>Your learning, in focus</h2>
              <Link href="/analytics">
                View progress
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="learning-panel">
              <div>
                <span className="round-icon">
                  <ChartNoAxesCombined size={20} />
                </span>
                <h3>
                  {first.length
                    ? "Evidence, not guesswork."
                    : "Your progress starts with a question."}
                </h3>
                <p>
                  {first.length
                    ? `${first.length} independent observations across ${studied} skills. Estimates will get more useful as you answer unfamiliar questions.`
                    : "After a few sessions, you’ll see your strengths, areas to revisit, and how your understanding changes."}
                </p>
                <button className="text-button" onClick={() => onPractice()}>
                  Build your baseline <ArrowRight size={14} />
                </button>
              </div>
              <div className="skill-lines">
                {["Algebra", "Craft and Structure", "Advanced Math"].map(
                  (d) => {
                    const ids = s.skills
                      .filter((x) => x.domain === d)
                      .map((x) => x.id);
                    const a = first.filter((x) => ids.includes(x.skill));
                    return (
                      <div key={d}>
                        <span>
                          {d}
                          <small>
                            {a.length
                              ? pct(
                                  a.filter((x) => x.correct).length / a.length,
                                )
                              : "Not measured"}
                          </small>
                        </span>
                        <div className="progress-track">
                          <div
                            style={{
                              width: a.length
                                ? pct(
                                    a.filter((x) => x.correct).length /
                                      a.length,
                                  )
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </section>
          <section className="section">
            <div className="section-header">
              <h2>Recent activity</h2>
              <Link href="/analytics">
                All activity
                <ArrowUpRight size={14} />
              </Link>
            </div>
            {s.attempts.length ? (
              <div className="activity-list">
                {s.attempts
                  .slice(-3)
                  .reverse()
                  .map((a) => (
                    <div key={a.id}>
                      <span
                        className={
                          "attempt-icon " +
                          (a.correct ? "correct" : "incorrect")
                        }
                      >
                        {a.correct ? <Check size={15} /> : <Minus size={15} />}
                      </span>
                      <div>
                        <strong>
                          {s.skills.find((x) => x.id === a.skill)?.name}
                        </strong>
                        <small>
                          {a.section === "math" ? "Math" : "Reading & Writing"}{" "}
                          · {a.first ? "First attempt" : "Retry"}
                        </small>
                      </div>
                      <span>{date(a.createdAt)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="activity-empty">
                <BookOpen size={19} />
                <span>
                  No sessions yet. Your first one is a good place to start.
                </span>
                <button onClick={() => onPractice()} className="text-button">
                  Let’s begin
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="today-panel">
            <div className="section-header">
              <h2>Your study rhythm</h2>
              <CalendarDays size={17} />
            </div>
            <p className="muted">A plan that leaves room for life.</p>
            <div
              className="week-chart"
              aria-label="Questions answered in the last seven days"
            >
              {activity.map((x) => (
                <div key={x.day}>
                  <div className="week-bar" title={`${x.count} questions`}>
                    <span
                      style={{
                        height: x.count
                          ? Math.min(100, Math.max(8, x.count * 8)) + "%"
                          : "0%",
                      }}
                    />
                  </div>
                  <small>{x.label.slice(0, 1)}</small>
                </div>
              ))}
            </div>
            <div className="rhythm-summary">
              <strong>
                {s.preferences.weeklyMinutes} <span>min / week</span>
              </strong>
              <button className="text-button" onClick={onSettings}>
                Adjust
              </button>
            </div>
            <div className="agenda-list">
              {s.plan.slice(0, 2).map((p, i) => (
                <button
                  key={p.date}
                  onClick={() =>
                    onPractice({
                      skill: p.skill.id,
                      count: String(Math.min(20, p.count)),
                    })
                  }
                >
                  <span className="agenda-number">{i + 1}</span>
                  <div>
                    <small>
                      {date(p.date)} · {p.minutes} min
                    </small>
                    <strong>{p.skill.name}</strong>
                  </div>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
            <Link href="/planner" className="panel-link">
              See your study plan
              <ArrowRight size={15} />
            </Link>
          </section>
          <section className="diagnostic-note">
            <span className="round-icon">
              <Target size={20} />
            </span>
            <h3>
              A starting point, <br />
              not a judgment.
            </h3>
            <p>
              A short diagnostic helps you find a direction. No predicted score.
              No pressure.
            </p>
            <button className="text-button" onClick={onDiagnostic}>
              Explore the diagnostic
              <ArrowUpRight size={14} />
            </button>
          </section>
          <div className="editorial-note">
            <div>
              <FileText size={16} />
              <strong>Built on honest evidence</strong>
            </div>
            <p>
              {s.inventory.generated.toLocaleString()} candidates.{" "}
              {s.inventory.published} published. Every question needs human
              editorial review before public release.
            </p>
            <Link href="/content">
              View content readiness
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
function PreviewNotice() {
  return (
    <div className="preview-notice">
      <FileText size={15} />
      <span>
        <strong>Editorial preview.</strong> These original candidates have
        automated checks, but are not human-approved or calibrated.
      </span>
    </div>
  );
}
function Practice({
  state: s,
  refresh,
  notify,
}: {
  state: AppState;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const params = useSearchParams();
  const [section, setSection] = useState(params.get("section") ?? "all"),
    [skill, setSkill] = useState(params.get("skill") ?? ""),
    [difficulty, setDifficulty] = useState(params.get("difficulty") ?? "all"),
    [mode, setMode] = useState(params.get("mode") ?? "adaptive"),
    [count, setCount] = useState(params.get("count") ?? "8");
  const [qs, setQs] = useState<PublicQuestion[]>([]),
    [index, setIndex] = useState(0),
    [loading, setLoading] = useState(false),
    [answer, setAnswer] = useState(""),
    [note, setNote] = useState(""),
    [result, setResult] = useState<Grade | null>(null),
    [results, setResults] = useState<Record<string, Grade>>({}),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(""),
    [eliminated, setEliminated] = useState<string[]>([]),
    [hintOpen, setHintOpen] = useState(false),
    [hintLevel, setHintLevel] = useState(0),
    [hint, setHint] = useState(""),
    [assisted, setAssisted] = useState(false),
    [line, setLine] = useState(false),
    [highlight, setHighlight] = useState(""),
    [report, setReport] = useState(false),
    [reportText, setReportText] = useState("");
  const start = useRef(Date.now()),
    requestId = useRef(""),
    drafts = useRef<Record<string, { answer: string; note: string }>>({}),
    loaded = useRef("");
  const q = qs[index];
  const setRequest = useRef(0);
  const autoSetKey = useRef<string | null>(null);
  const begin = useCallback(
    async (opts?: {
      section?: string;
      skill?: string;
      mode?: string;
      count?: string;
      difficulty?: string;
    }) => {
      const request = ++setRequest.current;
      setLoading(true);
      setError("");
      try {
        const search = new URLSearchParams({
          section: opts?.section ?? section,
          skill: opts?.skill ?? skill,
          difficulty: opts?.difficulty ?? difficulty,
          mode: opts?.mode ?? mode,
          count: opts?.count ?? count,
        });
        const data = await api<{
          questions: PublicQuestion[];
          drafts: Record<string, { answer: string; note: string }>;
        }>("questions?" + search);
        if (request !== setRequest.current) return;
        if (!data.questions.length) {
          setError(
            "No questions match this set yet. Try another skill or practice mode.",
          );
          return;
        }
        drafts.current = data.drafts;
        setQs(data.questions);
        setIndex(0);
        setResults({});
        setDone(false);
        loaded.current = "";
      } catch (e) {
        if (request === setRequest.current) setError((e as Error).message);
      } finally {
        if (request === setRequest.current) setLoading(false);
      }
    },
    [section, skill, difficulty, mode, count],
  );
  const query = params.toString();
  useEffect(() => {
    setSection(params.get("section") ?? "all");
    setSkill(params.get("skill") ?? "");
    setMode(params.get("mode") ?? "adaptive");
    setDifficulty(params.get("difficulty") ?? "all");
    setCount(params.get("count") ?? "8");
    if (
      (params.get("skill") || params.get("count") || params.get("mode")) &&
      autoSetKey.current !== query
    ) {
      autoSetKey.current = query;
      void begin({
        section: params.get("section") ?? "all",
        skill: params.get("skill") ?? "",
        mode: params.get("mode") ?? "adaptive",
        count: params.get("count") ?? "8",
        difficulty: params.get("difficulty") ?? "all",
      });
    }
  }, [query]); // URL defines a new explicit set.
  useEffect(() => {
    if (!q || loaded.current === q.id) return;
    loaded.current = q.id;
    const d = drafts.current[q.id];
    setAnswer(results[q.id]?.attempt.answer ?? d?.answer ?? "");
    setNote(d?.note ?? "");
    setResult(results[q.id] ?? null);
    setEliminated([]);
    setHint("");
    setHintLevel(0);
    setAssisted(false);
    setHighlight("");
    setHintOpen(false);
    start.current = Date.now();
    requestId.current = crypto.randomUUID();
    setSaved("");
  }, [q, results]);
  useEffect(() => {
    if (!q || result) return;
    const t = setTimeout(() => {
      if (!answer && !note) return;
      api("draft", { questionId: q.id, answer, note, flag: false })
        .then(() => {
          setSaved("Saved");
          drafts.current[q.id] = { answer, note };
        })
        .catch(() => setSaved("Not saved — reconnect before leaving"));
    }, 400);
    return () => clearTimeout(t);
  }, [answer, note, q, result]);
  const submit = async () => {
    if (!q || !answer || busy) return;
    setBusy(true);
    setError("");
    try {
      const grade = await api<Grade>("answer", {
        questionId: q.id,
        answer,
        seconds: Math.round((Date.now() - start.current) / 1000),
        assisted,
        requestId: requestId.current,
        note,
      });
      setResult(grade);
      setResults((prev) => ({ ...prev, [q.id]: grade }));
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const getHint = async (level = hintLevel) => {
    if (!q) return;
    try {
      const r = await api<{ message: string; answer?: string }>("tutor", {
        questionId: q.id,
        level,
      });
      setHint(r.message + (r.answer ? " Answer: " + r.answer : ""));
      setHintLevel(Math.min(5, level + 1));
      setAssisted(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const advance = async () => {
    if (index === qs.length - 1) {
      setDone(true);
      return;
    }
    setBusy(true);
    try {
      if (mode === "adaptive" && !results[qs[index + 1].id]) {
        const search = new URLSearchParams({
          section,
          skill,
          difficulty,
          mode,
          count: String(qs.length - index - 1),
          exclude: [
            ...new Set([
              ...Object.keys(results),
              ...qs.slice(0, index + 1).map((q) => q.id),
            ]),
          ].join(","),
        });
        const next = await api<{ questions: PublicQuestion[] }>(
          "questions?" + search,
        );
        if (!next.questions.length) {
          setDone(true);
          return;
        }
        setQs((previous) => [
          ...previous.slice(0, index + 1),
          ...next.questions,
        ]);
      }
      loaded.current = "";
      setIndex(index + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (done)
    return (
      <>
        <PageHeading
          title="A little more understanding."
          description="Your session is saved. Take a moment to notice what you learned."
        />
        <section className="session-summary">
          <span className="round-icon">
            <CheckCircle2 size={28} />
          </span>
          <h2>Session complete</h2>
          <p>
            {Object.values(results).filter((g) => g.correct).length} correct out
            of {Object.values(results).length} answered ·{" "}
            {qs.length - Object.keys(results).length} skipped
          </p>
          <p className="muted">
            Repeated or assisted answers stay in your history, but don’t inflate
            your independent mastery evidence.
          </p>
          <div className="summary-actions">
            <Button
              onClick={() => {
                setQs([]);
                setDone(false);
              }}
            >
              Build another set
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/analytics">View your progress</Link>
            </Button>
          </div>
        </section>
      </>
    );
  if (!qs.length)
    return (
      <>
        <PageHeading
          title="Practice with a purpose."
          description="Choose a focus, or let your learning history guide the next question."
        />
        {s.preview && <PreviewNotice />}
        <div className="practice-entry-points" aria-label="Practice shortcuts">
          <Link href="/practice?section=rw&skill=words-context&count=5">
            <BookOpen size={20} />
            <span>
              <strong>Vocabulary in context</strong>
              <small>Read the clues, not a word list.</small>
            </span>
            <ChevronRight size={16} />
          </Link>
          <Link href="/practice?difficulty=hard&mode=mixed&count=5">
            <Target size={20} />
            <span>
              <strong>A thoughtful challenge</strong>
              <small>Five provisionally hard questions.</small>
            </span>
            <ChevronRight size={16} />
          </Link>
          <Link href="/practice?mode=bookmarks&count=8">
            <Bookmark size={20} />
            <span>
              <strong>Your saved questions</strong>
              <small>Return to something worth revisiting.</small>
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>
        <section className="set-builder">
          <div className="section-header">
            <div>
              <h2>Make this session yours</h2>
              <p className="muted">
                Short and focused is a perfectly good place to start.
              </p>
            </div>
            <span className="round-icon">
              <SlidersHorizontal size={20} />
            </span>
          </div>
          <div
            className="section-toggle"
            role="group"
            aria-label="Practice section"
          >
            {[
              ["all", "Both sections"],
              ["math", "Math"],
              ["rw", "Reading & Writing"],
            ].map(([id, label]) => (
              <button
                className={section === id ? "selected" : ""}
                key={id}
                onClick={() => {
                  setSection(id);
                  setSkill("");
                }}
                aria-pressed={section === id}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="builder-grid">
            <label>
              Skill
              <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                <option value="">All available skills</option>
                {s.skills
                  .filter((x) => section === "all" || x.section === section)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="all">A balanced mix</option>
                <option value="easy">Easy (provisional)</option>
                <option value="medium">Medium (provisional)</option>
                <option value="hard">Hard (provisional)</option>
              </select>
            </label>
            <label>
              Practice mode
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="adaptive">Recommended practice</option>
                <option value="mixed">Mixed practice</option>
                <option value="mistakes">Mistake recovery</option>
                <option value="review">Due spaced review</option>
                <option value="bookmarks">Saved questions</option>
              </select>
            </label>
            <label>
              Questions
              <select value={count} onChange={(e) => setCount(e.target.value)}>
                {[5, 8, 10, 15, 20].map((x) => (
                  <option key={x} value={x}>
                    {x} questions
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="builder-footer">
            <span>
              <Clock3 size={15} />
              About {Math.round(Number(count) * 1.3)} minutes · Untimed practice
            </span>
            <Button onClick={() => begin()} disabled={loading}>
              {loading ? "Preparing your set…" : "Start practice"}
              <ArrowRight size={16} />
            </Button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="section">
          <div className="section-header">
            <h2>Explore the domains</h2>
            <Tag>{s.skills.length} official skills</Tag>
          </div>
          <div className="domain-grid">
            {[
              ...new Set(
                s.skills
                  .filter((x) => section === "all" || x.section === section)
                  .map((x) => x.domain),
              ),
            ].map((domain) => (
              <div className="domain-card" key={domain}>
                <h3>{domain}</h3>
                {s.skills
                  .filter((x) => x.domain === domain)
                  .map((sk) => (
                    <button
                      key={sk.id}
                      onClick={() => {
                        setSkill(sk.id);
                        setSection(sk.section);
                      }}
                      className={skill === sk.id ? "chosen-skill" : ""}
                    >
                      {sk.name}
                      <ChevronRight size={13} />
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </section>
      </>
    );
  return (
    <>
      <div className="practice-heading">
        <div>
          <button className="text-button muted" onClick={() => setQs([])}>
            <ChevronLeft size={14} />
            Question bank
          </button>
          <h1>
            {s.skills.find((sk) => sk.id === q?.skill)?.name ??
              "Focused practice"}
          </h1>
        </div>
        <div className="practice-heading-actions">
          <Tag>
            {index + 1} of {qs.length}
          </Tag>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setDone(true);
              void refresh();
            }}
          >
            Finish session
          </Button>
        </div>
      </div>
      {s.preview && <PreviewNotice />}
      {q && (
        <div className={"question-layout " + (hintOpen ? "tutor-open" : "")}>
          <section className="question-workspace">
            <div className="question-toolbar">
              <span>
                {q.section === "math" ? "Math" : "Reading & Writing"}
                <span className="tiny-dot" />
                {q.difficulty}
                <span className="tiny-dot" />
                {q.type === "spr"
                  ? "Student-produced response"
                  : "Multiple choice"}
              </span>
              <div>
                <button
                  className={
                    "icon-button " +
                    (s.bookmarks.includes(q.id) ? "is-active" : "")
                  }
                  aria-label={
                    s.bookmarks.includes(q.id)
                      ? "Remove bookmark"
                      : "Bookmark question"
                  }
                  onClick={async () => {
                    await api("bookmark", { questionId: q.id });
                    await refresh();
                  }}
                >
                  <Bookmark
                    size={17}
                    fill={s.bookmarks.includes(q.id) ? "currentColor" : "none"}
                  />
                </button>
                <button
                  className="icon-button"
                  aria-label="Report question"
                  onClick={() => setReport(true)}
                >
                  <Flag size={16} />
                </button>
              </div>
            </div>
            <div
              className={"question-body " + (q.passage ? "has-passage" : "")}
            >
              <div
                className={"passage-area " + (line ? "line-reader" : "")}
                onMouseUp={() => {
                  const selection = window.getSelection()?.toString();
                  if (selection && selection.length < 1000)
                    setHighlight(selection);
                }}
              >
                {q.passage && (
                  <>
                    <div className="passage-tools">
                      <button
                        className="text-button"
                        onClick={() => setLine(!line)}
                        aria-pressed={line}
                      >
                        <FileText size={14} />
                        Line focus
                      </button>
                      <button
                        className="text-button"
                        onClick={() =>
                          highlight
                            ? setHighlight("")
                            : notify("Select a passage phrase to highlight it.")
                        }
                      >
                        <Highlighter size={14} />
                        {highlight ? "Clear highlight" : "Highlight text"}
                      </button>
                    </div>
                    <div className="passage-text">
                      {highlight && q.passage.includes(highlight) ? (
                        <>
                          {q.passage.split(highlight).map((part, i) => (
                            <span key={i}>
                              {i > 0 && <mark>{highlight}</mark>}
                              <MathText text={part} />
                            </span>
                          ))}
                        </>
                      ) : (
                        <MathText text={q.passage} />
                      )}
                    </div>
                  </>
                )}
                {q.table && (
                  <table className="question-table">
                    <caption>Question data</caption>
                    <thead>
                      <tr>
                        {q.table.headers.map((h) => (
                          <th key={h} scope="col">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.table.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((c, j) => (
                            <td key={j}>{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {q.diagram && <Figure figure={q.diagram} />}
              </div>
              <div className="response-area">
                <div className="question-number">Question {index + 1}</div>
                <div className="question-stem">
                  <MathText text={q.stem} />
                </div>
                {q.type === "mcq" ? (
                  <div
                    className="choices"
                    role="radiogroup"
                    aria-label="Answer choices"
                  >
                    {q.options.map((o, i) => {
                      const eliminatedChoice = eliminated.includes(o);
                      return (
                        <div key={o} className="choice-row">
                          <label
                            className={
                              "choice " +
                              (answer === o ? "choice-selected " : "") +
                              (eliminatedChoice ? "choice-eliminated " : "") +
                              (result && o === result.answer
                                ? "choice-correct "
                                : "") +
                              (result && !result.correct && o === answer
                                ? "choice-incorrect"
                                : "")
                            }
                          >
                            <input
                              type="radio"
                              name={"answer-" + q.id}
                              value={o}
                              checked={answer === o}
                              disabled={!!result || eliminatedChoice}
                              onChange={() => setAnswer(o)}
                            />
                            <span className="choice-letter">{"ABCD"[i]}</span>
                            <span>
                              <MathText
                                text={
                                  q.section === "math" && /^-?[\d./]+$/.test(o)
                                    ? "$" + o + "$"
                                    : o
                                }
                              />
                            </span>
                            {result && o === result.answer && (
                              <Check size={17} />
                            )}
                          </label>
                          {!result && (
                            <button
                              className={
                                "eliminate " +
                                (eliminatedChoice ? "eliminated" : "")
                              }
                              aria-label={
                                (eliminatedChoice ? "Restore" : "Eliminate") +
                                " choice " +
                                "ABCD"[i]
                              }
                              onClick={() => {
                                setEliminated((prev) =>
                                  prev.includes(o)
                                    ? prev.filter((x) => x !== o)
                                    : [...prev, o],
                                );
                                if (answer === o) setAnswer("");
                              }}
                            >
                              <Minus size={15} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <label className="numeric-label">
                    Your answer
                    <input
                      autoComplete="off"
                      inputMode="decimal"
                      aria-label="Numeric answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={!!result}
                      placeholder="Number, decimal, or fraction"
                    />
                    <small>
                      Equivalent fractions and permitted decimal approximations
                      are accepted.
                    </small>
                  </label>
                )}
                <details className="reasoning-notes">
                  <summary>
                    <PenLine size={14} />
                    Your reasoning (optional)
                  </summary>
                  <textarea
                    aria-label="Your reasoning"
                    value={note}
                    maxLength={3000}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What did you try? Keep a note for your future self."
                    disabled={!!result}
                  />
                </details>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </div>
            {result && (
              <div
                className={
                  "explanation " +
                  (result.correct
                    ? "explanation-correct"
                    : "explanation-incorrect")
                }
                role="status"
              >
                <h3>
                  {result.correct ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Lightbulb size={18} />
                  )}{" "}
                  {result.correct
                    ? "That’s right."
                    : "A useful place to learn."}
                </h3>
                {!result.correct && (
                  <p>
                    Correct answer:{" "}
                    <strong>
                      <MathText text={result.answer} />
                    </strong>
                  </p>
                )}
                <h4>The reasoning</h4>
                <ol>
                  {result.steps.map((step, i) => (
                    <li key={i}>
                      <MathText text={step} />
                    </li>
                  ))}
                </ol>
                <p className="evidence-note">
                  {result.attempt.assisted
                    ? "Assisted answer — not used as independent mastery evidence."
                    : !result.attempt.first
                      ? "Retry saved — no extra mastery credit for an exposed question."
                      : "First independent answer saved as provisional learning evidence."}
                </p>
              </div>
            )}
            <footer className="question-footer">
              <Button
                variant="ghost"
                size="small"
                onClick={() => setHintOpen(!hintOpen)}
              >
                <Lightbulb size={16} />
                {hintOpen ? "Close learning guide" : "Learning guide"}
              </Button>
              <span className="autosave" aria-live="polite">
                {result ? "Answer saved" : saved}
              </span>
              <div className="question-footer-nav">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={index === 0}
                  onClick={() => {
                    loaded.current = "";
                    setIndex(index - 1);
                  }}
                >
                  <ChevronLeft size={15} />
                  Previous
                </Button>
                {!result ? (
                  <Button
                    size="small"
                    onClick={submit}
                    disabled={!answer || busy}
                  >
                    {busy ? "Checking…" : "Check answer"}
                    <Check size={15} />
                  </Button>
                ) : (
                  <Button size="small" onClick={advance} disabled={busy}>
                    {index === qs.length - 1
                      ? "Finish session"
                      : "Next question"}
                    <ArrowRight size={15} />
                  </Button>
                )}
              </div>
            </footer>
          </section>
          {hintOpen && (
            <aside className="tutor-panel">
              <div className="section-header">
                <h3>
                  <Lightbulb size={17} />
                  Learning guide
                </h3>
                <button
                  className="icon-button"
                  aria-label="Close learning guide"
                  onClick={() => setHintOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <Tag>Grounded, offline guidance</Tag>
              <p>
                This guide uses the question’s stored explanation. A hosted AI
                provider is not connected.
              </p>
              <div className="tutor-message">
                {hint ? (
                  <MathText text={hint} />
                ) : (
                  "Start with what you know. What is the question asking you to find?"
                )}
              </div>
              <Button variant="secondary" onClick={() => getHint()}>
                {hintLevel === 0 ? "Help me get started" : "Next hint"}
              </Button>
              <button className="text-button" onClick={() => getHint(4)}>
                Show the worked explanation
              </button>
              <p className="evidence-note">
                Using a hint marks this answer as assisted.
              </p>
            </aside>
          )}
        </div>
      )}
      <Modal
        open={report}
        onOpenChange={setReport}
        title="Help improve this question"
        description="Reports enter the editorial review queue, linked to this question."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("report", { questionId: q.id, message: reportText });
              setReport(false);
              setReportText("");
              notify("Report saved to the editorial queue.");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <label>
            What needs attention?
            <textarea
              value={reportText}
              minLength={8}
              maxLength={2000}
              required
              onChange={(e) => setReportText(e.target.value)}
            />
          </label>
          <Button type="submit">Send report</Button>
        </form>
      </Modal>
    </>
  );
}
function Planner({
  state: s,
  onPractice,
  onSettings,
}: {
  state: AppState;
  onPractice: (o?: Record<string, string>) => void;
  onSettings: () => void;
}) {
  return (
    <>
      <PageHeading
        title="Make a little room for progress."
        description="A flexible rhythm, shaped by your available time and independent answers."
        action={
          <Button variant="secondary" onClick={onSettings}>
            <Settings2 size={15} />
            Edit your goals
          </Button>
        }
      />
      <div className="planner-summary">
        <div>
          <Target size={20} />
          <span>
            Target score<strong>{s.preferences.targetScore}</strong>
            <small>A goal you set, not a prediction</small>
          </span>
        </div>
        <div>
          <CalendarDays size={20} />
          <span>
            Test date
            <strong>
              {s.preferences.testDate
                ? date(s.preferences.testDate)
                : "Not set yet"}
            </strong>
            <small>
              {s.preferences.testDate
                ? "Adjust it whenever plans change"
                : "Set a date when you’re ready"}
            </small>
          </span>
        </div>
        <div>
          <Clock3 size={20} />
          <span>
            Weekly study time
            <strong>{s.preferences.weeklyMinutes} minutes</strong>
            <small>Across {s.preferences.days.length} study days</small>
          </span>
        </div>
      </div>
      <section className="section">
        <div className="section-header">
          <h2>Your next study days</h2>
          <Tag>Updates with your answers</Tag>
        </div>
        <div className="plan-rows">
          {s.plan.map((p, i) => (
            <article key={p.date}>
              <div className="plan-date">
                <strong>
                  {new Date(p.date + "T12:00:00Z").toLocaleDateString("en-US", {
                    weekday: "short",
                    timeZone: "UTC",
                  })}
                </strong>
                <span>{date(p.date)}</span>
              </div>
              <div className="plan-task">
                <Tag>
                  {p.skill.section === "math" ? "Math" : "Reading & Writing"}
                </Tag>
                <h3>{p.skill.name}</h3>
                <p>{p.reason}</p>
                <span>
                  <Clock3 size={14} />
                  {p.minutes} minutes · {p.count} suggested questions
                </span>
              </div>
              <Button
                variant={i === 0 ? "primary" : "secondary"}
                onClick={() =>
                  onPractice({
                    skill: p.skill.id,
                    count: String(Math.min(20, p.count)),
                  })
                }
              >
                Start a set
                <ArrowRight size={15} />
              </Button>
            </article>
          ))}
        </div>
      </section>
      <div className="quiet-note">
        <CalendarDays size={19} />
        <div>
          <strong>Missed a day? You haven’t fallen behind.</strong>
          <p>
            The plan looks forward from today. Missed sessions don’t pile up
            into tomorrow’s workload.
          </p>
        </div>
      </div>
    </>
  );
}
function Analytics({
  state: s,
  onPractice,
}: {
  state: AppState;
  onPractice: (o?: Record<string, string>) => void;
}) {
  const independent = s.attempts.filter((a) => a.first && !a.assisted),
    correct = independent.filter((a) => a.correct).length;
  const [section, setSection] = useState("all");
  const observed = s.mastery.filter((m) => m.n > 0);
  const filtered = s.skills.filter(
    (sk) => section === "all" || sk.section === section,
  );
  return (
    <>
      <PageHeading
        title="See the learning, not just the score."
        description="Only your actual answers. Uncertainty included."
      />
      <div className="metric-row analytics-metrics">
        <div>
          <span>Independent answers</span>
          <strong>
            {independent.length}
            <small>First exposure, without hints</small>
          </strong>
        </div>
        <div>
          <span>First-attempt accuracy</span>
          <strong>
            {independent.length ? pct(correct / independent.length) : "—"}
            <small>{correct} correct answers</small>
          </strong>
        </div>
        <div>
          <span>Skills with evidence</span>
          <strong>
            {observed.length}
            <em> / {s.skills.length}</em>
            <small>More observations improve estimates</small>
          </strong>
        </div>
      </div>
      {!s.attempts.length && (
        <Empty
          icon={ChartNoAxesCombined}
          title="Your first question gives us a starting point."
          description="Practice a few unfamiliar questions. You’ll see real accuracy, timing, and skill evidence here — never a made-up score."
          action={
            <Button onClick={() => onPractice()}>
              Start practice
              <ArrowRight size={15} />
            </Button>
          }
        />
      )}
      <section className="section">
        <div className="section-header">
          <h2>Section performance</h2>
          <Tag>No official score prediction</Tag>
        </div>
        <div className="section-performance">
          {(["math", "rw"] as const).map((section) => {
            const a = independent.filter((a) => a.section === section);
            return (
              <div key={section}>
                <h3>{section === "math" ? "Math" : "Reading & Writing"}</h3>
                <strong>
                  {a.length
                    ? pct(a.filter((a) => a.correct).length / a.length)
                    : "—"}
                </strong>
                <p>{a.length} independent answers</p>
                <div className="progress-track">
                  <div
                    style={{
                      width: a.length
                        ? pct(a.filter((a) => a.correct).length / a.length)
                        : "0%",
                    }}
                  />
                </div>
                <small>
                  {a.length
                    ? `Average recorded time: ${Math.round(a.reduce((n, x) => n + x.seconds, 0) / a.length)} seconds`
                    : "Timing appears after your first session"}
                </small>
              </div>
            );
          })}
        </div>
      </section>
      <section className="section">
        <div className="section-header">
          <h2>Skill evidence</h2>
          <select
            aria-label="Filter skill evidence by section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="all">Both sections</option>
            <option value="math">Math</option>
            <option value="rw">Reading & Writing</option>
          </select>
        </div>
        <p className="muted">
          An interpretable, difficulty-weighted Bayesian baseline. Intervals are
          approximate 90% credible ranges, not official score bands.
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Independent answers</th>
                <th scope="col">Provisional estimate</th>
                <th scope="col">Uncertainty range</th>
                <th scope="col">Next step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sk) => {
                const m = s.mastery.find((m) => m.skill === sk.id)!;
                return (
                  <tr key={sk.id}>
                    <td>
                      <strong>{sk.name}</strong>
                      <small>{sk.domain}</small>
                    </td>
                    <td>{m.n}</td>
                    <td>{m.n ? pct(m.mean) : "Not measured"}</td>
                    <td>
                      {m.n ? (
                        <div className="interval">
                          <span>
                            {pct(m.low)}–{pct(m.high)}
                          </span>
                          <div>
                            <i
                              style={{
                                left: pct(m.low),
                                width: pct(m.high - m.low),
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        "More evidence needed"
                      )}
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => onPractice({ skill: sk.id })}
                      >
                        {m.due ? "Review" : "Practice"}
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <div className="section-header">
          <h2>Recent response history</h2>
          <span className="muted">{s.attempts.length} saved attempts</span>
        </div>
        {s.attempts.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Question skill</th>
                  <th scope="col">Result</th>
                  <th scope="col">Evidence type</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {s.attempts
                  .slice(-20)
                  .reverse()
                  .map((a) => (
                    <tr key={a.id}>
                      <td>{s.skills.find((sk) => sk.id === a.skill)?.name}</td>
                      <td>
                        <Tag tone={a.correct ? "green" : "amber"}>
                          {a.correct ? "Correct" : "To revisit"}
                        </Tag>
                      </td>
                      <td>
                        {a.assisted
                          ? "Assisted"
                          : a.first
                            ? "Independent"
                            : "Retry"}
                      </td>
                      <td>{a.seconds} sec</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No attempts recorded yet.</p>
        )}
      </section>
    </>
  );
}
function Mistakes({
  state: s,
  onPractice,
  refresh,
  notify,
}: {
  state: AppState;
  onPractice: (o?: Record<string, string>) => void;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [editing, setEditing] = useState<Attempt | null>(null),
    [note, setNote] = useState(""),
    [cause, setCause] = useState("uncertain"),
    [error, setError] = useState("");
  const ids = [
    ...new Set(s.attempts.filter((a) => !a.correct).map((a) => a.questionId)),
  ];
  return (
    <>
      <PageHeading
        title="A wrong answer is a useful clue."
        description="Revisit the concept, reflect on your reasoning, and check it with a fresh question."
        action={
          ids.length ? (
            <Button
              onClick={() => onPractice({ mode: "mistakes", count: "8" })}
            >
              Review missed questions
              <RotateCcw size={15} />
            </Button>
          ) : undefined
        }
      />
      {!ids.length ? (
        <Empty
          icon={RotateCcw}
          title="A place to turn mistakes into understanding."
          description="When you miss a question, it will appear here with its concept and a space for your own reflection."
          action={
            <Button onClick={() => onPractice()}>
              Start practice
              <ArrowRight size={15} />
            </Button>
          }
        />
      ) : (
        <div className="mistake-list">
          {ids.map((qid) => {
            const all = s.attempts.filter((a) => a.questionId === qid),
              miss = all.find((a) => !a.correct)!,
              last = all.at(-1)!;
            return (
              <article key={qid}>
                <div className="section-header">
                  <Tag tone={last.correct ? "green" : "amber"}>
                    {last.correct ? "Corrected on retry" : "Ready to revisit"}
                  </Tag>
                  <span className="muted">{date(miss.createdAt)}</span>
                </div>
                <h3>{s.skills.find((x) => x.id === miss.skill)?.name}</h3>
                <p>
                  Possible cause:{" "}
                  {miss.misconception === "uncertain"
                    ? "not enough evidence to infer one"
                    : miss.misconception}
                  . You know your reasoning better than an answer choice does.
                </p>
                {miss.note && <blockquote>{miss.note}</blockquote>}
                <div className="mistake-actions">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      setEditing(miss);
                      setNote(miss.note);
                      setCause(miss.misconception);
                    }}
                  >
                    Reflect on this attempt
                    <PenLine size={14} />
                  </Button>
                  <button
                    className="text-button"
                    onClick={() =>
                      onPractice({ skill: miss.skill, count: "5" })
                    }
                  >
                    Try fresh questions
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Modal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="What happened in your reasoning?"
        description="Your reflection replaces any uncertain system inference."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("attempt-note", {
                id: editing!.id,
                note,
                misconception: cause,
              });
              setEditing(null);
              await refresh();
              notify("Reflection saved.");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <label>
            Your best explanation
            <select value={cause} onChange={(e) => setCause(e.target.value)}>
              {[
                ["uncertain", "Not sure yet"],
                ["concept", "Concept understanding"],
                ["procedure", "Procedure or algebra"],
                ["misreading", "Misread the question"],
                ["evidence", "Evidence selection"],
                ["grammar", "Grammar rule"],
                ["timing", "Time pressure"],
                ["careless", "Execution slip"],
                ["guess", "I guessed"],
              ].map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reflection
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={3000}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <Button type="submit">Save reflection</Button>
        </form>
      </Modal>
    </>
  );
}
function Tests({
  state: s,
  notify,
}: {
  state: AppState;
  notify: (s: string) => void;
}) {
  const [busy, setBusy] = useState("");
  const router = useRouter();
  const start = async (mode: string) => {
    setBusy(mode);
    try {
      const e = await api<{ id: string }>("exam/start", { mode });
      router.push("/exam?id=" + e.id);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  return (
    <>
      <PageHeading
        title="Get familiar with the moment."
        description="Practice staying focused in a timed workspace. Understand what each assessment can and can’t tell you."
      />
      {s.preview && <PreviewNotice />}
      <div className="test-cards">
        <article>
          <span className="round-icon">
            <Target size={23} />
          </span>
          <Tag tone="green">Start here</Tag>
          <h2>A short diagnostic</h2>
          <p>
            Twelve questions across Math and Reading & Writing. A provisional
            starting point for practice, not a precise score estimate.
          </p>
          <div className="test-details">
            <span>
              <BookOpen size={15} />2 modules · 6 questions each
            </span>
            <span>
              <Clock3 size={15} />8 minutes per module
            </span>
          </div>
          <Button onClick={() => start("diagnostic")} disabled={!!busy}>
            {busy === "diagnostic" ? "Preparing…" : "Start diagnostic"}
            <ArrowRight size={15} />
          </Button>
        </article>
        <article>
          <span className="round-icon">
            <Clock3 size={23} />
          </span>
          <Tag>Engineering preview</Tag>
          <h2>A timed Math module</h2>
          <p>
            Practice the controls, timer, autosave, and review flow with 22
            original Math candidates. Not a validated SAT form.
          </p>
          <div className="test-details">
            <span>
              <BookOpen size={15} />
              22 questions
            </span>
            <span>
              <Clock3 size={15} />
              35 minutes
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={() => start("math-preview")}
            disabled={!!busy}
          >
            {busy === "math-preview" ? "Preparing…" : "Practice a Math module"}
            <ArrowRight size={15} />
          </Button>
        </article>
      </div>
      <section className="release-panel">
        <div>
          <ClipboardList size={25} />
          <h2>Full-length SAT simulation</h2>
          <p>
            The four-module state machine is implemented. Public full-length
            forms remain gated on editorial review, calibrated inventory, and
            validated form assembly.
          </p>
        </div>
        <div className="release-readiness">
          <Tag tone="amber">Not released</Tag>
          <p>{s.readiness.rw} / 54 published Reading & Writing items</p>
          <p>{s.readiness.math} / 44 published Math items</p>
          <p>98 questions · 134 testing minutes · 10-minute break</p>
          <Link href="/content" className="text-button">
            See release requirements
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="section-header">
          <h2>Your assessments</h2>
        </div>
        {s.exams.length ? (
          <div className="activity-list">
            {s.exams.map((e) => (
              <div key={e.id}>
                <span className="round-icon">
                  <ClipboardList size={17} />
                </span>
                <div>
                  <strong>
                    {e.mode === "diagnostic"
                      ? "Short diagnostic"
                      : "Math module preview"}
                  </strong>
                  <small>
                    {date(e.createdAt)} ·{" "}
                    {e.status === "complete"
                      ? `${e.correct} of ${e.total} correct`
                      : e.status === "break"
                        ? "Break in progress"
                        : "In progress"}
                  </small>
                </div>
                <Button variant="secondary" size="small" asChild>
                  <Link href={"/exam?id=" + e.id}>
                    {e.status === "complete" ? "Review" : "Resume"}
                    <ChevronRight size={14} />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Your saved diagnostic and module sessions will appear here.
          </p>
        )}
      </section>
    </>
  );
}
type ExamData = {
  exam: Exam;
  questions: PublicQuestion[];
  serverTime: string;
  review?: {
    question: PublicQuestion;
    answer: string;
    correct: boolean;
    correctAnswer: string;
    explanation: string;
  }[];
};
function ExamWorkspace({
  state: s,
  refresh,
  notify,
}: {
  state: AppState;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const params = useSearchParams(),
    examId = params.get("id");
  const [data, setData] = useState<ExamData | null>(null),
    [index, setIndex] = useState(0),
    [tick, setTick] = useState(Date.now()),
    [offset, setOffset] = useState(0),
    [error, setError] = useState(""),
    [hidden, setHidden] = useState(false),
    [modal, setModal] = useState(""),
    [zoom, setZoom] = useState(false),
    [saving, setSaving] = useState("All changes saved"),
    [calc, setCalc] = useState(""),
    [calcResult, setCalcResult] = useState(""),
    [busy, setBusy] = useState(false);
  const queue = useRef(Promise.resolve()),
    moduleIndex = useRef(-1);
  const load = useCallback(async () => {
    if (!examId) return;
    try {
      const d = await api<ExamData>("exam?id=" + examId);
      setData(d);
      setOffset(Date.parse(d.serverTime) - Date.now());
      if (moduleIndex.current !== d.exam.current) {
        moduleIndex.current = d.exam.current;
        setIndex(0);
      }
      if (d.exam.status === "complete") await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [examId, refresh]);
  useEffect(() => {
    void load();
    const t = setInterval(() => setTick(Date.now()), 1000);
    const p = setInterval(() => {
      void load();
    }, 15000);
    return () => {
      clearInterval(t);
      clearInterval(p);
    };
  }, [load]);
  const e = data?.exam,
    m = e?.modules[e.current],
    q = data?.questions[index];
  const remaining = m?.deadline
    ? Math.max(0, Math.ceil((Date.parse(m.deadline) - tick - offset) / 1000))
    : 0;
  useEffect(() => {
    if (e?.status === "active" && m?.deadline && remaining === 0) void load();
  }, [remaining, e?.status, m?.deadline, load]);
  const save = (change: { answer?: string; flag?: boolean; note?: string }) => {
    if (!e || !m || !q) return;
    const answer = change.answer ?? m.answers[q.id] ?? "",
      flag = change.flag ?? m.flags.includes(q.id),
      note = change.note ?? m.notes[q.id] ?? "";
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev),
        mm = next.exam.modules[next.exam.current];
      mm.answers[q.id] = answer;
      mm.notes[q.id] = note;
      mm.flags = flag
        ? [...new Set([...mm.flags, q.id])]
        : mm.flags.filter((x) => x !== q.id);
      return next;
    });
    setSaving("Saving…");
    queue.current = queue.current
      .then(async () => {
        try {
          await api("exam/save", {
            id: e.id,
            index: e.current,
            questionId: q.id,
            answer,
            flag,
            note,
          });
          setSaving("All changes saved");
        } catch (err) {
          setSaving("Not saved — retry before leaving");
          setError((err as Error).message);
          throw err;
        }
      })
      .catch(() => {});
  };
  const submit = async () => {
    if (!e) return;
    setBusy(true);
    try {
      await queue.current;
      for (const qid of m!.questionIds) {
        await api("exam/save", {
          id: e.id,
          index: e.current,
          questionId: qid,
          answer: m!.answers[qid] ?? "",
          flag: m!.flags.includes(qid),
          note: m!.notes[qid] ?? "",
        });
      }
      await api("exam/submit", { id: e.id, index: e.current });
      setModal("");
      await load();
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!examId)
    return (
      <Empty
        title="Choose an assessment first"
        description="Your diagnostic and timed practice live in Practice tests."
        action={
          <Button asChild>
            <Link href="/tests">Browse assessments</Link>
          </Button>
        }
      />
    );
  if (!data || !e || !m)
    return <p role="status">{error || "Opening your saved assessment…"}</p>;
  if (e.status === "complete")
    return (
      <>
        <PageHeading
          title="A clearer starting point."
          description="Raw results from your original-content preview. This is not an official-equivalent SAT score."
        />
        <div className="assessment-result">
          <span className="round-icon">
            <CheckCircle2 size={26} />
          </span>
          <h2>
            {e.modules.reduce((a, m) => a + (m.correct ?? 0), 0)}{" "}
            <span>
              / {e.modules.reduce((a, m) => a + m.questionIds.length, 0)}{" "}
              correct
            </span>
          </h2>
          <p>
            {e.mode === "diagnostic" ? "Diagnostic" : "Math module"} complete.
            Skipped questions count as incorrect in this result.
          </p>
          <Button asChild>
            <Link href="/planner">
              See your next steps
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
        <section className="section">
          <div className="section-header">
            <h2>Review the reasoning</h2>
          </div>
          <div className="exam-review">
            {data.review?.map((r, i) => (
              <details key={r.question.id}>
                <summary>
                  <span
                    className={
                      "attempt-icon " + (r.correct ? "correct" : "incorrect")
                    }
                  >
                    {r.correct ? <Check size={14} /> : <Minus size={14} />}
                  </span>
                  Question {i + 1}
                  <span>
                    {r.correct ? "Correct" : r.answer ? "Incorrect" : "Skipped"}
                  </span>
                  <ChevronRight size={15} />
                </summary>
                <div>
                  <p>
                    <MathText text={r.question.stem} />
                  </p>
                  <p>Your answer: {r.answer || "No response"}</p>
                  <p>
                    Correct answer: <MathText text={r.correctAnswer} />
                  </p>
                  <p>
                    <MathText text={r.explanation} />
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </>
    );
  if (e.status === "break") {
    const left = Math.max(
      0,
      Math.ceil((Date.parse(e.breakUntil!) - tick - offset) / 1000),
    );
    return (
      <section className="break-screen">
        <Clock3 size={35} />
        <h1>A moment to reset.</h1>
        <p>
          The standard ten-minute break is in progress. Your previous section is
          locked.
        </p>
        <strong>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </strong>
        <Button
          disabled={left > 0}
          onClick={async () => {
            await api("exam/resume", { id: e.id });
            await load();
          }}
        >
          Begin Math
        </Button>
      </section>
    );
  }
  return (
    <>
      {e.preview && <PreviewNotice />}
      <section className={"exam-workspace " + (zoom ? "zoomed" : "")}>
        <header className="exam-header">
          <div>
            <small>
              {e.mode === "diagnostic"
                ? "Short diagnostic"
                : "Timed module preview"}
            </small>
            <h1>
              {m.section === "math" ? "Math" : "Reading & Writing"} · Module{" "}
              {e.current + 1}
            </h1>
          </div>
          <div
            className={"exam-timer " + (remaining <= 300 ? "timer-low" : "")}
          >
            <strong aria-label="Time remaining">
              {!hidden || remaining <= 300
                ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                : "Timer hidden"}
            </strong>
            <button className="text-button" onClick={() => setHidden(!hidden)}>
              {hidden ? <Eye size={13} /> : <EyeOff size={13} />}{" "}
              {hidden ? "Show" : "Hide"}
            </button>
          </div>
          <div className="exam-tools">
            {m.section === "math" && (
              <>
                <button
                  className="tool-button"
                  onClick={() => setModal("calculator")}
                >
                  <Calculator size={17} />
                  <span>Calculator</span>
                </button>
                <button
                  className="tool-button"
                  onClick={() => setModal("reference")}
                >
                  <FileText size={17} />
                  <span>Reference</span>
                </button>
              </>
            )}
            <button
              className="tool-button"
              onClick={() => setZoom(!zoom)}
              aria-pressed={zoom}
            >
              <ZoomIn size={17} />
              <span>Text size</span>
            </button>
          </div>
        </header>
        {remaining <= 300 && (
          <div className="five-minute" role="status">
            {remaining === 0
              ? "Time is up. This module is being locked."
              : "Five minutes or less remain. The timer stays visible."}
          </div>
        )}
        {q && (
          <>
            <div className="exam-question-strip">
              <strong>Question {index + 1}</strong>
              <button
                className={
                  "text-button " + (m.flags.includes(q.id) ? "is-active" : "")
                }
                onClick={() => save({ flag: !m.flags.includes(q.id) })}
                aria-pressed={m.flags.includes(q.id)}
              >
                <Bookmark size={15} />
                Mark for review
              </button>
            </div>
            <div
              className={
                "question-body exam-question " +
                (q.passage ? "has-passage" : "")
              }
            >
              <div className="passage-area">
                {q.passage && (
                  <div className="passage-text">
                    <MathText text={q.passage} />
                  </div>
                )}
                {q.table && (
                  <table className="question-table">
                    <caption>Question data</caption>
                    <thead>
                      <tr>
                        {q.table.headers.map((h) => (
                          <th key={h} scope="col">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {q.table.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((c, j) => (
                            <td key={j}>{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {q.diagram && <Figure figure={q.diagram} />}
              </div>
              <div className="response-area">
                <div className="question-stem">
                  <MathText text={q.stem} />
                </div>
                {q.type === "mcq" ? (
                  <div
                    className="choices"
                    role="radiogroup"
                    aria-label="Assessment answer choices"
                  >
                    {q.options.map((option, i) => (
                      <label
                        className={
                          "choice " +
                          (m.answers[q.id] === option ? "choice-selected" : "")
                        }
                        key={option}
                      >
                        <input
                          type="radio"
                          name={"exam-" + q.id}
                          checked={m.answers[q.id] === option}
                          onChange={() => save({ answer: option })}
                        />
                        <span className="choice-letter">{"ABCD"[i]}</span>
                        <span>
                          <MathText
                            text={
                              m.section === "math" && /^-?[\d./]+$/.test(option)
                                ? "$" + option + "$"
                                : option
                            }
                          />
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <label className="numeric-label">
                    Your answer
                    <input
                      aria-label="Assessment numeric answer"
                      value={m.answers[q.id] ?? ""}
                      onChange={(event) => save({ answer: event.target.value })}
                      placeholder="Number, decimal, or fraction"
                    />
                  </label>
                )}
                <details className="reasoning-notes">
                  <summary>
                    <PenLine size={14} />
                    Notes
                  </summary>
                  <textarea
                    key={q.id}
                    aria-label="Assessment notes"
                    defaultValue={m.notes[q.id] ?? ""}
                    onBlur={(event) => save({ note: event.target.value })}
                  />
                </details>
              </div>
            </div>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
            <button className="text-button" onClick={() => load()}>
              Reload saved state
            </button>
          </p>
        )}
        <footer className="exam-footer">
          <span className="autosave" role="status">
            {saving}
          </span>
          <button
            className="question-nav-button"
            onClick={() => setModal("navigator")}
          >
            <Grid2X2 size={16} />
            Question {index + 1} of {m.questionIds.length}
            <ChevronRight size={14} />
          </button>
          <div>
            <Button
              variant="secondary"
              size="small"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <ChevronLeft size={15} />
              Back
            </Button>
            {index < m.questionIds.length - 1 ? (
              <Button size="small" onClick={() => setIndex(index + 1)}>
                Next
                <ChevronRight size={15} />
              </Button>
            ) : (
              <Button size="small" onClick={() => setModal("submit")}>
                Review & submit
              </Button>
            )}
          </div>
        </footer>
      </section>
      <Modal
        open={modal === "navigator"}
        onOpenChange={(o) => !o && setModal("")}
        title="Question navigator"
        description="Move freely within this module. A flag means marked for review."
      >
        <div className="navigator-grid">
          {m.questionIds.map((qid, i) => (
            <button
              key={qid}
              className={
                (i === index ? "current " : "") +
                (m.answers[qid] ? "answered " : "")
              }
              aria-label={`Question ${i + 1}${m.answers[qid] ? ", answered" : ", unanswered"}${m.flags.includes(qid) ? ", marked for review" : ""}`}
              onClick={() => {
                setIndex(i);
                setModal("");
              }}
            >
              {i + 1}
              {m.flags.includes(qid) && <Flag size={10} />}
            </button>
          ))}
        </div>
        <Button onClick={() => setModal("submit")}>End this module</Button>
      </Modal>
      <Modal
        open={modal === "submit"}
        onOpenChange={(o) => !o && setModal("")}
        title="Ready to submit this module?"
        description="Submission locks your answers. You will not be able to return to change this module."
      >
        <p>
          {m.questionIds.filter((id) => !m.answers[id]).length} unanswered ·{" "}
          {m.flags.length} marked for review
        </p>
        <div className="summary-actions">
          <Button variant="secondary" onClick={() => setModal("navigator")}>
            Return to review
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Submit & lock module"}
          </Button>
        </div>
      </Modal>
      <Modal
        open={modal === "reference"}
        onOpenChange={(o) => !o && setModal("")}
        title="Math reference"
        description="An original reference sheet with common geometry relationships."
      >
        <div className="formula-list">
          {[
            "Circle: $A=\\pi r^2$, $C=2\\pi r$",
            "Triangle: $A=\\frac{1}{2}bh$",
            "Right triangle: $a^2+b^2=c^2$",
            "Cylinder: $V=\\pi r^2h$",
            "Sphere: $V=\\frac{4}{3}\\pi r^3$",
            "Rectangular prism: $V=lwh$",
            "Trigonometry: $\\sin\\theta=\\frac{opposite}{hypotenuse}$",
            "$\\cos\\theta=\\frac{adjacent}{hypotenuse}$, $\\tan\\theta=\\frac{opposite}{adjacent}$",
          ].map((x) => (
            <p key={x}>
              <MathText text={x} />
            </p>
          ))}
        </div>
      </Modal>
      <Modal
        open={modal === "calculator"}
        onOpenChange={(o) => !o && setModal("")}
        title="Basic calculator"
        description="Arithmetic only. This is not a Desmos integration."
      >
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            try {
              setCalcResult(String(calculate(calc)));
            } catch (err) {
              setCalcResult((err as Error).message);
            }
          }}
        >
          <label>
            Expression
            <input
              value={calc}
              onChange={(event) => setCalc(event.target.value)}
              placeholder="(12 + 8) / 5"
            />
          </label>
          <output className="calc-output">{calcResult || "—"}</output>
          <Button type="submit">Calculate</Button>
        </form>
        <a
          href="https://www.desmos.com/calculator"
          target="_blank"
          rel="noopener noreferrer"
          className="text-button external-calculator"
        >
          Open Desmos separately
          <ExternalLink size={13} />
        </a>
      </Modal>
    </>
  );
}
function ContentStudio({
  state: s,
  refresh,
  notify,
}: {
  state: AppState;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [token, setToken] = useState(""),
    [reviewer, setReviewer] = useState(""),
    [notes, setNotes] = useState(""),
    [filter, setFilter] = useState(""),
    [offset, setOffset] = useState(0),
    [generationVersion, setGenerationVersion] = useState(""),
    [data, setData] = useState<{
      questions: (PublicQuestion & {
        correctAnswer: string;
        explanation: string;
        steps: string[];
      } & Pick<
          Question,
          | "answerEvidence"
          | "qualityMetadata"
          | "distractorExplanations"
          | "alignment"
        >)[];
      reports: {
        id: string;
        question_id: string;
        message: string;
        created_at: string;
      }[];
    } | null>(null),
    [selected, setSelected] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const fetchQueue = async (
    at = offset,
    sk = filter,
    version = generationVersion,
  ) => {
    setBusy(true);
    setError("");
    try {
      const d = await api<NonNullable<typeof data>>(
        "admin?" +
          new URLSearchParams({ skill: sk, offset: String(at), version }),
        undefined,
        { "x-admin-token": token },
      );
      setData(d);
      setSelected(0);
      setOffset(at);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const review = async (action: string) => {
    const q = data?.questions[selected];
    if (!q) return;
    setError("");
    setBusy(true);
    try {
      await api(
        "admin/review",
        { questionId: q.id, action, reviewer, notes },
        { "x-admin-token": token },
      );
      await fetchQueue();
      await refresh();
      notify("Editorial decision saved with an audit record.");
      setNotes("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const q = data?.questions[selected];
  return (
    <>
      <PageHeading
        title="Quality before quantity."
        description="Real inventory. Visible review gates. A release has to earn its place."
      />
      <div className="inventory-grid">
        {[
          ["Generated", s.inventory.generated],
          ["Automated checks passed", s.inventory.validated],
          ["Human-approved", s.inventory.approved],
          ["Published", s.inventory.published],
          ["Rejected", s.inventory.rejected],
          ["Distinct families", s.inventory.families],
        ].map(([l, v]) => (
          <div key={l}>
            <span>{l}</span>
            <strong>{Number(v).toLocaleString()}</strong>
          </div>
        ))}
      </div>
      <section className="publication-panel">
        <div>
          <span className="round-icon">
            <FileText size={23} />
          </span>
          <h2>{s.inventory.published.toLocaleString()} of 10,000 published</h2>
          <p>
            A generated candidate is not a finished educational item. All{" "}
            {s.inventory.generated.toLocaleString()} candidates are tracked
            separately from the publication target.
          </p>
        </div>
        <div className="publication-meter">
          <div className="progress-track">
            <div style={{ width: pct(s.inventory.published / 10000) }} />
          </div>
          <span>
            {s.inventory.math.toLocaleString()} Math candidates ·{" "}
            {s.inventory.rw} Reading & Writing candidates
          </span>
          <span>
            Provisional difficulty estimates only. No empirically calibrated
            items.
          </span>
        </div>
      </section>
      <div className="content-rules">
        <div>
          <CheckCircle2 size={17} />
          <span>Deterministic seeds & provenance</span>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Exact mathematical checks</span>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Family clusters reported separately</span>
        </div>
        <div>
          <CheckCircle2 size={17} />
          <span>Human review required to publish</span>
        </div>
      </div>
      <section className="section">
        <div className="section-header">
          <h2>Editorial workspace</h2>
          <Tag>Restricted access</Tag>
        </div>
        {!data ? (
          <div className="admin-unlock">
            <span className="round-icon">
              <Layers3 size={23} />
            </span>
            <h3>A deliberate pause before publication.</h3>
            <p>
              The review queue contains answer keys. Enter the administrator
              token configured on this local server to inspect candidates,
              annotate decisions, and approve individual questions.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void fetchQueue(0);
              }}
            >
              <label>
                Administrator token
                <input
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? "Opening…" : "Open review queue"}
              </Button>
            </form>
          </div>
        ) : (
          <>
            <div className="editor-controls">
              <label>
                Skill
                <select
                  aria-label="Editorial skill"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    void fetchQueue(0, e.target.value);
                  }}
                >
                  <option value="">All skills</option>
                  {s.skills.map((sk) => (
                    <option value={sk.id} key={sk.id}>
                      {sk.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Generation batch
                <select
                  value={generationVersion}
                  onChange={(event) => {
                    setGenerationVersion(event.target.value);
                    void fetchQueue(0, filter, event.target.value);
                  }}
                >
                  <option value="">All generations</option>
                  <option value="2.0.0">Evidence-mapped expansion</option>
                  <option value="1.0.0">Original pilot</option>
                </select>
              </label>
              <Button
                variant="secondary"
                size="small"
                disabled={offset === 0 || busy}
                onClick={() => fetchQueue(Math.max(0, offset - 50))}
              >
                Previous batch
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={data.questions.length < 50 || busy}
                onClick={() => fetchQueue(offset + 50)}
              >
                Next batch
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => {
                  setData(null);
                  setToken("");
                }}
              >
                Lock workspace
              </Button>
            </div>
            {q ? (
              <div className="editor-layout">
                <div className="editor-queue">
                  {data.questions.map((q, i) => (
                    <button
                      key={q.id}
                      className={selected === i ? "selected" : ""}
                      onClick={() => setSelected(i)}
                    >
                      <span>{q.id}</span>
                      <small>
                        {q.editorialStatus} · {q.publicationStatus}
                      </small>
                    </button>
                  ))}
                </div>
                <article className="editor-question">
                  <Tag>
                    {q.editorialStatus} · {q.publicationStatus}
                  </Tag>
                  {q.passage && (
                    <p className="passage-text">
                      <MathText text={q.passage} />
                    </p>
                  )}
                  <h3>
                    <MathText text={q.stem} />
                  </h3>
                  {q.table && (
                    <table className="question-table">
                      <thead>
                        <tr>
                          {q.table.headers.map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q.table.rows.map((r, i) => (
                          <tr key={i}>
                            {r.map((x, j) => (
                              <td key={j}>{x}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {q.diagram && <Figure figure={q.diagram} />}
                  <ol type="A">
                    {q.options.map((o) => (
                      <li key={o}>
                        <MathText text={o} />
                      </li>
                    ))}
                  </ol>
                  <p>
                    <strong>Key:</strong> <MathText text={q.correctAnswer} />
                  </p>
                  <p>
                    <MathText text={q.explanation} />
                  </p>
                  {q.answerEvidence && (
                    <details open>
                      <summary>Passage evidence for review</summary>
                      {q.answerEvidence.quotes.map((quote) => (
                        <blockquote key={quote}>{quote}</blockquote>
                      ))}
                      <p>{q.answerEvidence.reasoning}</p>
                    </details>
                  )}
                  {q.qualityMetadata && (
                    <details>
                      <summary>Difficulty basis & review flags</summary>
                      <p>
                        Provisional reasoning demands:{" "}
                        {q.qualityMetadata.difficultyBasis.join(" · ")}
                      </p>
                      <p>
                        Review required:{" "}
                        {q.qualityMetadata.reviewFlags.join(" · ")}
                      </p>
                      {q.alignment && (
                        <p>
                          <a
                            href={q.alignment.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Official task reference
                          </a>{" "}
                          · {q.alignment.frameworkVersion}. {q.alignment.basis}.
                        </p>
                      )}
                    </details>
                  )}
                  {q.distractorExplanations && (
                    <details>
                      <summary>Option-by-option rationale</summary>
                      <ul>
                        {Object.entries(q.distractorExplanations).map(
                          ([option, reason]) => (
                            <li key={option}>
                              <strong>
                                <MathText text={option} />
                              </strong>
                              : <MathText text={reason} />
                            </li>
                          ),
                        )}
                      </ul>
                    </details>
                  )}
                  <details>
                    <summary>Provenance & cluster</summary>
                    <p>
                      Family: {q.family} · Seed: {q.seed}
                      <br />
                      Cluster: {q.similarityCluster}
                      <br />
                      Hash: {q.contentHash}
                    </p>
                  </details>
                  <label>
                    Named human reviewer
                    <input
                      value={reviewer}
                      onChange={(e) => setReviewer(e.target.value)}
                      minLength={3}
                    />
                  </label>
                  <label>
                    Review notes
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      minLength={15}
                      placeholder="Record the answer verification, ambiguity review, distractor quality, and any concerns."
                    />
                  </label>
                  <div className="editor-actions">
                    <Button
                      onClick={() => review("approve")}
                      disabled={
                        busy || reviewer.length < 3 || notes.length < 15
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => review("reject")}
                      disabled={
                        busy || reviewer.length < 3 || notes.length < 15
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        review(
                          q.publicationStatus === "published"
                            ? "unpublish"
                            : "publish",
                        )
                      }
                      disabled={
                        busy ||
                        q.editorialStatus !== "approved" ||
                        reviewer.length < 3 ||
                        notes.length < 15
                      }
                    >
                      {q.publicationStatus === "published"
                        ? "Unpublish"
                        : "Publish approved item"}
                    </Button>
                  </div>
                </article>
              </div>
            ) : (
              <p>No candidates match this filter.</p>
            )}
            <h3>Student reports</h3>
            {data.reports.length ? (
              data.reports.map((r) => (
                <div className="report-row" key={r.id}>
                  <strong>{r.question_id}</strong>
                  <p>{r.message}</p>
                  <small>{date(r.created_at)}</small>
                </div>
              ))
            ) : (
              <p className="muted">No reports submitted.</p>
            )}
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    </>
  );
}
function SettingsModal({
  open,
  restoreFocus,
  close,
  state: s,
  refresh,
  notify,
}: {
  open: boolean;
  restoreFocus?: () => void;
  close: () => void;
  state: AppState;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [prefs, setPrefs] = useState(s.preferences),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setPrefs(s.preferences);
  }, [s.preferences, open]);
  return (
    <Modal
      restoreFocus={restoreFocus}
      open={open}
      onOpenChange={(o) => !o && close()}
      title="A plan that fits your life"
      description="These are your goals, not predictions. Change them whenever you need to."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("preferences", prefs);
            await refresh();
            close();
            notify("Your goals and study rhythm are saved.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-row">
          <label>
            Target SAT date
            <input
              type="date"
              value={prefs.testDate}
              onChange={(e) => setPrefs({ ...prefs, testDate: e.target.value })}
            />
          </label>
          <label>
            Target score
            <input
              type="number"
              min={400}
              max={1600}
              step={10}
              value={prefs.targetScore}
              onChange={(e) =>
                setPrefs({ ...prefs, targetScore: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <label>
          Minutes available per week
          <input
            type="number"
            min={30}
            max={1800}
            step={10}
            value={prefs.weeklyMinutes}
            onChange={(e) =>
              setPrefs({ ...prefs, weeklyMinutes: Number(e.target.value) })
            }
          />
        </label>
        <fieldset>
          <legend>Preferred study days</legend>
          <div className="day-picker">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <button
                type="button"
                aria-pressed={prefs.days.includes(i)}
                key={d}
                className={prefs.days.includes(i) ? "selected" : ""}
                onClick={() =>
                  setPrefs({
                    ...prefs,
                    days: prefs.days.includes(i)
                      ? prefs.days.filter((d) => d !== i)
                      : [...prefs.days, i],
                  })
                }
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !prefs.days.length}>
          {busy ? "Saving…" : "Save your plan"}
        </Button>
      </form>
    </Modal>
  );
}
function AccountModal({
  open,
  restoreFocus,
  close,
  state: s,
  refresh,
  notify,
}: {
  open: boolean;
  restoreFocus?: () => void;
  close: () => void;
  state: AppState;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [mode, setMode] = useState<"register" | "login">("register"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false),
    [confirmation, setConfirmation] = useState("");
  return (
    <Modal
      restoreFocus={restoreFocus}
      open={open}
      onOpenChange={(o) => !o && close()}
      title={
        deleting
          ? "Delete your workspace?"
          : s.user.guest
            ? "Keep your learning together."
            : "Your account"
      }
      description={
        deleting
          ? "This deletes your account, saved attempts, preferences, notes, bookmarks, and assessment sessions from this server."
          : s.user.guest
            ? "Your guest work is already saved on this server. A local account lets you sign back in."
            : "You control your learning data."
      }
    >
      {!deleting ? (
        <>
          {s.user.guest ? (
            <>
              <div className="section-toggle">
                <button
                  className={mode === "register" ? "selected" : ""}
                  onClick={() => setMode("register")}
                >
                  Create an account
                </button>
                <button
                  className={mode === "login" ? "selected" : ""}
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    await api("auth", { mode, email, password });
                    await refresh();
                    close();
                    notify(
                      mode === "register"
                        ? "Local account created. Your guest history is preserved."
                        : "Signed in.",
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
                <label>
                  Password
                  <input
                    aria-label="Password"
                    type="password"
                    required
                    minLength={10}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                  />
                  <small>At least 10 characters.</small>
                </label>
                <Button disabled={busy} type="submit">
                  {busy
                    ? "Working…"
                    : mode === "register"
                      ? "Create local account"
                      : "Sign in"}
                </Button>
              </form>
              <p className="evidence-note">
                Local development accounts use hashed passwords and server
                sessions. Hosted authentication, email verification, password
                recovery, and cloud sync are not configured.
              </p>
            </>
          ) : (
            <>
              <p className="account-email">{s.user.email}</p>
              <Button
                variant="secondary"
                onClick={async () => {
                  await api("logout", {});
                  await api("session", {});
                  await refresh();
                  close();
                  notify("Signed out. A new guest workspace is open.");
                }}
              >
                <LogOut size={15} />
                Sign out
              </Button>
            </>
          )}
          <div className="privacy-note">
            <strong>Your work stays yours.</strong>
            <p>
              No advertising trackers. No public profile. No collection of
              school, birthday, or real name. Optional free-text notes may
              contain personal information, so add only what you need.
            </p>
          </div>
          <button
            className="text-button danger-text"
            onClick={() => setDeleting(true)}
          >
            Delete this workspace
          </button>
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("delete-account", { confirmation });
              await api("session", {});
              await refresh();
              setDeleting(false);
              close();
              notify("Workspace and associated learning records deleted.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Type DELETE to confirm
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <Button
            type="submit"
            variant="danger"
            disabled={confirmation !== "DELETE" || busy}
          >
            Delete permanently
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </Modal>
  );
}
function Welcome({
  onStart,
  onPractice,
}: {
  onStart: () => void;
  onPractice: () => void;
}) {
  return (
    <div className="welcome-page">
      <header>
        <Logo />
        <button className="text-button" onClick={onStart}>
          Your workspace
          <ArrowUpRight size={15} />
        </button>
      </header>
      <main>
        <Tag tone="green">Independent. Open. Completely free.</Tag>
        <h1>
          A clearer path
          <br />
          to test day.
        </h1>
        <p>
          Understand the question. Learn from the mistake. Find the next right
          step. A thoughtful space for the work of SAT preparation.
        </p>
        <div className="summary-actions">
          <Button onClick={onStart}>
            Open your workspace
            <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" onClick={onPractice}>
            Explore practice
          </Button>
        </div>
        <div className="welcome-principles">
          <article>
            <BookOpen size={22} />
            <h2>Practice that has a purpose.</h2>
            <p>
              Original SAT-style content, explicit review standards, and
              explanations that make the reasoning visible.
            </p>
          </article>
          <article>
            <ChartNoAxesCombined size={22} />
            <h2>Progress grounded in evidence.</h2>
            <p>
              Recommendations use actual independent answers. We show
              uncertainty instead of inventing a score.
            </p>
          </article>
          <article>
            <GraduationCap size={22} />
            <h2>The essentials stay free.</h2>
            <p>
              Practice, explanations, study planning, and skill analytics. No
              premium question categories or paywalls.
            </p>
          </article>
        </div>
        <section className="welcome-transparency">
          <h2>A work in progress, honestly presented.</h2>
          <p>
            This local preview includes a functioning question pipeline and
            practice workspace. Generated candidates require human editorial
            review before publication. Public full-length forms, independently
            calibrated models, hosted AI, and cloud authentication are not
            released.
          </p>
          <Link href="/content" className="text-button">
            See the real inventory
            <ArrowUpRight size={14} />
          </Link>
        </section>
      </main>
      <footer>
        Aptmark is independent of College Board. SAT is a trademark of College
        Board.
      </footer>
    </div>
  );
}
