import { describe, expect, it } from "vitest";
import {
  calendarText,
  foldCalendarLine,
  studyCalendar,
  type CalendarStudyDay,
} from "../src/lib/study-calendar";
const day: CalendarStudyDay = {
  date: "2026-12-31",
  skill: { id: "linear-one", name: "One-variable equations", section: "math" },
  minutes: 40,
  count: 28,
  reason: "Build evidence from an unfamiliar skill.",
};
const at = new Date("2026-10-18T18:30:00Z");
const unfold = (value: string) => value.replace(/\r\n /g, "");
describe("portable study-plan calendar", () => {
  it("exports date-only reminders with an exclusive next-day end across a year boundary", () => {
    const output = unfold(studyCalendar([day], "test-owner", at));
    expect(output).toContain(
      "DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101",
    );
    expect(output).toContain("DTSTAMP:20261018T183000Z");
    expect(output).toContain("TRANSP:TRANSPARENT\r\nCLASS:PRIVATE");
    expect(output).toContain("40 minutes • 28 suggested questions");
    expect(output).toContain("count=20");
    expect(output.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(output).not.toContain("BEGIN:VALARM");
  });
  it("uses stable account-scoped event identities without exposing account identifiers", () => {
    const getUid = (value: string) =>
      unfold(value)
        .split("\r\n")
        .find((line) => line.startsWith("UID:"));
    const first = studyCalendar([day], "private-owner", at);
    expect(getUid(first)).toBe(
      getUid(studyCalendar([day], "private-owner", new Date("2026-10-19"))),
    );
    expect(getUid(first)).not.toBe(
      getUid(studyCalendar([day], "different-owner", at)),
    );
    expect(first).not.toContain("private-owner");
  });
  it("escapes text delimiters and newlines instead of allowing new properties", () => {
    expect(calendarText("one,two;three\\four\r\nBEGIN:VEVENT\u0000")).toBe(
      "one\\,two\\;three\\\\four\\nBEGIN:VEVENT",
    );
    const output = unfold(
      studyCalendar(
        [{ ...day, skill: { ...day.skill, name: "Title\nBEGIN:VEVENT" } }],
        "owner",
        at,
      ),
    );
    expect(
      output.split("\r\n").filter((line) => line === "BEGIN:VEVENT"),
    ).toHaveLength(1);
  });
  it("folds long Unicode text without breaking code points or exceeding 75 octets", () => {
    const input = "DESCRIPTION:" + "Study 🧭 é 中文 ".repeat(30);
    const output = foldCalendarLine(input);
    for (const line of output.split("\r\n"))
      expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(unfold(output)).toBe(input);
    expect(output).not.toContain("�");
  });
  it("rejects invalid dates, invalid timestamps and unbounded exports", () => {
    for (const date of ["2026-02-29", "2026-13-01", "not-a-date"])
      expect(() => studyCalendar([{ ...day, date }], "owner", at)).toThrow(
        "study date",
      );
    expect(() =>
      studyCalendar(
        Array.from({ length: 101 }, () => day),
        "owner",
        at,
      ),
    ).toThrow("calendar input");
    expect(() => studyCalendar([], "owner", new Date("bad"))).toThrow(
      "calendar input",
    );
    expect(studyCalendar([], "owner", at)).not.toContain("BEGIN:VEVENT");
  });
});
