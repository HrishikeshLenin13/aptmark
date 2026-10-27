import {it as test} from 'vitest';
import assert from 'node:assert/strict';
import {calendarText,foldCalendarLine,studyCalendar} from '../src/lib/study-calendar';
const stamp=new Date('2026-10-27T12:00:00Z');
const sample={date:'2026-10-27',skill:{id:'algebra',name:'Algebra',section:'math' as const},minutes:20,count:5,reason:'Practice'};

test("calendar-text-nul", () => {
assert.equal(calendarText("a\u0000b"),"ab");
});

test("calendar-text-backslash", () => {
assert.equal(calendarText("a\\b"),"a\\\\b");
});

test("calendar-text-semicolon", () => {
assert.equal(calendarText("a;b"),"a\\;b");
});

test("calendar-text-comma", () => {
assert.equal(calendarText("a,b"),"a\\,b");
});

test("calendar-text-lf", () => {
assert.equal(calendarText("a\nb"),"a\\nb");
});

test("calendar-text-cr", () => {
assert.equal(calendarText("a\rb"),"a\\nb");
});

test("calendar-text-crlf", () => {
assert.equal(calendarText("a\r\nb"),"a\\nb");
});

test("calendar-text-delete", () => {
assert.equal(calendarText("a\u007fb"),"ab");
});

test("calendar-text-control", () => {
assert.equal(calendarText("a\u001fb"),"ab");
});

test("calendar-text-bell", () => {
assert.equal(calendarText("a\u0007b"),"ab");
});

test("calendar-text-tab", () => {
assert.equal(calendarText("a\tb"),"a\tb");
});

test("calendar-text-unicode", () => {
assert.equal(calendarText("\u6570\u5b66 \ud83d\udcda"),"\u6570\u5b66 \ud83d\udcda");
});

test("calendar-text-mixed", () => {
assert.equal(calendarText("a\\;\nb"),"a\\\\\\;\\nb");
});

test("calendar-text-empty", () => {
assert.equal(calendarText(""),"");
});

test("calendar-text-injection", () => {
assert.equal(calendarText("x\r\nBEGIN:VEVENT"),"x\\nBEGIN:VEVENT");
});

test("utf8-fold-ascii-74", () => {
const source="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-ascii-75", () => {
const source="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-ascii-76", () => {
const source="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-ascii-149", () => {
const source="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-ascii-150", () => {
const source="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-two-byte-74", () => {
const source="\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-two-byte-76", () => {
const source="\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-three-byte-75", () => {
const source="\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-three-byte-78", () => {
const source="\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66\u5b66";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});
