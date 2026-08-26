# Documentation

Slack bot that posts birthday and work-anniversary celebrations to a channel, plus a
weekly watercooler question. Node.js + MongoDB, runs as a single always-on process.

| Document | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | Module map, runtime flow, why each piece exists |
| [setup.md](setup.md) | Creating and installing the Slack app, first run |
| [configuration.md](configuration.md) | Every environment variable |
| [slack-commands.md](slack-commands.md) | All 12 slash commands and how to register them |
| [data-model.md](data-model.md) | MongoDB collections and indexes |
| [scheduling.md](scheduling.md) | Cron schedule and the date semantics that make it correct |
| [operations.md](operations.md) | Deploying, bootstrapping admins, importing users, troubleshooting |
| [development.md](development.md) | Running locally, tests, conventions |
| [fixes.md](fixes.md) | Issues found in the August 2026 audit and how they were fixed |

## 60-second version

1. A cron job wakes at 1:00 PM America/New_York every weekday.
2. It reads every active user from MongoDB and compares their stored `birthday` /
   `anniversary` against today's month + day (Friday also covers Sat + Sun).
3. Matches get a message with a random GIF in `SLACK_CHANNEL_ID`.
4. A second cron job posts an unused question from the `questions` collection to
   `SLACK_WATERCOOLER_CHANNEL_ID` every Thursday.
5. Admins manage the roster with slash commands over Slack Socket Mode.
