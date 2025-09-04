const { App } = require('@slack/bolt');
const axios = require('axios');
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



  async sendMessage(channel, message, includeGif = false, gifUrl) {
    try {
      const messagePayload = {
        token: process.env.SLACK_BOT_TOKEN,
        channel: channel,
        text: message
      };

      if (includeGif && gifUrl) {
        if (gifUrl) {
          messagePayload.blocks = [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: message
              }
            },
            {
              type: "image",
              image_url: gifUrl,
              alt_text: message
            }
          ];
        }
      }

      await this.app.client.chat.postMessage(messagePayload);
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
            await this.sendMessage(process.env.SLACK_CHANNEL_ID, message, true, 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG4wZW9qam1ycm9qajFweTRub2Y1a2VreWF6OXk2NWZvdjhkeTFueCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mcJohbfGPATW8/giphy.gif');
            console.log(`Sent birthday message for ${user.name}`);
          }
        }
        
        if (user.anniversary) {
          const anniversary = new Date(user.anniversary);
          if (anniversary.getMonth() + 1 === month && anniversary.getDate() === day) {
            const yearsCount = today.getFullYear() - anniversary.getFullYear();
            const message = `Celebrate ${user.name}'s ${yearsCount} year work anniversary! 🎉`;
            await this.sendMessage(process.env.SLACK_CHANNEL_ID, message, true, 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzI3dmVmYjE4dGNqa3hobjUxY2N4cWQ2NWVqNWVzMzNueHpkMXg0eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NTCNn803PAxHDWkzqz/giphy.gif');
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