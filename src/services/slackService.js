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
            const userMention = user.slackUserId ? `<@${user.slackUserId}>` : user.name;
            const message = `Wish ${userMention} a Happy Birthday! 🎂`;
            await this.sendMessage(process.env.SLACK_CHANNEL_ID, message, true, 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG4wZW9qam1ycm9qajFweTRub2Y1a2VreWF6OXk2NWZvdjhkeTFueCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mcJohbfGPATW8/giphy.gif');
            console.log(`Sent birthday message for ${user.name}`);
          }
        }
        
        if (user.anniversary) {
          const anniversary = new Date(user.anniversary);
          if (anniversary.getMonth() + 1 === month && anniversary.getDate() === day) {
            const yearsCount = today.getFullYear() - anniversary.getFullYear();
            const userMention = user.slackUserId ? `<@${user.slackUserId}>` : user.name;
            const message = `Celebrate ${userMention}'s ${yearsCount} year work anniversary! 🎉`;
            await this.sendMessage(process.env.SLACK_CHANNEL_ID, message, true, 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzI3dmVmYjE4dGNqa3hobjUxY2N4cWQ2NWVqNWVzMzNueHpkMXg0eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NTCNn803PAxHDWkzqz/giphy.gif');
            console.log(`Sent anniversary message for ${user.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking dates:', error);
    }
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
          `• \`/manual-link "Database Name" @slackuser\` - Manually link a specific user\n` +
          `• \`/list-users\` - List all users in the database\n` +
          `• \`/unlinked-users\` - Show users without Slack IDs\n` +
          `• \`/set-birthday @user YYYY-MM-DD\` - Set a user's birthday\n` +
          `• \`/set-anniversary @user YYYY-MM-DD\` - Set a user's work anniversary\n` +
          `• \`/user-info @user\` - Show user's birthday and anniversary\n` +
          `• \`/remove-user @user\` - Remove a user from the database\n` +
          `• \`/test-message @user\` - Send a test birthday message for a user`
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

    // Test message command
    this.app.command('/test-message', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        console.log('Test message command text:', JSON.stringify(command.text));
        
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(command.text.trim());
        } catch (error) {
          await respond({ text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.` });
          return;
        }
        
        if (!slackUserId) {
          await respond({ 
            text: `❌ Please mention a user: \`/test-message @user\`\nReceived: "${command.text}"\nTry typing @ and selecting a user from the dropdown.` 
          });
          return;
        }
        
        const user = await User.findOne({ slackUserId });
        
        if (!user) {
          await respond({ 
            text: `❌ User <@${slackUserId}> not found in database. They may not be linked yet. Run \`/unlinked-users\` to see who needs linking.` 
          });
          return;
        }
        
        const userMention = `<@${user.slackUserId}>`;
        const testMessage = `🎉 TEST: Wish ${userMention} a Happy Birthday! 🎂`;
        
        await this.sendMessage(process.env.SLACK_CHANNEL_ID, testMessage, false);
        await respond({ text: `✅ Test message sent for <@${slackUserId}> (${user.name})` });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });
    
    await this.app.start();
    console.log('Slack bot is running!');
  }
}

module.exports = SlackService;