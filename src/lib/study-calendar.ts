import { createHash } from "node:crypto";
import type { Skill } from "./types";
export type CalendarStudyDay = {
  date: string;
  skill: Pick<Skill, "id" | "name" | "section">;
  minutes: number;
  count: number;
  reason: string;
};
// RFC 5545 TEXT encoding. Control characters cannot inject a new property.
export function calendarText(text: string) {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
// Fold on Unicode code-point boundaries, with a maximum of 75 UTF-8 octets.
export function foldCalendarLine(line: string) {
  const result: string[] = [];
  let current = "",
    bytes = 0;
  for (const character of line) {
    const size = Buffer.byteLength(character, "utf8");
    if (bytes + size > 75) {
      result.push(current);
      current = " ";
      bytes = 1;
    }
    current += character;
    bytes += size;
  }
  result.push(current);
  return result.join("\r\n");
}
function dateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error("Invalid study date.");
  const date = new Date(value + "T00:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw Error("Invalid study date.");
  return date;
}
export function studyCalendar(
  days: CalendarStudyDay[],
  owner: string,
  at = new Date(),
) {
  if (days.length > 100 || !Number.isFinite(at.getTime()))
    throw Error("Invalid calendar input.");
  const stamp = at
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aptmark//Study Plan//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const day of days) {
    const start = dateValue(day.date),
      end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const uid = createHash("sha256")
      .update(JSON.stringify([owner, day.date, day.skill.id]))
      .digest("hex");
    const practice = `/practice?section=${day.skill.section}&skill=${encodeURIComponent(day.skill.id)}&count=${Math.min(20, day.count)}`;
    const description = `${day.minutes} minutes • ${day.count} suggested questions\n${day.reason}\nOpen Aptmark and go to ${practice}\nOne-time plan export. This is an all-day study reminder, not a timed appointment or live calendar subscription.`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}@aptmark.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`,
      `SUMMARY:${calendarText("Study: " + day.skill.name)}`,
      `DESCRIPTION:${calendarText(description)}`,
      "TRANSP:TRANSPARENT",
      "CLASS:PRIVATE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldCalendarLine).join("\r\n") + "\r\n";
}
