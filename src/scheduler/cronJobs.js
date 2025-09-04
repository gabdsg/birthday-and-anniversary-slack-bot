const cron = require('node-cron');

class Scheduler {
  constructor(slackService) {
    this.slackService = slackService;
  }

  start() {
    //  this.slackService.checkAndSendMessages();
    cron.schedule('0 13 * * *', async () => {
      console.log('Running scheduled check at 1:00 PM ET');
      await this.slackService.checkAndSendMessages();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    console.log('Scheduler started - will check daily at 1:00 PM ET');
  }
}

module.exports = Scheduler;