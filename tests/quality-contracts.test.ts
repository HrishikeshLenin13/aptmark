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

test("utf8-fold-four-byte-72", () => {
const source="\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-four-byte-76", () => {
const source="\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda\ud83d\udcda";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-mixed", () => {
const source="SUMMARY:\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9\u5b66\ud83d\udcda\u00e9";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-empty", () => {
const source="";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-space", () => {
const source="                                                                                ";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("utf8-fold-combining", () => {
const source="e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301e\u0301";const result=foldCalendarLine(source);assert.equal(result.replace(/\r\n /g,''),source);for(const line of result.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);assert.equal(result.includes('�'),false);
});

test("all-day-end-2024-02-28", () => {
const day={...sample,date:"2024-02-28"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20240228"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20240229"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2024-02-29", () => {
const day={...sample,date:"2024-02-29"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20240229"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20240301"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2023-02-28", () => {
const day={...sample,date:"2023-02-28"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20230228"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20230301"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-1900-02-28", () => {
const day={...sample,date:"1900-02-28"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"19000228"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"19000301"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2000-02-29", () => {
const day={...sample,date:"2000-02-29"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20000229"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20000301"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2100-02-28", () => {
const day={...sample,date:"2100-02-28"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"21000228"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"21000301"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2026-12-31", () => {
const day={...sample,date:"2026-12-31"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20261231"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20270101"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2026-01-31", () => {
const day={...sample,date:"2026-01-31"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20260131"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20260201"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2026-04-30", () => {
const day={...sample,date:"2026-04-30"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20260430"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20260501"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2026-03-08", () => {
const day={...sample,date:"2026-03-08"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20260308"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20260309"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2026-11-01", () => {
const day={...sample,date:"2026-11-01"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20261101"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20261102"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-0001-01-01", () => {
const day={...sample,date:"0001-01-01"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"00010101"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"00010102"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-0099-12-31", () => {
const day={...sample,date:"0099-12-31"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"00991231"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"01000101"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2400-02-29", () => {
const day={...sample,date:"2400-02-29"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"24000229"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"24000301"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("all-day-end-2026-10-27", () => {
const day={...sample,date:"2026-10-27"};const output=studyCalendar([day],'owner',stamp).replace(/\r\n /g,'');assert.ok(output.includes('DTSTART;VALUE=DATE:'+"20261027"+'\r\n'));assert.ok(output.includes('DTEND;VALUE=DATE:'+"20261028"+'\r\n'));assert.ok(output.includes('CLASS:PRIVATE\r\n'));assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test("invalid-calendar-date-1", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2023-02-29"}],'owner',stamp));
});

test("invalid-calendar-date-2", () => {
assert.throws(()=>studyCalendar([{...sample,date:"1900-02-29"}],'owner',stamp));
});

test("invalid-calendar-date-3", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2100-02-29"}],'owner',stamp));
});

test("invalid-calendar-date-4", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-04-31"}],'owner',stamp));
});

test("invalid-calendar-date-5", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-00-01"}],'owner',stamp));
});

test("invalid-calendar-date-6", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-13-01"}],'owner',stamp));
});

test("invalid-calendar-date-7", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-01-00"}],'owner',stamp));
});

test("invalid-calendar-date-8", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-01-32"}],'owner',stamp));
});

test("invalid-calendar-date-9", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-1-01"}],'owner',stamp));
});

test("invalid-calendar-date-10", () => {
assert.throws(()=>studyCalendar([{...sample,date:"26-01-01"}],'owner',stamp));
});

test("invalid-calendar-date-11", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-01-01T00:00:00Z"}],'owner',stamp));
});

test("invalid-calendar-date-12", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026/01/01"}],'owner',stamp));
});

test("invalid-calendar-date-13", () => {
assert.throws(()=>studyCalendar([{...sample,date:" 2026-01-01"}],'owner',stamp));
});

test("invalid-calendar-date-14", () => {
assert.throws(()=>studyCalendar([{...sample,date:"2026-01-01\n"}],'owner',stamp));
});
