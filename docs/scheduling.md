# Scheduling and date semantics

The subtle part of this codebase. All of it lives in
[src/utils/dates.js](../src/utils/dates.js) and is covered by
[test/dates.test.js](../test/dates.test.js).

## The two jobs

[src/scheduler/cronJobs.js](../src/scheduler/cronJobs.js)

| Cron | Timezone | Job |
| --- | --- | --- |
| `0 13 * * *` | `BOT_TIMEZONE` | `checkAndSendMessages()` — birthdays and anniversaries |
| `0 13 * * 4` | `BOT_TIMEZONE` | `sendWatercoolerQuestion()` — Thursday question |

Both run with `noOverlap: true`. Each job talks to Mongo and Slack over the network;
without the guard a slow run could be re-entered by the next tick and post twice.

`node-cron` v4 dropped the v3 `scheduled: true` option — it is silently ignored.
Tasks start automatically on `schedule()`.

## The timezone rule

> **Stored dates are read in UTC. "Today" is read in `BOT_TIMEZONE`. The server's
> own `TZ` never enters into it.**

Dates land in Mongo as UTC midnight (`new Date("1990-05-15")` →
`1990-05-15T00:00:00Z`). Reading that back with the local getters `getMonth()` /
`getDate()` returns **May 14** on every machine west of UTC:

```
TZ=UTC              new Date("1990-05-15").getDate()  ->  15
TZ=America/New_York new Date("1990-05-15").getDate()  ->  14   ← every birthday a day early
```

So `fallsOn()` uses `getUTCMonth()` / `getUTCDate()`, and `zonedParts()` derives
today's calendar fields through `Intl.DateTimeFormat` in `BOT_TIMEZONE` rather than
from the server clock. The bot behaves identically on a UTC dyno, a laptop in
Montevideo, and a container with `TZ` unset.

## Which days get checked

`getDatesToCheck(today)` returns the list of dates the run should announce.

| Day it runs | Dates announced |
| --- | --- |
| Mon–Thu | Today |
| Friday | Today, Saturday, Sunday |
| Sat / Sun | Nothing — returns `[]`, the run exits early |

Nobody reads Slack on a weekend, so Friday's run covers it, with wording that shifts
to a look-ahead: *"It's @Ada's birthday this Saturday!"* rather than *"Wish @Ada a
Happy Birthday!"*.

The Friday look-ahead is computed with `Date.UTC(year, month - 1, day + offset)`,
which rolls over month and year boundaries for free — Friday 31 Dec 2027 correctly
announces Saturday 1 Jan 2028.

## Two edge cases that are handled

**February 29.** A birthday on the 29th would fire only once every four years. In a
common year, `getDatesToCheck` adds a synthetic `Feb 29` entry alongside `Feb 28`, so
leap-day birthdays are celebrated on the 28th. In a leap year no entry is added,
because the real date arrives on its own.

**Anniversary years across a year boundary.** The count is `announcedYear -
storedYear`, not `todayYear - storedYear`. On Friday 31 Dec 2027 announcing a
1 Jan 2020 anniversary for Saturday, that is **8 years**, not 7. Anniversaries with a
count below 1 are skipped, so nobody gets a "0 year work anniversary" on their start
date.

## Known limitations

- **Two processes post twice.** Nothing records that a message was already sent, so
  running more than one instance duplicates every celebration. Run exactly one dyno.
  Fixing it properly means a sent-log collection keyed on `(userId, date, kind)`.
- **A missed run is a missed day.** If the process is down at 1:00 PM, that day's
  celebrations never go out. There is no catch-up on restart.
- **Someone hired on a Saturday** whose anniversary later falls on a Saturday is
  announced by Friday's look-ahead as usual — no issue, noted only because the
  first-year skip (`years < 1`) uses the announced date, not the hire date.
