# Slack App Configuration Guide

This guide will walk you through setting up a Slack app for the Birthday & Anniversary Bot.

## Step 1: Create a New Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter:
   - App Name: `Birthday & Anniversary Bot`
   - Pick a workspace to develop your app

## Step 2: Configure Socket Mode

1. In the left sidebar, go to **"Socket Mode"**
2. Toggle **"Enable Socket Mode"** to ON
3. You'll be prompted to create an App-Level Token:
   - Token Name: `socket-token`
   - Add Scope: `connections:write`
   - Click **"Generate"**
4. **Save this token** - this is your `SLACK_APP_TOKEN` (starts with `xapp-`)

## Step 3: Add a Bot User

1. In the left sidebar, go to **"App Home"**
2. Scroll down to **"Your App's Presence in Slack"**
3. Click **"Edit"** next to App Display Name
4. Set the Display Name and Default Username for your bot
5. Click **"Add"**

## Step 4: Set Up OAuth & Permissions

1. In the left sidebar, go to **"OAuth & Permissions"**
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Add the following OAuth scopes:
   - `chat:write` - Send messages as the bot
   - `chat:write.public` - Send messages to public channels
   - `channels:read` - View basic channel info
   - `groups:read` - View basic private channel info (if needed)
   - `im:read` - View basic direct message info (if needed)
   - `mpim:read` - View basic group direct message info (if needed)

## Step 5: Install App to Workspace

1. Still in **"OAuth & Permissions"**
2. Click **"Install to Workspace"** at the top
3. Review and **"Allow"** the permissions
4. **Save the Bot User OAuth Token** - this is your `SLACK_BOT_TOKEN` (starts with `xoxb-`)

## Step 6: Get Your Signing Secret

1. Go to **"Basic Information"** in the left sidebar
2. Scroll to **"App Credentials"**
3. **Copy the Signing Secret** - this is your `SLACK_SIGNING_SECRET`

## Step 7: Configure Event Subscriptions (Optional)

If you want the bot to respond to commands or mentions:

1. Go to **"Event Subscriptions"**
2. Toggle **"Enable Events"** to ON
3. Since we're using Socket Mode, you don't need a Request URL
4. Under **"Subscribe to bot events"**, add:
   - `app_mention` - When someone mentions the bot
   - `message.channels` - Messages in public channels

## Step 8: Add Bot to Channel

1. In your Slack workspace, go to the channel where you want birthday/anniversary messages
2. Type `/invite @Birthday & Anniversary Bot` (or click channel name → Integrations → Add apps)
3. The bot should now have access to post in this channel

## Step 9: Get Channel ID

To find your `SLACK_CHANNEL_ID`:

### Method 1: From Slack App
1. Right-click on the channel name in Slack
2. Select **"View channel details"**
3. Scroll to the bottom
4. The Channel ID will be shown (starts with `C` for public channels)

### Method 2: From Browser
1. Open Slack in your browser
2. Navigate to the channel
3. Look at the URL: `https://app.slack.com/client/TXXXXXX/CXXXXXX`
4. The last part starting with `C` is your channel ID

## Step 10: Configure Your .env File

Now you have all the required tokens. Add them to your `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/birthday_anniversary_bot

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_CHANNEL_ID=C1234567890
```

## Step 11: Test Your Bot

1. Start your bot: `npm start`
2. You should see:
   - "MongoDB connected successfully"
   - "Slack bot is running!"
   - "Scheduler started - will check daily at 1:00 PM ET"

3. To test immediately (optional), you can temporarily modify the cron schedule in `src/scheduler/cronJobs.js`:
   ```javascript
   // Change from: '0 13 * * *'
   // To run every minute for testing: '* * * * *'
   ```

## Troubleshooting

### Common Issues:

1. **"invalid_auth" error**
   - Double-check your `SLACK_BOT_TOKEN` starts with `xoxb-`
   - Ensure the app is installed to your workspace

2. **"not_in_channel" error**
   - Make sure the bot is invited to the channel
   - Check the `SLACK_CHANNEL_ID` is correct

3. **Socket connection fails**
   - Verify `SLACK_APP_TOKEN` starts with `xapp-`
   - Ensure Socket Mode is enabled

4. **Bot doesn't send messages**
   - Verify the bot has `chat:write` permissions
   - Check MongoDB has users with today's birthday/anniversary
   - Ensure the scheduler timezone is correct

## Security Notes

- **Never commit your `.env` file** to version control
- Keep your tokens secure and rotate them periodically
- Use environment variables in production
- Consider using Slack's token rotation API for enhanced security

## Additional Features (Optional)

You can extend the bot with:

- Slash commands to add/edit users
- Interactive buttons for acknowledgments
- DM notifications to managers
- Custom celebration messages
- Reminder messages (e.g., "Birthday coming up tomorrow!")

For more information, visit the [Slack API documentation](https://api.slack.com/docs).