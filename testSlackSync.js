require('dotenv').config();
const mongoose = require('mongoose');
const SlackService = require('./src/services/slackService');
const User = require('./src/models/User');

async function testSlackSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const slackService = new SlackService();
    await slackService.start();
    
    console.log('\n=== Listing Slack Users ===');
    const slackUsers = await slackService.listSlackUsers();
    console.log(`Found ${slackUsers.length} Slack users:`);
    slackUsers.forEach(user => {
      console.log(`- ${user.name} (ID: ${user.slackUserId}, Email: ${user.email || 'N/A'})`);
    });
    
    console.log('\n=== Syncing Users to Database ===');
    const syncResults = await slackService.syncSlackUsers();
    console.log('Sync Results:', syncResults);
    
    console.log('\n=== Current Database Users ===');
    const dbUsers = await User.find({});
    console.log(`Total users in database: ${dbUsers.length}`);
    dbUsers.forEach(user => {
      console.log(`- ${user.name} (Slack ID: ${user.slackUserId})`);
      if (user.birthday) console.log(`  Birthday: ${user.birthday.toDateString()}`);
      if (user.anniversary) console.log(`  Anniversary: ${user.anniversary.toDateString()}`);
    });
    
    console.log('\n=== Testing User Mention Format ===');
    const testUser = dbUsers[0];
    if (testUser) {
      const mentionFormat = testUser.slackUserId ? `<@${testUser.slackUserId}>` : testUser.name;
      console.log(`User mention for ${testUser.name}: ${mentionFormat}`);
      console.log('This will create a clickable mention in Slack messages!');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testSlackSync();