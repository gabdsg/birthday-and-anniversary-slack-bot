// Celebration dates are stored as UTC midnight (`new Date("1990-05-15")`), so they
// must be READ with UTC getters -- local getters report the previous day on any
// server west of UTC. "Today" is resolved in the bot's business timezone, which is
// the same timezone the cron schedule fires in.

const BOT_TIMEZONE = process.env.BOT_TIMEZONE || "America/New_York";

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const isLeapYear = (year) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** Calendar fields (1-based month, 0-based weekday) for `date` as seen in `timeZone`. */
function zonedParts(date = new Date(), timeZone = BOT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })
    .formatToParts(date)
    .reduce((acc, part) => ((acc[part.type] = part.value), acc), {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: SHORT_WEEKDAYS.indexOf(parts.weekday),
  };
}

/** Strict YYYY-MM-DD -> UTC midnight. Returns null for anything else. */
function parseDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC silently rolls 2024-02-31 into March; reject instead of shifting.
  if (date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return date;
}

/**
 * Dates the daily job should announce, given "today" in the bot timezone.
 * Empty on weekends: the job does not run then, so Friday covers Sat + Sun.
 */
function getDatesToCheck(today = zonedParts()) {
  if (today.weekday === 0 || today.weekday === 6) return [];

  const dates = [
    {
      year: today.year,
      month: today.month,
      day: today.day,
      isWeekend: false,
      dayName: "today",
    },
  ];

  if (today.weekday === 5) {
    for (const offset of [1, 2]) {
      const ahead = new Date(
        Date.UTC(today.year, today.month - 1, today.day + offset)
      );
      dates.push({
        year: ahead.getUTCFullYear(),
        month: ahead.getUTCMonth() + 1,
        day: ahead.getUTCDate(),
        isWeekend: true,
        dayName: WEEKDAYS[ahead.getUTCDay()],
      });
    }
  }

  // Feb 29 celebrations would never fire in a common year -- fold them into Feb 28.
  for (const date of [...dates]) {
    if (date.month === 2 && date.day === 28 && !isLeapYear(date.year)) {
      dates.push({ ...date, day: 29 });
    }
  }

  return dates;
}

/** True when a stored (UTC-midnight) date lands on the month/day being checked. */
function fallsOn(stored, { month, day }) {
  const date = new Date(stored);
  return date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

/** Whole years between a stored date and the date being announced. */
function yearsSince(stored, { year }) {
  return year - new Date(stored).getUTCFullYear();
}

module.exports = {
  BOT_TIMEZONE,
  fallsOn,
  getDatesToCheck,
  isLeapYear,
  parseDateOnly,
  yearsSince,
  zonedParts,
};
