require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./src/db/connection');
const SlackService = require('./src/services/slackService');
const Scheduler = require('./src/scheduler/cronJobs');

// Fail at boot rather than at 1:00 PM: a missing token surfaces as a swallowed
// Slack API error hours later, on the day somebody's birthday gets skipped.
const REQUIRED_ENV = [
  'MONGODB_URI',
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'SLACK_APP_TOKEN',
  'SLACK_CHANNEL_ID',
];

function checkEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('See .env.example and docs/configuration.md');
    process.exit(1);
  }
  if (!process.env.SLACK_WATERCOOLER_CHANNEL_ID) {
    console.warn('SLACK_WATERCOOLER_CHANNEL_ID not set - watercooler questions are disabled.');
  }
}

async function main() {
  checkEnv();

  // Socket Mode needs no inbound HTTP; this only exists so Heroku sees a bound port.
  const app = express();
  const port = process.env.PORT || 3000;
  app.get('/', (req, res) => {
    res.json({ status: 'Birthday & Anniversary Slack Bot is running!' });
  });
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  await connectDB();

  const slackService = new SlackService();
  await slackService.start();

  new Scheduler(slackService).start();

  console.log('Birthday & Anniversary Slack Bot is running!');

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    try {
      server.close();
      await slackService.app.stop();
      await mongoose.connection.close();
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    process.exit(0);
  };

  // Heroku sends SIGTERM on dyno restart; SIGINT is Ctrl-C locally.
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
