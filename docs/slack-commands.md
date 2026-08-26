# Slash commands

Twelve commands, **all restricted to admins**. A non-admin gets a private message
explaining they lack permission; an unregistered user is told to contact an
administrator. See [operations.md](operations.md#bootstrapping-the-first-admin) for
how the first admin is created.

Responses use `respond()`, so they are ephemeral — only the caller sees them. The
one exception is `/test-message`, which posts publicly to the celebration channel.

## Reference

### User management

| Command | Usage | What it does |
| --- | --- | --- |
| `/add-user` | `/add-user @user` | Adds the user, pulling their real name from Slack. Reactivates them if they were previously removed; says so if they already exist |
| `/set-birthday` | `/set-birthday @user YYYY-MM-DD` | Sets a birthday. Creates the user from their Slack profile if absent |
| `/set-anniversary` | `/set-anniversary @user YYYY-MM-DD` | Sets a work anniversary. Creates the user if absent |
| `/remove-user` | `/remove-user @user` | Soft delete — sets `isActive: false`. The row and its dates survive |
| `/set-admin` | `/set-admin @user` | Grants admin rights. The user must already be in the database |

Dates are strict `YYYY-MM-DD`. Impossible dates like `2024-02-31` are rejected rather
than silently stored as March 2. The year matters for anniversaries (it is how the
"N year" count is computed) and is ignored for birthdays.

### Linking Slack accounts

Rows imported from a CSV have no `slackUserId`, so they are announced by plain name
instead of a clickable `@mention`. These commands attach them.

| Command | Usage | What it does |
| --- | --- | --- |
| `/link-users` | `/link-users` | Auto-links unlinked users to Slack accounts, by email first, then by exact full name. Reports what it could not match |
| `/manual-link` | `/manual-link "Database Name" @slackuser` | Links one user by hand. The database name is a case-insensitive substring match |
| `/unlinked-users` | `/unlinked-users` | Lists everyone still missing a `slackUserId` |

`/link-users` only makes **exact** matches — full email or full name. It deliberately
refuses fuzzy matches: a wrong link posts the wrong person's birthday to the whole
company. Ambiguous names (two "John Smith"s) are skipped for `/manual-link` to sort out.

### Information

| Command | Usage | What it does |
| --- | --- | --- |
| `/celebration-bot-help` | `/celebration-bot-help` | Prints the command list |
| `/list-users` | `/list-users` | Every active user with their dates and link status |
| `/user-info` | `/user-info @user` | One user's name, birthday, anniversary, active flag |

### Testing

| Command | Usage | What it does |
| --- | --- | --- |
| `/test-message` | `/test-message some text` | Posts the text to `SLACK_CHANNEL_ID`. Confirms the token, the channel ID, and channel membership in one shot |

## Registering the commands

Slack app → **Features → Slash Commands → Create New Command**, once per row below.
Because the app runs in Socket Mode, **the Request URL field does not apply** — Slack
delivers commands over the websocket.

| Command | Short description | Usage hint |
| --- | --- | --- |
| `/celebration-bot-help` | Show available commands | |
| `/add-user` | Add a user to the database | `@user` |
| `/set-birthday` | Set a user's birthday | `@user YYYY-MM-DD` |
| `/set-anniversary` | Set a user's work anniversary | `@user YYYY-MM-DD` |
| `/remove-user` | Deactivate a user | `@user` |
| `/set-admin` | Grant admin rights | `@user` |
| `/link-users` | Auto-link database users to Slack | |
| `/manual-link` | Manually link a database user to Slack | `"Database Name" @user` |
| `/unlinked-users` | Show users not linked to Slack | |
| `/list-users` | List all users and their dates | |
| `/user-info` | Show one user's dates | `@user` |
| `/test-message` | Send a test message to the channel | `some text` |

After adding them all, reinstall the app if Slack prompts you.

## How `@user` is resolved

`resolveSlackUserId` accepts, in order of preference:

1. `<@U012345>` or `<@U012345|name>` — what Slack sends when you pick a user from
   the autocomplete dropdown. Always works.
2. `@username` typed as plain text — resolved by scanning the workspace roster for a
   matching `name`, `display_name`, or de-spaced `real_name`.

Form 1 is reliable; form 2 depends on the typed handle matching a profile field. If a
command reports it cannot find the user, retype the `@` and pick from the dropdown.
