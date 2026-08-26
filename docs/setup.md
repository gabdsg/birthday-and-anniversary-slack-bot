# Slack app setup

One-time setup to get a working bot. Assumes you can create apps in the target
workspace; otherwise a workspace admin has to approve the install.

## 1. Create the app

1. Go to <https://api.slack.com/apps> → **Create New App** → **From scratch**.
2. Name it (e.g. `Celebrations Bot`) and pick the workspace.

## 2. Enable Socket Mode

1. **Settings → Socket Mode** → toggle **Enable Socket Mode** on.
2. Slack prompts for an App-Level Token. Name it `socket-token`, add the
   `connections:write` scope, generate.
3. Save the `xapp-…` value as **`SLACK_APP_TOKEN`**.

Socket Mode means Slack connects to you over an outbound websocket. You need no
public URL and no Request URL anywhere.

## 3. Add bot token scopes

**Features → OAuth & Permissions → Scopes → Bot Token Scopes**:

| Scope | Needed for |
| --- | --- |
| `commands` | Slash commands |
| `chat:write` | Posting celebration and watercooler messages |
| `users:read` | `users.list` / `users.info` — resolving `@mentions`, reading names |
| `users:read.email` | Matching database users to Slack accounts by email during `/link-users` |
| `chat:write.public` | *Optional.* Only if you would rather not invite the bot to the channel |

`users:read.email` is easy to forget and fails quietly: `/link-users` still runs, it
just matches nobody by email.

## 4. Install and collect credentials

1. **OAuth & Permissions → Install to Workspace → Allow**.
2. Save the **Bot User OAuth Token** (`xoxb-…`) as **`SLACK_BOT_TOKEN`**.
3. **Basic Information → App Credentials** → copy the **Signing Secret** as
   **`SLACK_SIGNING_SECRET`**.

## 5. Register the slash commands

See [slack-commands.md](slack-commands.md#registering-the-commands). Twelve commands,
no Request URL needed under Socket Mode.

## 6. Invite the bot to the channels

```
/invite @Celebrations Bot
```

in both the celebration channel and the watercooler channel. Skipping this produces
`not_in_channel` errors that the bot logs but does not surface in Slack.

## 7. Fill in `.env` and start

Requires Node.js 24 and pnpm — run `corepack enable` once if you do not have it.

```bash
cp .env.example .env   # then fill in the five required values
pnpm install
pnpm start
```

A healthy boot prints:

```
Server is running on port 3000
MongoDB connected successfully
Slack bot is running!
Scheduler started (America/New_York) - celebrations daily at 1:00 PM, watercooler Thursdays at 1:00 PM
Birthday & Anniversary Slack Bot is running!
```

## 8. Make yourself an admin

Every slash command is admin-only, and a fresh database has no admins. Break the
loop from the shell. On an empty database, pass your Slack user ID and name so the
row gets created:

```bash
pnpm set-admin U012345 "Your Name"
```

If your roster is already imported, an email is enough:

```bash
pnpm set-admin you@yourcompany.com
```

Full detail in [operations.md](operations.md#bootstrapping-the-first-admin).

## 9. Confirm it works

```
/celebration-bot-help      # should print the command list
/test-message hello        # should post "hello" to the celebration channel
```
