const { App } = require('@slack/bolt');
const User = require('../models/User');

class SlackService {
  constructor() {
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: process.env.SLACK_APP_TOKEN
    });
  }

  async sendMessage(channel, message) {
    try {
      await this.app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channel,
        text: message
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async checkAndSendMessages() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    try {
      const users = await User.find({ isActive: true });
      
      for (const user of users) {
        if (user.birthday) {
          const birthday = new Date(user.birthday);
          if (birthday.getMonth() + 1 === month && birthday.getDate() === day) {
            const message = `Wish ${user.name} a Happy Birthday! 🎂`;
            await this.sendMessage(process.env.SLACK_CHANNEL_ID, message);
            console.log(`Sent birthday message for ${user.name}`);
          }
        }
        
        if (user.anniversary) {
          const anniversary = new Date(user.anniversary);
          if (anniversary.getMonth() + 1 === month && anniversary.getDate() === day) {
            const yearsCount = today.getFullYear() - anniversary.getFullYear();
            const message = `Celebrate ${user.name}'s ${yearsCount} year work anniversary! 🎉`;
            await this.sendMessage(process.env.SLACK_CHANNEL_ID, message);
            console.log(`Sent anniversary message for ${user.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking dates:', error);
    }
  }

  async start() {
    await this.app.start();
    console.log('Slack bot is running!');
  }
}

module.exports = SlackService;