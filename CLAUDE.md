# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A Slack bot that posts birthday and work-anniversary celebrations to a channel, plus
a weekly watercooler question. Node.js 24 (CommonJS) + MongoDB/Mongoose + `@slack/bolt`
in Socket Mode. **Package manager is pnpm** — never run `npm install` here, it would
produce a second lockfile. One always-on process, two cron jobs, twelve admin-only slash
commands. No build step, no TypeScript, no framework beyond Bolt and Express.

Full documentation is in [docs/](docs/README.md). Read
[docs/scheduling.md](docs/scheduling.md) before touching anything date-related.

## Commands

```bash
pnpm start                              # run the bot (needs Slack + Mongo)
pnpm test                               # node --test, date logic only, no network
pnpm import-csv <file>                  # bulk-import users
pnpm set-admin <slack-id|email> [name]  # grant admin rights from the shell
pnpm smoke-test                         # manual check against real Slack + Mongo
```

`pnpm test` is the only thing that runs without credentials. Run it after any change
to `src/utils/dates.js`.

## Layout

```
index.js                     boot, env validation, wiring, graceful shutdown
src/services/slackService.js everything Slack: sending, roster API, all 12 commands
src/scheduler/cronJobs.js    the two cron registrations
src/utils/dates.js           all date reasoning — the only tested module
src/utils/adminCheck.js      checkAdminAccess, used by every command
src/utils/csvImporter.js     bulk import
src/utils/setAdmin.js        first-admin bootstrap
src/models/{User,Question}.js
test/dates.test.js
```

## Rules that matter here

**Never read a stored date with local getters.** `birthday` and `anniversary` are
stored at UTC midnight. `new Date("1990-05-15").getDate()` returns **14** on any
machine west of UTC. Use `fallsOn` / `yearsSince` from `src/utils/dates.js`, which
use UTC getters, and `zonedParts()` for "today" in `BOT_TIMEZONE`. This was the
single biggest bug in the repo's history — do not reintroduce it.

**Keep date logic pure and in `src/utils/dates.js`.** `getDatesToCheck` takes a
`{year, month, day, weekday}` object instead of reading the clock, which is what
makes it testable. Anything that calls `new Date()` internally cannot be tested
without mocking time.

**Paginate every `users.list` call.** Use `fetchAllSlackMembers()`. A bare call
returns one page and silently pretends that is the whole workspace.

**`slackUserId` is uniquely indexed and sparse, and `/remove-user` soft-deletes.**
A deactivated row still holds its Slack ID, so inserting a new row for that person
throws a duplicate key error. Look for an existing row and reactivate it.

**Never fabricate a `slackUserId`.** A placeholder value renders in Slack as a broken
`<@TEMP_…>` mention and hides the row from `/unlinked-users`. Leave it unset —
messages fall back to the plain name.

**Anything reached from a cron job logs errors instead of throwing.** One unreachable
channel must not abort the loop and skip everyone after it. `sendMessage` returns a
boolean and never throws; use the return value rather than assuming success.

**Only link users on exact matches.** Substring name matching linked "Jon" to
"Jonathan" and posted the wrong person's birthday to the whole company. Exact email
or exact full name, or leave it for `/manual-link`.

## Slash command shape

Every handler follows this, and new ones should too:

```js
this.app.command("/name", async ({ command, ack, respond }) => {
  await ack();                                   // Slack times out after 3s
  const adminCheck = await checkAdminAccess(command.user_id, "/name");
  if (!adminCheck.authorized) {
    await respond({ text: adminCheck.message });
    return;
  }
  try {
    // work
  } catch (error) {
    await respond({ text: `❌ Error: ${error.message}` });
  }
});
```

Adding a command means four steps, and steps 1 and 3 are the ones that get forgotten:

1. Register it in the Slack app UI (**Features → Slash Commands**; no Request URL
   under Socket Mode). A command that exists only in code is never delivered.
2. Add the handler in `SlackService.start()`.
3. Add it to the `/celebration-bot-help` text.
4. Add it to the tables in [docs/slack-commands.md](docs/slack-commands.md).

## Conventions

- CommonJS `require`, no ESM.
- Twelve command handlers live in one ~1000-line `slackService.js`. That is
  deliberate — splitting them adds files without removing logic. `src/commands/` is
  the seam if it ever outgrows the file.
- `ponytail:` comments mark deliberate shortcuts and name the ceiling and the upgrade
  path. Respect them; do not "fix" one without reading it.
- Prefer the standard library. Tests are `node:test` + `node:assert`, no framework.
  Do not add a dependency for something a few lines cover.
- pnpm only. `pnpm add` / `pnpm remove`, and `pnpm-lock.yaml` is the committed
  lockfile. `pnpm run <script> <args>` needs no `--` separator.

## Known constraints

- **Run exactly one instance.** Nothing records that a message was sent, so two
  processes post every celebration twice.
- **No catch-up.** If the process is down at 1:00 PM, that day's celebrations never
  go out.
- **`BOT_TIMEZONE`** (default `America/New_York`) drives both cron schedules and the
  definition of "today". The server's own `TZ` is irrelevant by design.
- **Every command is admin-gated**, and a fresh database has no admins. Bootstrap
  with `pnpm set-admin`.
