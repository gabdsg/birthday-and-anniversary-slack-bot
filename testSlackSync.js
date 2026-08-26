// Manual smoke test: connects to Slack + Mongo and prints what the bot can see.
// Read-only apart from /link-users style linking, which it performs.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/db/connection');
const SlackService = require('./src/services/slackService');
const User = require('./src/models/User');

async function testSlackSync() {
  await connectDB();

  const slackService = new SlackService();
  await slackService.start();

  console.log('\n=== Listing Slack Users ===');
  const slackUsers = await slackService.listSlackUsers();
  console.log(`Found ${slackUsers.length} Slack users:`);
  slackUsers.forEach((user) => {
    console.log(`- ${user.name} (ID: ${user.slackUserId}, Email: ${user.email || 'N/A'})`);
  });

  console.log('\n=== Linking Database Users to Slack ===');
  console.log(await slackService.linkExistingUsers());

  console.log('\n=== Current Database Users ===');
  const dbUsers = await User.find({});
  console.log(`Total users in database: ${dbUsers.length}`);
  dbUsers.forEach((user) => {
    console.log(`- ${user.name} (Slack ID: ${user.slackUserId || 'not linked'})`);
    if (user.birthday) console.log(`  Birthday: ${user.birthday.toISOString().slice(0, 10)}`);
    if (user.anniversary) console.log(`  Anniversary: ${user.anniversary.toISOString().slice(0, 10)}`);
  });

  await slackService.app.stop();
  await mongoose.connection.close();
}

testSlackSync()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Test failed:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  });
