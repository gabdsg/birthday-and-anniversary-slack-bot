require('dotenv').config();
const connectDB = require('./src/db/connection');
const SlackService = require('./src/services/slackService');
const Scheduler = require('./src/scheduler/cronJobs');

async function main() {
  try {
    await connectDB();
    
    const slackService = new SlackService();
    await slackService.start();
    
    // Auto-link existing users to Slack on startup
    // console.log('Linking existing users to Slack...');
    // const linkResults = await slackService.linkExistingUsers();
    // console.log(`Linked ${linkResults.linked} users, ${linkResults.unmatched.length} unmatched`);
    
    const scheduler = new Scheduler(slackService);
    scheduler.start();
    
    console.log('Birthday & Anniversary Slack Bot is running!');
    
    process.on('SIGINT', async () => {
      console.log('Shutting down gracefully...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();