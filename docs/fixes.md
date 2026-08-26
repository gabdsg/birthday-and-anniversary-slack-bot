# Audit findings — August 2026

What a full read of the codebase turned up, and what was done about each item.
Grouped by severity. Every fix is in the working tree.

## Correctness bugs

### 1. Every date was read a day early outside UTC

`checkAndSendMessages` compared stored dates with `getMonth()` / `getDate()`, which
are **local-time** getters, while the values themselves are stored at UTC midnight.
On any server west of UTC that reports the previous day:

```
TZ=UTC              new Date("1990-05-15").getDate()  ->  15
TZ=America/New_York new Date("1990-05-15").getDate()  ->  14
```

It happened to work in production only because Heroku dynos run UTC. Setting `TZ` on
the dyno, or running locally, silently shifted every celebration by one day.

**Fix.** All date reasoning moved to [src/utils/dates.js](../src/utils/dates.js),
which reads stored values with UTC getters and derives "today" through
`Intl.DateTimeFormat` in `BOT_TIMEZONE`. The server's own `TZ` no longer matters.
Covered by [test/dates.test.js](../test/dates.test.js).

### 2. Anniversary counts were wrong across a year boundary

The year count was `today.getFullYear() - anniversary.getFullYear()`. Friday's run
also announces Saturday and Sunday, so on Friday 31 Dec 2027 a 1 Jan 2020
anniversary was announced as **7 years** instead of 8.

**Fix.** `yearsSince(stored, dateInfo)` counts against the date being announced.

### 3. February 29 birthdays fired once every four years

No fallback existed for leap-day dates.

**Fix.** In a common year `getDatesToCheck` adds a synthetic Feb 29 entry alongside
Feb 28. In a leap year it does not, because the real date arrives on its own.

### 4. `users.list` was never paginated

Two call sites fetched a single page and treated it as the whole workspace. Past the
first page, users simply could not be found — matching the symptom behind the
`fix error finding users` commit.

**Fix.** One `fetchAllSlackMembers()` helper loops on `response_metadata.next_cursor`
with `limit: 200`; both call sites now use it.

### 5. `/add-user` crashed on anyone previously removed

`/remove-user` soft-deletes, so the row keeps its `slackUserId`, which is uniquely
indexed. Re-adding that person threw a raw MongoDB duplicate key error at the admin.

**Fix.** `/add-user` looks for an existing row first and reactivates it, reporting
whether the user was added, reactivated, or already present.

### 6. A failed watercooler post still burned the question

`isUsed` was set regardless of whether Slack accepted the message, and `sendMessage`
swallowed its errors, so a failed send silently consumed a question forever.

**Fix.** `sendMessage` returns a boolean; the question is marked used only after a
confirmed post. When the pool empties, every question is reset instead of the feature
going quiet forever.

### 7. `/link-users` linked the wrong people

Matching was `slackUser.name.includes(dbUser.name) || dbUser.name.includes(slackUser.name)`
— a substring test in both directions. "Jon" matched "Jonathan"; two people could be
assigned the same Slack ID. A wrong link posts someone else's birthday to the whole
company, which is presumably why the startup call was commented out in `index.js`.

**Fix.** Exact email or exact full name only. Already-linked rows are skipped,
ambiguous names are left for `/manual-link`, and no Slack ID is claimed twice in a run.

### 8. The CSV importer fabricated Slack IDs

Rows without a Slack ID got `TEMP_JOHN_DOE_1725400000000`. That satisfies the unique
index but renders in the channel as a broken `<@TEMP_JOHN_DOE_…>` mention, and hides
the row from `/unlinked-users` — the exact command meant to find it.

**Fix.** No ID is invented. The field is left unset, mentions fall back to the plain
name, and `/unlinked-users` finds the row.

### 9. Re-importing a CSV wiped Slack links

The importer built a `userData` object and `$set` it wholesale. Re-running an import
whose file had no `slack_user_id` column pushed `undefined` over every link
established by `/link-users`.

**Fix.** Only the keys the CSV actually carries are written.

### 10. Invalid calendar dates were stored shifted

`/set-birthday @user 2024-02-31` passed the `\d{4}-\d{2}-\d{2}` regex and
`new Date()` rolled it to 2 March, which was stored without comment.

**Fix.** `parseDateOnly` round-trips through `Date.UTC` and rejects anything that
does not come back unchanged.

### 11. CSV dates parsed in two different timezones

`YYYY-MM-DD` parses as UTC midnight; `5/15/1990` parses as *local* midnight. Mixed
formats in one file produced rows the bot read inconsistently.

**Fix.** `parseCsvDate` normalises everything to UTC midnight of the calendar date
named, and rows with an unparseable date are reported and skipped rather than stored
wrong.

## Broken and dead code

### 12. `testSlackSync.js` called a method that does not exist

`slackService.syncSlackUsers()` was never implemented — the script crashed partway
through every run.

**Fix.** Repointed at `linkExistingUsers()`, which exists and does the intended job.

### 13. `dataSeeder.js` inserted fake users into whatever database it hit

The `seed` script created `U12345678` / "John Doe" with a 15 May birthday. Run against
production, that posts a broken `<@U12345678>` mention to the whole company.

**Fix.** Deleted, along with the `seed` script. `/add-user` and `pnpm import-csv`
cover the real need.

### 14. Dead branch in `getDatesToCheck`

`else if (dayOfWeek === 6 || dayOfWeek === 7)` — `getDay()` never returns 7, and the
caller had already returned on weekends.

**Fix.** Gone. Weekend handling is now a single early return.

### 15. `scheduled: true` was a no-op

`node-cron` v4 removed the option; the installed version silently ignored it.

**Fix.** Removed, and `noOverlap: true` added, which is what actually protects a job
that awaits both Mongo and Slack.

### 16. `axios` was a dependency that was never used

Required at the top of `slackService.js`, never called.

**Fix.** Removed from the requires and uninstalled.

### 17. Help and error text named commands that do not exist

`/user-info` pointed at `/sync-users`, `/unlinked-users` pointed at `/create-user`,
and `/add-user`'s own usage string said `/set-birthday @user YYYY-MM-DD`. None of
those commands existed.

**Fix.** All corrected, and `/celebration-bot-help` now lists every command.

## Operability

### 18. There was no way to create the first admin

The previous commit gated every command behind `isAdmin`, and nothing set that flag —
a fresh deployment was completely unusable without hand-editing MongoDB.

**Fix.** `pnpm set-admin <slack-id|email> ["Name"]` bootstraps from the shell,
creating the row if the database is empty, plus a `/set-admin @user` command for
promoting everyone afterwards.

### 19. Missing configuration failed hours later, invisibly

An absent `SLACK_CHANNEL_ID` produced no boot error. The first sign was a birthday
that never got posted, and even then `sendMessage` swallowed the API error.

**Fix.** `checkEnv()` exits at boot naming every missing variable, warns when the
watercooler channel is unset, and `sendMessage` refuses an empty channel loudly.

### 20. Send failures were logged as successes

`sendMessage` caught its errors and returned nothing, so the caller logged
`Sent birthday message for X` whether or not anything was sent.

**Fix.** The boolean return is used in the log line — failures print
`FAILED to send celebration message for X`.

### 21. Shutdown left connections open

The handler covered `SIGINT` only — not `SIGTERM`, which is what Heroku sends — and
called `process.exit(0)` without closing the Slack socket or the Mongo connection.

**Fix.** Both signals close the HTTP server, the Slack socket, and Mongoose.

### 22. No tests, and a `test` script that failed by design

The `test` script was `echo "Error: no test specified" && exit 1`.

**Fix.** `pnpm test` now runs `node --test test/*.test.js` — 9 tests over the date logic,
standard library only, no new dependencies.

## Left alone, deliberately

| Thing | Why |
| --- | --- |
| Twelve command handlers in one 1000-line file | Splitting them adds files without removing logic. `src/commands/` is the seam if it grows |
| Unused `birthday` / `anniversary` indexes | Harmless at this scale; the query pattern cannot use them either way |
| No deduplication of sends | Real, and it means running exactly one instance. Fixing it needs a sent-log collection — see the `ponytail:` note in `cronJobs.js` |
| No catch-up for missed runs | Same tradeoff. A missed 1:00 PM is a missed day |
| Long `/list-users` output could hit Slack's message cap | Only at roughly 500+ users. Not worth chunking yet |
| GIF URLs hardcoded as two arrays | They are data, they work, and nobody needs to configure them |
