"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { Modal } from "./ui/dialog";
import type { Skill } from "@/lib/types";
const pages = [
  {
    title: "Pacing lab",
    description: "Configurable timed sets and saved review",
    href: "/drills",
  },
  {
    title: "Learning center",
    description: "Short lessons, worked examples and understanding checks",
    href: "/learn",
  },
  {
    title: "Overview",
    description: "Your next step and study activity",
    href: "/",
  },
  {
    title: "Question bank",
    description: "Build a focused practice set",
    href: "/practice",
  },
  {
    title: "Study plan",
    description: "Your weekly learning schedule",
    href: "/planner",
  },
  {
    title: "Your progress",
    description: "Accuracy, pacing and skill evidence",
    href: "/analytics",
  },
  {
    title: "Mistake studio",
    description: "Revisit mistakes and test your recovery",
    href: "/mistakes",
  },
  {
    title: "Practice tests",
    description: "Diagnostics and timed assessment previews",
    href: "/tests",
  },
  {
    title: "Saved questions",
    description: "Practice your bookmarked questions",
    href: "/practice?mode=bookmarks&count=8",
  },
];
export function WorkspaceSearch({
  open,
  close,
  skills,
  restoreFocus,
}: {
  open: boolean;
  close: () => void;
  skills: Skill[];
  restoreFocus: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const normalized = query.trim().toLowerCase();
  const routes = pages.filter((p) =>
    (p.title + " " + p.description).toLowerCase().includes(normalized),
  );
  const matchingSkills = skills
    .filter((s) => (s.name + " " + s.domain).toLowerCase().includes(normalized))
    .slice(0, normalized ? 12 : 4);
  return (
    <Modal
      restoreFocus={restoreFocus}
      focusOnOpen={() => searchInput.current?.focus()}
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          close();
          setQuery("");
        }
      }}
      title="Find your next step"
      description="Search your workspace or jump straight into a skill."
    >
      <div className="workspace-search">
        <label htmlFor="workspace-query">Search pages and skills</label>
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            ref={searchInput}
            id="workspace-query"
            type="search"
            placeholder="Try algebra, bookmarks, or study plan"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <p className="search-result-count" role="status">
          {routes.length + matchingSkills.length} results
        </p>
        {!routes.length && !matchingSkills.length && (
          <div className="search-empty">
            <BookOpen size={24} />
            <h3>No match yet</h3>
            <p>Try a skill name, subject, or one of the workspace pages.</p>
            <button className="text-button" onClick={() => setQuery("")}>
              Clear search
            </button>
          </div>
        )}
        {routes.length > 0 && (
          <section aria-label="Workspace pages">
            <h3>Workspace</h3>
            <ul>
              {routes.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    onClick={() => {
                      close();
                      setQuery("");
                    }}
                  >
                    <span>
                      <strong>{p.title}</strong>
                      <small>{p.description}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {matchingSkills.length > 0 && (
          <section aria-label="Practice skills">
            <h3>Practice a skill</h3>
            <ul>
              {matchingSkills.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/practice?skill=${s.id}&section=${s.section}&count=5`}
                    onClick={() => {
                      close();
                      setQuery("");
                    }}
                  >
                    <span>
                      <strong>{s.name}</strong>
                      <small>{s.domain}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}
