const test = require("node:test");
const assert = require("node:assert/strict");

const {
  fallsOn,
  getDatesToCheck,
  parseDateOnly,
  yearsSince,
  zonedParts,
} = require("../src/utils/dates");

test("stored dates are read in UTC, not server-local time", () => {
  // The bug this guards: local getters report May 14 for this value in any
  // timezone west of UTC, so half the office never gets a birthday message.
  const birthday = new Date("1990-05-15");
  assert.ok(fallsOn(birthday, { month: 5, day: 15 }));
  assert.ok(!fallsOn(birthday, { month: 5, day: 14 }));
});

test("zonedParts reads the calendar day in the bot timezone", () => {
  // 2026-01-01T02:00Z is still Dec 31 in New York.
  const parts = zonedParts(new Date("2026-01-01T02:00:00Z"), "America/New_York");
  assert.deepEqual(parts, { year: 2025, month: 12, day: 31, weekday: 3 });
});

test("parseDateOnly rejects junk and impossible calendar dates", () => {
  assert.equal(parseDateOnly("2024-02-31"), null);
  assert.equal(parseDateOnly("1990-13-01"), null);
  assert.equal(parseDateOnly("15/05/1990"), null);
  assert.equal(parseDateOnly(""), null);
  assert.equal(parseDateOnly(undefined), null);
  assert.equal(parseDateOnly("1990-05-15").toISOString(), "1990-05-15T00:00:00.000Z");
});

test("weekdays check only today", () => {
  const wednesday = { year: 2026, month: 8, day: 26, weekday: 3 };
  assert.deepEqual(getDatesToCheck(wednesday), [
    { year: 2026, month: 8, day: 26, isWeekend: false, dayName: "today" },
  ]);
});

test("weekends are skipped entirely", () => {
  assert.deepEqual(getDatesToCheck({ year: 2026, month: 8, day: 29, weekday: 6 }), []);
  assert.deepEqual(getDatesToCheck({ year: 2026, month: 8, day: 30, weekday: 0 }), []);
});

test("Friday also covers Saturday and Sunday", () => {
  const friday = { year: 2026, month: 8, day: 28, weekday: 5 };
  assert.deepEqual(getDatesToCheck(friday), [
    { year: 2026, month: 8, day: 28, isWeekend: false, dayName: "today" },
    { year: 2026, month: 8, day: 29, isWeekend: true, dayName: "Saturday" },
    { year: 2026, month: 8, day: 30, isWeekend: true, dayName: "Sunday" },
  ]);
});

test("Friday lookahead rolls over month and year boundaries", () => {
  const newYearsEve = { year: 2027, month: 12, day: 31, weekday: 5 };
  assert.deepEqual(getDatesToCheck(newYearsEve).map((d) => [d.year, d.month, d.day]), [
    [2027, 12, 31],
    [2028, 1, 1],
    [2028, 1, 2],
  ]);
});

test("Feb 29 celebrations fall back to Feb 28 in a common year", () => {
  const commonYear = getDatesToCheck({ year: 2027, month: 2, day: 28, weekday: 1 });
  assert.deepEqual(commonYear.map((d) => d.day), [28, 29]);

  const leapYear = getDatesToCheck({ year: 2028, month: 2, day: 28, weekday: 1 });
  assert.deepEqual(leapYear.map((d) => d.day), [28]);
});

test("anniversary years count against the announced date, not today", () => {
  const anniversary = new Date("2020-01-01");
  // Announced on Friday Dec 31 2027 for Saturday Jan 1 2028 -> 8 years, not 7.
  assert.equal(yearsSince(anniversary, { year: 2028 }), 8);
});
