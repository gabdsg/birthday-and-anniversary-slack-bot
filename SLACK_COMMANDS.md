# Slack App Slash Commands Setup

This document lists all the slash commands that need to be configured in your Slack app settings.

## Commands to Add

Go to [Slack API Apps](https://api.slack.com/apps) → Your App → **Slash Commands** → **Create New Command**

For each command below, use the same **Request URL** (your bot's endpoint, e.g., `https://yourdomain.com/slack/events`)

### 1. `/birthday-help`
- **Command**: `/birthday-help`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Shows help and available commands`
- **Usage Hint**: 

### 2. `/link-users`
- **Command**: `/link-users`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Auto-link existing database users to Slack users`
- **Usage Hint**: 

### 3. `/manual-link`
- **Command**: `/manual-link`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Manually link a database user to a Slack user`
- **Usage Hint**: `"Database Name" @slackuser`

### 4. `/unlinked-users`
- **Command**: `/unlinked-users`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Show users without Slack IDs`
- **Usage Hint**: 

### 5. `/list-users`
- **Command**: `/list-users`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `List all users in database with their dates`
- **Usage Hint**: 

### 6. `/set-birthday`
- **Command**: `/set-birthday`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Set a user's birthday`
- **Usage Hint**: `@user YYYY-MM-DD`

### 7. `/set-anniversary`
- **Command**: `/set-anniversary`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Set a user's work anniversary`
- **Usage Hint**: `@user YYYY-MM-DD`

### 8. `/user-info`
- **Command**: `/user-info`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Show user's birthday and anniversary info`
- **Usage Hint**: `@user`

### 9. `/remove-user`
- **Command**: `/remove-user`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Deactivate a user from birthday/anniversary notifications`
- **Usage Hint**: `@user`

### 10. `/test-message`
- **Command**: `/test-message`
- **Request URL**: `https://yourdomain.com/slack/events`
- **Short Description**: `Send a test birthday message for a user`
- **Usage Hint**: `@user`

## Setup Instructions

1. Go to https://api.slack.com/apps
2. Select your Birthday & Anniversary bot app
3. Navigate to **Features** → **Slash Commands**
4. For each command above:
   - Click **Create New Command**
   - Fill in the Command, Request URL, Short Description, and Usage Hint
   - Click **Save**
5. After adding all commands, reinstall your app to the workspace if prompted

## Usage Examples

Once configured, users can run these commands in any channel where the bot is present:

### Initial Setup (for existing users):
```
/birthday-help                               # Show all commands
/unlinked-users                             # See users without Slack IDs
/link-users                                 # Auto-link users by name/email
/manual-link "John Smith" @john.doe         # Manually link specific users
```

### Daily Operations:
```
/list-users                                 # See all users and their dates
/set-birthday @john.doe 1990-05-15         # Set birthdays
/set-anniversary @jane.smith 2020-03-01    # Set anniversaries  
/user-info @john.doe                       # Check user info
/test-message @john.doe                    # Test mentions work
/remove-user @former.employee              # Deactivate users
```

## Notes

- All commands use the same Request URL endpoint
- The bot handles routing internally based on the command name
- Commands will respond privately to the user who ran them
- Make sure your bot has the necessary OAuth scopes: `commands`, `users:read`, `chat:write`