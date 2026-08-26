# Operations

## Running it

Node.js 24 and pnpm. `corepack enable` installs the pnpm version pinned in
`packageManager`; otherwise install pnpm yourself.

```bash
pnpm install
pnpm start        # or pnpm dev — same thing, there is no watch mode
```

The process must stay up. There is no queue and no catch-up: if it is down at
1:00 PM, that day's celebrations do not go out.

**Run exactly one instance.** Nothing deduplicates sends, so two dynos post every
birthday twice.

## Deploying

Commit `pnpm-lock.yaml`. Heroku-style Node buildpacks detect it and switch to pnpm on
their own, using the version from `packageManager` and the runtime from `engines.node`
(`>=24`) — no extra buildpack configuration.

The Express server exists only to bind `$PORT` so a Heroku-style web dyno is not
killed for being idle; Socket Mode needs no inbound HTTP. On a platform that does
not require a port bind, run it as a worker.

`SIGTERM` (dyno restart) and `SIGINT` (Ctrl-C) both trigger a graceful shutdown:
the HTTP server closes, the Slack socket closes, the Mongo connection closes.

Set every variable from [configuration.md](configuration.md) in the platform's
config, not in a deployed `.env`.

## Bootstrapping the first admin

Every slash command is admin-gated and a fresh database has no admins, so the first
one has to be created from the shell.

```bash
# Empty database — creates the row and makes it admin.
pnpm set-admin U012345 "Your Name"

# Roster already imported — email is enough.
pnpm set-admin you@yourcompany.com
```

Find your own Slack user ID in Slack: click your avatar → **Profile** → the ⋯ menu →
**Copy member ID**.

After that, promote everyone else from Slack with `/set-admin @user`.

## Importing a roster

```bash
pnpm import-csv path/to/people.csv
```

Recognised columns (all optional except `name`):

| Column | Notes |
| --- | --- |
| `name` | **Required.** Rows without one are skipped |
| `birthday` | `YYYY-MM-DD` preferred; other parseable formats are normalised |
| `anniversary` | Same |
| `email` | Used later by `/link-users` |
| `slack_user_id` or `slackUserId` | If you already know it |
| `is_active` | `"true"` / `"false"`, defaults to true |

Example:

```csv
name,email,birthday,anniversary
Ada Lovelace,ada@example.com,1990-05-15,2020-03-01
Grace Hopper,grace@example.com,1985-09-22,2019-06-15
```

Matching is by `slack_user_id` when the column is present, otherwise by exact `name`.
Only the columns your file actually contains are written, so re-importing a roster
without `slack_user_id` will **not** wipe links established by `/link-users`.

Rows with an unparseable date are reported and skipped rather than stored wrong.

Afterwards, attach Slack accounts:

```
/link-users        # exact email or exact full name
/unlinked-users    # whatever is left
/manual-link "Ada Lovelace" @ada
```

## Loading watercooler questions

There is no seeder. Insert them directly:

```js
// mongosh "$MONGODB_URI"
db.questions.insertMany([
  { text: "What's the best meal you've had recently?", isUsed: false, createdAt: new Date(), updatedAt: new Date() },
  { text: "What's a skill you'd learn if you had a free month?", isUsed: false, createdAt: new Date(), updatedAt: new Date() },
]);
```

`text` is uniquely indexed, so re-running a batch with duplicates fails on the
repeats. The pool recycles itself once every question has been used.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Missing required environment variables: …` at boot | Exactly what it says; see [configuration.md](configuration.md) |
| `An API error occurred: invalid_auth` | `SLACK_BOT_TOKEN` wrong or the app was uninstalled |
| `An API error occurred: not_in_channel` | Bot is not a member — `/invite @YourBot` in the channel |
| Socket never connects | `SLACK_APP_TOKEN` must be `xapp-…` with `connections:write`, and Socket Mode must be on |
| `/link-users` matches nobody by email | Missing the `users:read.email` scope — it fails silently |
| A command says the user cannot be found | Retype `@` and pick from the dropdown so Slack sends `<@U…>` |
| "You must be registered in the system…" | The caller has no row. `/add-user @them` first |
| "you don't have permission" | The caller is registered but not admin. `/set-admin @them` |
| Celebrations one day early or late | Check `BOT_TIMEZONE`; see [scheduling.md](scheduling.md#the-timezone-rule) |
| Every message arrives twice | More than one instance is running |
| No watercooler post | `SLACK_WATERCOOLER_CHANNEL_ID` unset (warned at boot) or the `questions` collection is empty |

Logs are plain `console.log` / `console.error` to stdout — read them with
`heroku logs --tail` or your platform's equivalent. A failed send logs
`FAILED to send celebration message for <name>`.

## Smoke test against real Slack

```bash
pnpm smoke-test
```

Connects to Slack and Mongo, prints the workspace roster and the database roster,
and runs the same linking `/link-users` performs. It **does** write links, so it is
not purely read-only.
