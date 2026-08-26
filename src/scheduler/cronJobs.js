const cron = require('node-cron');
const { BOT_TIMEZONE } = require('../utils/dates');

// noOverlap: both jobs hit Slack and Mongo over the network. Without it a slow
// run can be re-entered by the next tick and post duplicate messages.
const OPTIONS = { timezone: BOT_TIMEZONE, noOverlap: true };

// ponytail: no sent-log, so two running instances post every celebration twice.
// Run one. Add a (userId, date, kind) collection with a unique index if you need HA.
class Scheduler {
  constructor(slackService) {
    this.slackService = slackService;
  }

  start() {
    console.log('Starting scheduler...');

    // Daily at 1:00 PM. Friday's run also covers Saturday and Sunday.
    cron.schedule('0 13 * * *', async () => {
      console.log(`Running scheduled celebration check (${BOT_TIMEZONE})`);
      await this.slackService.checkAndSendMessages();
    }, { ...OPTIONS, name: 'celebrations' });

    // Thursdays at 1:00 PM.
    cron.schedule('0 13 * * 4', async () => {
      console.log(`Running scheduled watercooler question (${BOT_TIMEZONE})`);
      await this.slackService.sendWatercoolerQuestion();
    }, { ...OPTIONS, name: 'watercooler' });

    console.log(`Scheduler started (${BOT_TIMEZONE}) - celebrations daily at 1:00 PM, watercooler Thursdays at 1:00 PM`);
  }
}

module.exports = Scheduler;
