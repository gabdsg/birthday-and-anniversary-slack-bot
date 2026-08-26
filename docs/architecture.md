# Architecture

## Process shape

One long-lived Node process. There is no HTTP API and no worker queue.

```
index.js
  ├── checkEnv()                    fail fast on missing config
  ├── express                       health endpoint, exists only to bind $PORT
  ├── connectDB()                   mongoose connection
  ├── new SlackService().start()    opens the Socket Mode websocket, registers commands
  ├── new Scheduler(svc).start()    registers two cron jobs
  └── SIGTERM / SIGINT              close server, socket, and mongo
```

Slack is reached over **Socket Mode**, an outbound websocket. Slack never calls in,
so the bot needs no public URL, no TLS, and no request-signature verification path.
The Express server exists purely because platforms like Heroku kill a web dyno that
does not bind `$PORT`. If you deploy as a worker dyno you can drop it.

## Modules

| File | Responsibility |
| --- | --- |
| [index.js](../index.js) | Boot, env validation, wiring, graceful shutdown |
| [src/db/connection.js](../src/db/connection.js) | Mongoose connect, exits on failure |
| [src/models/User.js](../src/models/User.js) | Person + their dates + admin flag |
| [src/models/Question.js](../src/models/Question.js) | Watercooler question pool |
| [src/services/slackService.js](../src/services/slackService.js) | Everything Slack: sending, the roster API, all 12 slash commands |
| [src/scheduler/cronJobs.js](../src/scheduler/cronJobs.js) | The two cron registrations |
| [src/utils/dates.js](../src/utils/dates.js) | All date reasoning, timezone-safe. The only tested module |
| [src/utils/adminCheck.js](../src/utils/adminCheck.js) | `checkAdminAccess` gate used by every command |
| [src/utils/csvImporter.js](../src/utils/csvImporter.js) | Bulk roster import (`pnpm import-csv`) |
| [src/utils/setAdmin.js](../src/utils/setAdmin.js) | First-admin bootstrap (`pnpm set-admin`) |
| [testSlackSync.js](../testSlackSync.js) | Manual smoke test against real Slack + Mongo |

`slackService.js` is a single ~1000-line class. Roughly 600 of those lines are the
twelve slash-command handlers, which all follow the identical shape:

```js
this.app.command("/name", async ({ command, ack, respond }) => {
  await ack();                                  // Slack demands an ack within 3s
  const adminCheck = await checkAdminAccess(command.user_id, "/name");
  if (!adminCheck.authorized) return respond({ text: adminCheck.message });
  try { /* work */ } catch (e) { await respond({ text: `❌ Error: ${e.message}` }); }
});
```

Splitting them into one file per command would be twelve more files without removing
a single line of logic, so they stay together. If the file grows past the commands,
`src/commands/` is the seam to cut along.

## Daily flow

```
cron '0 13 * * *' (America/New_York)
  └── SlackService.checkAndSendMessages()
        ├── zonedParts()                today's y/m/d + weekday in the bot timezone
        ├── getDatesToCheck(today)      [] on weekends; Fri returns Fri + Sat + Sun
        ├── User.find({ isActive: true })
        └── for each user × date
              ├── fallsOn(user.birthday, date)     UTC-safe month/day compare
              ├── yearsSince(user.anniversary, date)
              └── announce() → sendMessage() with a random GIF
```

Users are read in one query and filtered in memory. At company scale (hundreds of
rows, once a day) that is cheaper than a date-range query against a stored `Date`,
because matching "any year, this month and day" is not something the existing
indexes can serve anyway.

## Thursday flow

```
cron '0 13 * * 4' (America/New_York)
  └── SlackService.sendWatercoolerQuestion()
        ├── $sample one question where isUsed: false
        ├── if the pool is empty, reset every question to unused and re-sample
        ├── post to SLACK_WATERCOOLER_CHANNEL_ID
        └── mark isUsed only after a confirmed send
```

## Design notes

- **`sendMessage` returns a boolean and never throws.** One unreachable channel must
  not abort the loop and skip everyone whose birthday sorts after it. Callers log the
  failure; the watercooler job uses the result to decide whether to burn the question.
- **Slack is the source of truth for identity, Mongo for dates.** `slackUserId` links
  the two. A user row without one still works: messages fall back to the plain name,
  which renders as text rather than a mention.
- **Every command is admin-gated.** There is no self-service path; see
  [operations.md](operations.md#bootstrapping-the-first-admin) for the chicken-and-egg.
