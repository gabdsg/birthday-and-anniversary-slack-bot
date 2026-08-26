# Development

## Requirements

- Node.js 24 (see `.nvmrc`; `engines` requires ≥ 24)
- pnpm — `corepack enable` picks up the version pinned in `packageManager`
- A MongoDB you can write to — local `mongod`, Docker, or an Atlas free tier
- A Slack app in a workspace you can install into ([setup.md](setup.md))

There is no way to run this fully offline: Socket Mode opens a websocket to Slack at
boot. For date logic, the unit tests need neither Slack nor Mongo.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm start` / `pnpm dev` | Run the bot |
| `pnpm test` | Unit tests for the date logic. No network, no database |
| `pnpm import-csv <file>` | Bulk-import users |
| `pnpm set-admin <id\|email> ["Name"]` | Grant admin rights from the shell |
| `pnpm smoke-test` | Manual check against real Slack + Mongo |

## Tests

```bash
pnpm test
```

`node:test` and `node:assert` from the standard library — no framework, no config.
[test/dates.test.js](../test/dates.test.js) covers
[src/utils/dates.js](../src/utils/dates.js): UTC reads, weekend skipping, the Friday
look-ahead across month and year boundaries, February 29, strict date parsing, and
anniversary year counting.

That module is tested because it is where the bugs were and because it is pure — it
takes a `{year, month, day, weekday}` object rather than reading the clock, so tests
freeze "today" by passing a literal. Keep it that way; anything that calls
`new Date()` internally is untestable without mocking time.

The Slack and Mongo layers have no automated tests. Verifying them means
`pnpm smoke-test` and `/test-message` in a real workspace.

## Conventions

- CommonJS (`require`), not ESM.
- `slackService.js` mixes `async method()` and `method = async () => {}`. The arrow
  form is only needed where `this` would otherwise be lost; both are in use for
  historical reasons.
- Slash command handlers all follow the same shape: `ack()` first (Slack times out
  after 3 seconds), then `checkAdminAccess`, then a `try`/`catch` that reports errors
  back with `❌ Error: …`.
- Errors are logged, not thrown, on anything reached from a cron job — one failure
  must not skip the rest of the batch.
- `ponytail:`-prefixed comments mark deliberate shortcuts and name their ceiling.

## Adding a slash command

1. Register it in the Slack app UI (**Features → Slash Commands**). Under Socket
   Mode there is no Request URL to fill in.
2. Add a handler in `SlackService.start()`, copying the shape of an existing one.
3. Add it to the `/celebration-bot-help` text.
4. Add it to the tables in [slack-commands.md](slack-commands.md).

Steps 1 and 3 are the ones people forget. A command that exists in code but not in
the Slack app is simply never delivered.

## Where things are likely to break

- **Date handling.** Read [scheduling.md](scheduling.md) before touching anything
  that compares dates. Never use `getDate()` / `getMonth()` on a stored value.
- **`users.list` pagination.** Any new call must page through `next_cursor`. A single
  call silently truncates and the missing people simply cannot be found.
- **The unique sparse index on `slackUserId`.** Inserting a row for a Slack ID that a
  deactivated row still holds throws a duplicate key error.
