# Configuration

All configuration is environment variables, loaded from `.env` in development via
`dotenv`. `.env` is gitignored and has never been committed — keep it that way.

Copy the template to start:

```bash
cp .env.example .env
```

## Required

The process exits at boot with a named list if any of these are missing.

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb+srv://user:pw@cluster/celebrations` | Your MongoDB / Atlas cluster |
| `SLACK_BOT_TOKEN` | `xoxb-…` | Slack app → OAuth & Permissions → Bot User OAuth Token |
| `SLACK_SIGNING_SECRET` | `8f2a…` | Slack app → Basic Information → App Credentials |
| `SLACK_APP_TOKEN` | `xapp-…` | Slack app → Basic Information → App-Level Tokens (`connections:write`) |
| `SLACK_CHANNEL_ID` | `C1234567890` | The channel that receives celebrations |

## Optional

| Variable | Default | Effect |
| --- | --- | --- |
| `SLACK_WATERCOOLER_CHANNEL_ID` | *(none)* | Channel for the Thursday question. Missing → logs a warning at boot and the weekly post is skipped |
| `BOT_TIMEZONE` | `America/New_York` | IANA timezone for both cron schedules **and** for deciding what "today" means |
| `PORT` | `3000` | Port the health-check Express server binds |

### `BOT_TIMEZONE`

This is the one setting with non-obvious reach. It controls:

- when the two cron jobs fire, and
- which calendar day the bot considers "today" when matching birthdays.

Both read the same constant, so they cannot drift apart. Changing it to
`Europe/Lisbon` moves the daily post to 1:00 PM Lisbon time and makes the day
boundary Lisbon's midnight. The server's own `TZ` is irrelevant — see
[scheduling.md](scheduling.md).

## Finding a channel ID

Right-click the channel in Slack → **View channel details** → the ID is at the
bottom. Or read it out of the web URL: `…/client/T01ABC/C01DEF` → `C01DEF`.

The bot must be a member of any channel it posts to. Invite it with
`/invite @YourBotName`.
