# Birthday & Anniversary Slack Bot

Posts birthday and work-anniversary celebrations to a Slack channel, plus a weekly
watercooler question. Node.js + MongoDB, one always-on process, Slack over Socket Mode.

```
Mon–Thu 1:00 PM ET   →  today's birthdays and anniversaries
Friday  1:00 PM ET   →  today's, plus a look-ahead for Saturday and Sunday
Thursday 1:00 PM ET  →  one watercooler question
```

Requires **Node.js 24** and **pnpm** (`corepack enable` picks up the pinned version).

## Quick start

```bash
cp .env.example .env          # fill in the five required values
pnpm install
pnpm set-admin U012345 "Your Name"   # your Slack ID; every command is admin-only
pnpm start
```

Then in Slack: `/celebration-bot-help`.

## Documentation

Everything lives in [docs/](docs/README.md):

- [setup.md](docs/setup.md) — creating and installing the Slack app
- [configuration.md](docs/configuration.md) — environment variables
- [slack-commands.md](docs/slack-commands.md) — all 12 slash commands
- [architecture.md](docs/architecture.md) — how the pieces fit
- [scheduling.md](docs/scheduling.md) — cron and the date rules that make it correct
- [data-model.md](docs/data-model.md) — MongoDB collections
- [operations.md](docs/operations.md) — deploying, importing users, troubleshooting
- [development.md](docs/development.md) — running locally, tests
- [fixes.md](docs/fixes.md) — August 2026 audit and what it changed

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm start` | Run the bot |
| `pnpm test` | Date-logic unit tests — no network, no database |
| `pnpm import-csv <file>` | Bulk-import users from CSV |
| `pnpm set-admin <id\|email> ["Name"]` | Grant admin rights from the shell |
| `pnpm smoke-test` | Manual check against real Slack + Mongo |
