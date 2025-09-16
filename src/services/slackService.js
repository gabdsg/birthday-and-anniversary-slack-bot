const { App } = require('@slack/bolt');
const axios = require('axios');
const User = require('../models/User');

const birthdayGifs = ['https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyMTZnbzh5OWloMXZhdjNta2kwZHM0Z2xud3dva21ocnd0dWZlaHdrbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9rO5Aksmn0dHQKXJAu/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyeHRhNXVlN2lyd3Q4c3AzNjNzd3Z2bWY4NTdvcjI2YW5pZDlsMWx2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wGKrkvHxZT6PVpw635/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyYjY1cndsMmk0dThydGhzc3BkM254anlwd3EzMTVhZHI3M3hiNTYxaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hkE6wynetELGa7xOjq/giphy.gif', 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyMmdlc2UwbTNhNTkweTh3N2h3eWpkZTY3anM3c2V2Mm9vYXRrc2V2ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Im6d35ebkCIiGzonjI/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZjh1Y2FscDg1MWdtaTA0Y3pkN3MybmRkbDluY2hhaWg4a3ZyNWd4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/g5R9dok94mrIvplmZd/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyOXB3dWVvN3VmNXc1cXZwdXg0b2hub3N1c3lqaGxiMzRjczl2MWNicCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WRL7YgP42OKns22wRD/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyenFiYWpndXdhaThmN2xpZGhmZmEyMGFqdHJ3Z3dsbnpzYWx5NDVvayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/D7iOxcaMv82RTpCNpx/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyM2g2ZGlncnV6OHB1M3Fid2JjOGo5d3hxY285dWdqc3FsZzZ4cnp6cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zKSncwDt0kVtMMhGaG/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyOGR0c2N6eWF5MDNqZnh5NWlydXgwcWY4dzFhY3IxYnBkaTZiYm1mMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JksahSdnH6BX1WEtlc/giphy.gif', 'https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUycXJqbzRwYjZhc2FhbjQ5eWplOG9lcHVpNnozaDk3Z3VsNTYzczg5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dl2l3By1qopSlsxlAD/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUybG1rd3VvejlrZmVnZjhjYXRiOTZiZzdiYTYxeng4bjhhOGIxZXIwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/80p9CFwf1vyw/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyanN5cDB2ZDM4NnV5cndtMWtkbTR4Y3B5Z2JmMTU5d2I4NmsyOGJhdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zbzdiXxWcLazap6Klk/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZmd1ZjVraG9ubTB0eXI0bmcyNjBha2lmMWMzZXEwanY2Yms1dDVtMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yjjgvtUIdo8dIOy5FC/giphy.gif', 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUybTJ6MzFtdGZvZmpvYXMxdXM4ZHNxcjR3M3h1bG1taGVxcnhvd3NwcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VEc4fcyBWDbNQ1K1xu/giphy.gif', 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyNm1hZDUzeTk2ZmQzbTkyems4a2RscGFyaHM0MjZ0ZG1pdWdmY2k4dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/M1D1p6izhybA7xEcan/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyM2dmdmY3MXNqcXI0Z3dyMjY2anNmc3IydmZwMGY2MG1sZDdnd3FpdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IFjSbBHETzzr6GJdwW/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyaWM0cHAyenc2Mm92enE1d2ZkeHU3dGZya3M2MG1nZ2FrazFuMGtrNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0COJ0jTGnPHh8Ua4/giphy.gif'];
const anniversaryGifs = ['https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyNm1sMWhpMDM3Z3luNGtoajdiYmZ0NTM0NG9vN3lyODZpNjc2bGFoOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dHbFJOR3DKfwzxGShh/giphy.gif', 'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUycjNoc2Z2MDI4OTByNHpyenQ5bDN5emtqMHRlZzhzcG95YWtuMzRydCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UyIMHCKMfquVPZiENm/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZTJxNHM2YjgxOWFlNHk5aDgwbXhwYXptNDRxb2VoNnFra2RxNzRvOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/uNMjZh9M46ETsmYhXp/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyYnVyNGh2dGNzbHIzeW1hN253cTFkaTh6YWFjMzV4cWtvaHpnMzcwYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5SACif4RVZQLP3HoA9/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyczduY3RyaXQxdXJxNzlmMjlreTM0ejFhZDB0d25zZHl6M2RlZGFzNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/AKlZLMsCmQr35WpYIJ/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUybW5zcHl0aXdvOTFneXVzYXNwcTJjZjU3bWcya3NweWZubHV1Y2Q1aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NRimUnXEw42dDSUsH3/giphy.gif', 'https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyMGF1dXN4dm4xbXFmdWV0ODF6cTdkdjN3bjExejg4YTc4OTM1MG8wOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HwmLFvgbhcHzcZbHnF/giphy.gif', 'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUydWppcTlsM3FyOWk4YjluNDJ1dGdiNTIwdHl6aTQzMnI1a3Q1dDVqOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pa37AAGzKXoek/giphy.gif', 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyM2R2Y3IyczN4Z2NhcHhlcHg4MGpxNW1veHRndjJkMXgwMmgwcmIxZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fPRwBcYd71Lox1v7p2/giphy.gif', 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyYjVxY2tlZGQxNDd1OWVxcnYxM2FkOWxmaHZ3ZW96Zjl3cGx3czh5NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fsQbx1hX7hPBBpIM5b/giphy.gif', 'https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyZjR4M2tpdHhwenMyZHk2ZjN5MmFvMmpnYjBpNm8wYjAzNjU1dXRseSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKDkDbIDJieKbVm/giphy.gif', 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUybXh0eDVrb3JoM3N3dmVmODZvc202Y3VuZzcweHZidWo0cTN1eDRkNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CqRgIUk16tzcQ/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUycWw0bHA1NDRwdHM4eXAwc3J0ZHE2cHhuMzNvZ2FhMWI5bjd2YXNkNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5GoVLqeAOo6PK/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUydXRkdmlld3VlbDFlbzdmcWozZDN0czVscmtpbWY5OWVsemJ6eDZqayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ndAvMC5LFPNMCzq7m/giphy.gif', 'https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZDBuZXY4ZTE1cG4wNjI1YXRudDNudzdvcGY5NjRobHdjbjQ0cXM4YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7GAs8uxFXdKss7gGvD/giphy.gif', 'https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyNmg4cnc3ZXI2MWp2NXFhZzU1Ym0xZGJuOGRjcThkNXhvMGF1N2dxNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tAr8T8GTQGn7xycujB/giphy.gif', 'https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyOHRvNWxucWFyaWhhdzNnaW5nbDVyOGN6d3c3anQ3OHNpOHRxYjRnbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dyYOjf4hSYLuFPt4lm/giphy.gif'];

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
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    
    // Get dates to check based on day of week
    const datesToCheck = this.getDatesToCheck(today, dayOfWeek);
    
    try {
      const users = await User.find({ isActive: true });
      
      for (const user of users) {
        for (const dateInfo of datesToCheck) {
          // Check birthdays
          if (user.birthday) {
            const birthday = new Date(user.birthday);
            if (birthday.getMonth() + 1 === dateInfo.month && birthday.getDate() === dateInfo.day) {
              const userMention = user.slackUserId ? `<@${user.slackUserId}>` : user.name;
              const message = dateInfo.isWeekend 
                ? `It's ${userMention} birthday this ${dateInfo.dayName}! Wish them a Happy Birthday! 🎂`
                : `Wish ${userMention} a Happy Birthday! 🎂`;
              await this.sendMessage(process.env.SLACK_CHANNEL_ID, message, true, birthdayGifs[Math.floor(Math.random() * birthdayGifs.length)]);
              console.log(`Sent birthday message for ${user.name} (${dateInfo.isWeekend ? 'weekend alert' : 'today'})`);
            }
          }
          
          // Check anniversaries
          if (user.anniversary) {
            const anniversary = new Date(user.anniversary);
            if (anniversary.getMonth() + 1 === dateInfo.month && anniversary.getDate() === dateInfo.day) {
              const yearsCount = today.getFullYear() - anniversary.getFullYear();
              const userMention = user.slackUserId ? `<@${user.slackUserId}>` : user.name;
              const message = dateInfo.isWeekend
                ? `${userMention} celebrates ${yearsCount} year work anniversary this ${dateInfo.dayName}! 🎊`
                : `Celebrate ${userMention}'s ${yearsCount} year work anniversary! 🎉`;
              await this.sendMessage(process.env.SLACK_CHANNEL_ID, message, true, anniversaryGifs[Math.floor(Math.random() * anniversaryGifs.length)]);
              console.log(`Sent anniversary message for ${user.name} (${dateInfo.isWeekend ? 'weekend alert' : 'today'})`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking dates:', error);
    }
  }

  getUserFullName = async (slackUserId) => {
    try {
      const userInfo = await this.app.client.users.info({
        user: slackUserId
      });
      return userInfo.user ? userInfo.user.real_name : null;
    } catch (error) {
      console.error('Error fetching user full name:', error);
      return null;
    }
  }

  getDatesToCheck(today, dayOfWeek) {
    const dates = [];
    
    // Always check today
    dates.push({
      month: today.getMonth() + 1,
      day: today.getDate(),
      isWeekend: false,
      dayName: 'today'
    });
    
    // If it's Friday, also check Saturday and Sunday
    if (dayOfWeek === 5) { // Friday
      // Check Saturday
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + 1);
      dates.push({
        month: saturday.getMonth() + 1,
        day: saturday.getDate(),
        isWeekend: true,
        dayName: 'Saturday'
      });
      
      // Check Sunday
      const sunday = new Date(today);
      sunday.setDate(today.getDate() + 2);
      dates.push({
        month: sunday.getMonth() + 1,
        day: sunday.getDate(),
        isWeekend: true,
        dayName: 'Sunday'
      });
    }else if (dayOfWeek === 6 || dayOfWeek === 7 ) { // Saturday or Sunday
      // If it's Saturday or Sunday, do not check because it's the weekend
      return [];
    }
    
    return dates;
  }

  async listSlackUsers() {
    try {
      const result = await this.app.client.users.list({
        token: process.env.SLACK_BOT_TOKEN
      });
      
      if (result.ok) {
        const activeUsers = result.members.filter(member => 
          !member.is_bot && 
          !member.deleted && 
          member.id !== 'USLACKBOT'
        );
        
        return activeUsers.map(user => ({
          slackUserId: user.id,
          name: user.real_name || user.name,
          email: user.profile?.email || null,
          displayName: user.profile?.display_name || user.name,
          isActive: !user.deleted
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error listing Slack users:', error);
      throw error;
    }
  }

  async linkExistingUsers() {
    try {
      const slackUsers = await this.listSlackUsers();
      const linkResults = {
        linked: 0,
        unmatched: [],
        errors: []
      };
      
      // Get existing users without Slack IDs (or with temp IDs)
      const dbUsers = await User.find({ isActive: true });
      
      for (const dbUser of dbUsers) {
        try {
          // Try to find matching Slack user by name or email
          const matchingSlackUser = slackUsers.find(slackUser => {
            const nameMatch = slackUser.name.toLowerCase().includes(dbUser.name.toLowerCase()) ||
                             dbUser.name.toLowerCase().includes(slackUser.name.toLowerCase());
            const emailMatch = dbUser.email && slackUser.email && 
                              dbUser.email.toLowerCase() === slackUser.email.toLowerCase();
            return nameMatch || emailMatch;
          });
          
          if (matchingSlackUser) {
            dbUser.slackUserId = matchingSlackUser.slackUserId;
            if (matchingSlackUser.email && !dbUser.email) {
              dbUser.email = matchingSlackUser.email;
            }
            await dbUser.save();
            linkResults.linked++;
            console.log(`Linked ${dbUser.name} to Slack user ${matchingSlackUser.name}`);
          } else {
            linkResults.unmatched.push({
              name: dbUser.name,
              email: dbUser.email || 'No email'
            });
          }
        } catch (error) {
          linkResults.errors.push({
            user: dbUser.name,
            error: error.message
          });
        }
      }
      
      console.log(`Link complete: ${linkResults.linked} users linked`);
      if (linkResults.unmatched.length > 0) {
        console.log('Unmatched users:', linkResults.unmatched);
      }
      if (linkResults.errors.length > 0) {
        console.error('Link errors:', linkResults.errors);
      }
      
      return linkResults;
    } catch (error) {
      console.error('Error linking existing users:', error);
      throw error;
    }
  }

  async manualLinkUser(dbUserName, slackUserId) {
    try {
      const dbUser = await User.findOne({ 
        name: { $regex: new RegExp(dbUserName, 'i') },
        isActive: true 
      });
      
      if (!dbUser) {
        throw new Error(`Database user "${dbUserName}" not found`);
      }
      
      // Get Slack user info to verify the ID exists
      const slackUserInfo = await this.app.client.users.info({
        user: slackUserId
      });
      
      if (!slackUserInfo.ok) {
        throw new Error(`Slack user ID "${slackUserId}" not found`);
      }
      
      dbUser.slackUserId = slackUserId;
      if (slackUserInfo.user.profile?.email && !dbUser.email) {
        dbUser.email = slackUserInfo.user.profile.email;
      }
      await dbUser.save();
      
      return {
        dbUser: dbUser.name,
        slackUser: slackUserInfo.user.real_name || slackUserInfo.user.name,
        slackUserId: slackUserId
      };
    } catch (error) {
      console.error('Error manually linking user:', error);
      throw error;
    }
  }

  async resolveSlackUserId(inputText) {
    let slackUserId = null;
    
    // Try to extract user ID from proper mention format first
    let userMatch = inputText.match(/<@(\w+)\|?.*?>/);
    if (userMatch) {
      slackUserId = userMatch[1];
      console.log('Found proper mention format, User ID:', slackUserId);
      return slackUserId;
    }
    
    // Try to extract username from @username format
    userMatch = inputText.match(/@(\w+)/);
    if (userMatch) {
      const username = userMatch[1];
      console.log('Found username format:', username);
      
      // Look up the username to get the actual user ID
      try {
        const userList = await this.app.client.users.list();
        const slackUser = userList.members.find(member => 
          member.name === username || 
          member.profile?.display_name === username ||
          member.real_name?.toLowerCase().replace(/\s+/g, '') === username
        );
        
        if (slackUser) {
          slackUserId = slackUser.id;
          console.log(`Resolved username "${username}" to user ID:`, slackUserId);
          return slackUserId;
        } else {
          throw new Error(`Could not find Slack user with username "${username}"`);
        }
      } catch (lookupError) {
        console.error('Error looking up username:', lookupError);
        throw lookupError;
      }
    }
    
    return null;
  }

  async start() {
    // Help command
    this.app.command('/birthday-help', async ({ ack, respond }) => {
      await ack();
      await respond({
        text: `*Birthday & Anniversary Bot Commands:*\n\n` +
          `• \`/link-users\` - Auto-link existing database users to Slack users\n` +
          `• \`/list-users\` - List all users in the database\n` +
          `• \`/set-birthday @user YYYY-MM-DD\` - Set a user's birthday\n` +
          `• \`/set-anniversary @user YYYY-MM-DD\` - Set a user's work anniversary\n` +
          `• \`/user-info @user\` - Show user's birthday and anniversary\n` +
          `• \`/remove-user @user\` - Remove a user from the database\n` +
          `• \`/add-user "@slackuser\` - Add a new user to the database\n` +
          `• \`/test-message message\` - Send the message as a test to the configured channel\n\n`
      });
    });

    // Link existing users command
    this.app.command('/link-users', async ({ ack, respond }) => {
      await ack();
      
      try {
        const linkResults = await this.linkExistingUsers();
        let responseText = `✅ User linking complete!\n• Linked: ${linkResults.linked} users`;
        
        if (linkResults.unmatched.length > 0) {
          responseText += `\n• Unmatched: ${linkResults.unmatched.length} users\n\n*Unmatched users:*\n`;
          linkResults.unmatched.forEach(user => {
            responseText += `• ${user.name} (${user.email})\n`;
          });
          responseText += `\nUse \`/manual-link "Name" @slackuser\` to link them manually.`;
        }
        
        if (linkResults.errors.length > 0) {
          responseText += `\n• Errors: ${linkResults.errors.length}`;
        }
        
        await respond({ text: responseText });
      } catch (error) {
        await respond({
          text: `❌ Link failed: ${error.message}`
        });
      }
    });

    // Manual link command
    this.app.command('/manual-link', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        const text = command.text.trim();
        const nameMatch = text.match(/^"([^"]+)"\s+(.+)$/);
        
        if (!nameMatch) {
          await respond({ 
            text: '❌ Usage: `/manual-link "Database User Name" @slackuser`\nExample: `/manual-link "John Smith" @john.smith`' 
          });
          return;
        }
        
        const dbUserName = nameMatch[1];
        const userPart = nameMatch[2];
        
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(userPart);
        } catch (error) {
          await respond({ text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.` });
          return;
        }
        
        if (!slackUserId) {
          await respond({ 
            text: '❌ Usage: `/manual-link "Database User Name" @slackuser`\nExample: `/manual-link "John Smith" @john.smith`' 
          });
          return;
        }
        
        const result = await this.manualLinkUser(dbUserName, slackUserId);
        
        await respond({ 
          text: `✅ Successfully linked:\n• Database: ${result.dbUser}\n• Slack: <@${result.slackUserId}> (${result.slackUser})` 
        });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Show unlinked users command
    this.app.command('/unlinked-users', async ({ ack, respond }) => {
      await ack();
      
      try {
        const totalUsers = await User.countDocuments({ isActive: true });
        const unlinkedUsers = await User.find({ 
          isActive: true,
          $or: [
            { slackUserId: { $exists: false } },
            { slackUserId: null },
            { slackUserId: '' }
          ]
        }).sort('name');
        
        if (totalUsers === 0) {
          await respond({ text: '❌ No users found in database! You need to create users first.\n\nUse `/create-user "Full Name" user@email.com` to add users, then link them to Slack.' });
          return;
        }
        
        if (unlinkedUsers.length === 0) {
          await respond({ text: `✅ All ${totalUsers} active users are linked to Slack!` });
          return;
        }
        
        let userList = `*Unlinked Users (${unlinkedUsers.length}):*\n`;
        unlinkedUsers.forEach(user => {
          userList += `• ${user.name}`;
          if (user.email) userList += ` (${user.email})`;
          if (user.birthday) userList += ` - Birthday: ${new Date(user.birthday).toLocaleDateString()}`;
          if (user.anniversary) userList += ` - Anniversary: ${new Date(user.anniversary).toLocaleDateString()}`;
          userList += '\n';
        });
        
        userList += `\nUse \`/manual-link "Name" @slackuser\` to link them.`;
        
        await respond({ text: userList });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // List users command
    this.app.command('/list-users', async ({ ack, respond }) => {
      await ack();
      
      try {
        const users = await User.find({ isActive: true }).sort('name');
        if (users.length === 0) {
          await respond({ text: 'No users found in database.' });
          return;
        }
        
        let userList = '*Active Users in Database:*\n';
        users.forEach(user => {
          const slackMention = user.slackUserId ? `<@${user.slackUserId}>` : '❌ Not linked';
          userList += `• ${slackMention} (${user.name})`;
          if (user.birthday) userList += ` - Birthday: ${new Date(user.birthday).toLocaleDateString()}`;
          if (user.anniversary) userList += ` - Anniversary: ${new Date(user.anniversary).toLocaleDateString()}`;
          userList += '\n';
        });
        
        await respond({ text: userList });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Set birthday command
    this.app.command('/set-birthday', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        const args = command.text.trim().split(' ');
        if (args.length !== 2) {
          await respond({ text: '❌ Usage: `/set-birthday @user YYYY-MM-DD`' });
          return;
        }
        
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(args[0]);
        } catch (error) {
          await respond({ text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.` });
          return;
        }
        
        if (!slackUserId) {
          await respond({ text: '❌ Please mention a user: `/set-birthday @user YYYY-MM-DD`' });
          return;
        }
        
        const dateStr = args[1];
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime()) || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          await respond({ text: '❌ Invalid date format. Use YYYY-MM-DD' });
          return;
        }
        
        let user = await User.findOne({ slackUserId });
        if (!user) {
          // Create user if doesn't exist
          const slackUserInfo = await this.app.client.users.info({
            user: slackUserId
          });
          
          user = await User.create({
            slackUserId,
            name: slackUserInfo.user.real_name || slackUserInfo.user.name,
            email: slackUserInfo.user.profile?.email,
            birthday: date
          });
          await respond({ text: `✅ Created user <@${slackUserId}> and set birthday to ${dateStr}` });
        } else {
          user.birthday = date;
          await user.save();
          await respond({ text: `✅ Updated <@${slackUserId}>'s birthday to ${dateStr}` });
        }
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Set anniversary command
    this.app.command('/set-anniversary', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        const args = command.text.trim().split(' ');
        if (args.length !== 2) {
          await respond({ text: '❌ Usage: `/set-anniversary @user YYYY-MM-DD`' });
          return;
        }
        
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(args[0]);
        } catch (error) {
          await respond({ text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.` });
          return;
        }
        
        if (!slackUserId) {
          await respond({ text: '❌ Please mention a user: `/set-anniversary @user YYYY-MM-DD`' });
          return;
        }
        const dateStr = args[1];
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime()) || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          await respond({ text: '❌ Invalid date format. Use YYYY-MM-DD' });
          return;
        }
        
        let user = await User.findOne({ slackUserId });
        if (!user) {
          // Create user if doesn't exist
          const slackUserInfo = await this.app.client.users.info({
            user: slackUserId
          });
          
          user = await User.create({
            slackUserId,
            name: slackUserInfo.user.real_name || slackUserInfo.user.name,
            email: slackUserInfo.user.profile?.email,
            anniversary: date
          });
          await respond({ text: `✅ Created user <@${slackUserId}> and set anniversary to ${dateStr}` });
        } else {
          user.anniversary = date;
          await user.save();
          await respond({ text: `✅ Updated <@${slackUserId}>'s work anniversary to ${dateStr}` });
        }
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // User info command
    this.app.command('/user-info', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(command.text.trim());
        } catch (error) {
          await respond({ text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.` });
          return;
        }
        
        if (!slackUserId) {
          await respond({ text: '❌ Please mention a user: `/user-info @user`' });
          return;
        }
        const user = await User.findOne({ slackUserId });
        
        if (!user) {
          await respond({ text: `❌ User <@${slackUserId}> not found in database. Run \`/sync-users\` or set their info.` });
          return;
        }
        
        let info = `*User Information for <@${slackUserId}>:*\n`;
        info += `• Name: ${user.name}\n`;
        info += `• Birthday: ${user.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not set'}\n`;
        info += `• Anniversary: ${user.anniversary ? new Date(user.anniversary).toLocaleDateString() : 'Not set'}\n`;
        info += `• Active: ${user.isActive ? 'Yes' : 'No'}`;
        
        await respond({ text: info });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Remove user command
    this.app.command('/remove-user', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(command.text.trim());
        } catch (error) {
          await respond({ text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.` });
          return;
        }
        
        if (!slackUserId) {
          await respond({ text: '❌ Please mention a user: `/remove-user @user`' });
          return;
        }
        const user = await User.findOne({ slackUserId });
        
        if (!user) {
          await respond({ text: `❌ User <@${slackUserId}> not found in database.` });
          return;
        }
        
        user.isActive = false;
        await user.save();
        
        await respond({ text: `✅ User <@${slackUserId}> has been deactivated.` });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    //add-user command
    this.app.command('/add-user', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        const args = command.text.trim().split(' ');
        if (args.length !== 1) {
          await respond({ text: '❌ Usage: `/add-user @slackuser`' });
          return;
        }

        const slackUserId = args[1];
        // get full name from slack API
        const fullName = await this.getUserFullName(slackUserId);

        // Create the user in the database
        const user = new User({ name: fullName, slackUserId });
        await user.save();

        await respond({ text: `✅ User <@${slackUserId}> has been added.` });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Test message command
    this.app.command('/test-message', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        console.log('Test message command text:', JSON.stringify(command.text));

        //  Extract the message from the command text
        const testMessage = command.text.trim();
        if (!testMessage) {
          await respond({ text: '❌ Please provide a message to send. Usage: `/test-message message`' });
          return;
        }
        
        await this.sendMessage(process.env.SLACK_CHANNEL_ID, testMessage, false);
        await respond({ text: `✅ Test message sent` });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });
    
    await this.app.start();
    console.log('Slack bot is running!');
  }
}

module.exports = SlackService;