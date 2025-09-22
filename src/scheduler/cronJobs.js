const cron = require('node-cron');

class Scheduler {
  constructor(slackService) {
    this.slackService = slackService;
  }

  start() {
    console.log('Starting scheduler...');
    // Schedule the job to run daily at 1:00 PM ET
    //this.slackService.checkAndSendMessages();
    cron.schedule('0 13 * * *', async () => {
      console.log('Running scheduled check at 1:00 PM ET');
      await this.slackService.checkAndSendMessages();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    console.log('Scheduler started - will check daily at 1:00 PM ET');



    // Schedule a job to run evenry Thursday at 1:00 PM ET to send a watercooler question to watercooler channel
    // this.slackService.sendWatercoolerQuestion();
    cron.schedule('0 13 * * 4', async () => {
      console.log('Running scheduled watercooler question at 1:00 PM ET on Thursday');
      await this.slackService.sendWatercoolerQuestion();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    console.log('Scheduler started - will send watercooler question every Thursday at 1:00 PM ET');

  }
}

module.exports = Scheduler;