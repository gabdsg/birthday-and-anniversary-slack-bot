const { App } = require("@slack/bolt");
const User = require("../models/User");
const Question = require("../models/Question");
const { checkAdminAccess } = require("../utils/adminCheck");
const {
  fallsOn,
  getDatesToCheck,
  parseDateOnly,
  yearsSince,
  zonedParts,
} = require("../utils/dates");

const birthdayGifs = [
  "https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyMTZnbzh5OWloMXZhdjNta2kwZHM0Z2xud3dva21ocnd0dWZlaHdrbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9rO5Aksmn0dHQKXJAu/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyeHRhNXVlN2lyd3Q4c3AzNjNzd3Z2bWY4NTdvcjI2YW5pZDlsMWx2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wGKrkvHxZT6PVpw635/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyYjY1cndsMmk0dThydGhzc3BkM254anlwd3EzMTVhZHI3M3hiNTYxaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hkE6wynetELGa7xOjq/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyMmdlc2UwbTNhNTkweTh3N2h3eWpkZTY3anM3c2V2Mm9vYXRrc2V2ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Im6d35ebkCIiGzonjI/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZjh1Y2FscDg1MWdtaTA0Y3pkN3MybmRkbDluY2hhaWg4a3ZyNWd4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/g5R9dok94mrIvplmZd/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyOXB3dWVvN3VmNXc1cXZwdXg0b2hub3N1c3lqaGxiMzRjczl2MWNicCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WRL7YgP42OKns22wRD/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyenFiYWpndXdhaThmN2xpZGhmZmEyMGFqdHJ3Z3dsbnpzYWx5NDVvayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/D7iOxcaMv82RTpCNpx/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyM2g2ZGlncnV6OHB1M3Fid2JjOGo5d3hxY285dWdqc3FsZzZ4cnp6cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zKSncwDt0kVtMMhGaG/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyOGR0c2N6eWF5MDNqZnh5NWlydXgwcWY4dzFhY3IxYnBkaTZiYm1mMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JksahSdnH6BX1WEtlc/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUycXJqbzRwYjZhc2FhbjQ5eWplOG9lcHVpNnozaDk3Z3VsNTYzczg5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dl2l3By1qopSlsxlAD/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUybG1rd3VvejlrZmVnZjhjYXRiOTZiZzdiYTYxeng4bjhhOGIxZXIwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/80p9CFwf1vyw/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyanN5cDB2ZDM4NnV5cndtMWtkbTR4Y3B5Z2JmMTU5d2I4NmsyOGJhdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zbzdiXxWcLazap6Klk/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZmd1ZjVraG9ubTB0eXI0bmcyNjBha2lmMWMzZXEwanY2Yms1dDVtMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yjjgvtUIdo8dIOy5FC/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUybTJ6MzFtdGZvZmpvYXMxdXM4ZHNxcjR3M3h1bG1taGVxcnhvd3NwcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VEc4fcyBWDbNQ1K1xu/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyNm1hZDUzeTk2ZmQzbTkyems4a2RscGFyaHM0MjZ0ZG1pdWdmY2k4dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/M1D1p6izhybA7xEcan/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyM2dmdmY3MXNqcXI0Z3dyMjY2anNmc3IydmZwMGY2MG1sZDdnd3FpdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/IFjSbBHETzzr6GJdwW/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyaWM0cHAyenc2Mm92enE1d2ZkeHU3dGZya3M2MG1nZ2FrazFuMGtrNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0COJ0jTGnPHh8Ua4/giphy.gif",
];
const anniversaryGifs = [
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyNm1sMWhpMDM3Z3luNGtoajdiYmZ0NTM0NG9vN3lyODZpNjc2bGFoOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dHbFJOR3DKfwzxGShh/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUycjNoc2Z2MDI4OTByNHpyenQ5bDN5emtqMHRlZzhzcG95YWtuMzRydCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UyIMHCKMfquVPZiENm/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZTJxNHM2YjgxOWFlNHk5aDgwbXhwYXptNDRxb2VoNnFra2RxNzRvOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/uNMjZh9M46ETsmYhXp/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyYnVyNGh2dGNzbHIzeW1hN253cTFkaTh6YWFjMzV4cWtvaHpnMzcwYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5SACif4RVZQLP3HoA9/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyczduY3RyaXQxdXJxNzlmMjlreTM0ejFhZDB0d25zZHl6M2RlZGFzNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/AKlZLMsCmQr35WpYIJ/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUybW5zcHl0aXdvOTFneXVzYXNwcTJjZjU3bWcya3NweWZubHV1Y2Q1aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NRimUnXEw42dDSUsH3/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyMGF1dXN4dm4xbXFmdWV0ODF6cTdkdjN3bjExejg4YTc4OTM1MG8wOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HwmLFvgbhcHzcZbHnF/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUydWppcTlsM3FyOWk4YjluNDJ1dGdiNTIwdHl6aTQzMnI1a3Q1dDVqOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pa37AAGzKXoek/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyM2R2Y3IyczN4Z2NhcHhlcHg4MGpxNW1veHRndjJkMXgwMmgwcmIxZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fPRwBcYd71Lox1v7p2/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyYjVxY2tlZGQxNDd1OWVxcnYxM2FkOWxmaHZ3ZW96Zjl3cGx3czh5NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fsQbx1hX7hPBBpIM5b/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyZjR4M2tpdHhwenMyZHk2ZjN5MmFvMmpnYjBpNm8wYjAzNjU1dXRseSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKDkDbIDJieKbVm/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUybXh0eDVrb3JoM3N3dmVmODZvc202Y3VuZzcweHZidWo0cTN1eDRkNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/CqRgIUk16tzcQ/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUycWw0bHA1NDRwdHM4eXAwc3J0ZHE2cHhuMzNvZ2FhMWI5bjd2YXNkNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5GoVLqeAOo6PK/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUydXRkdmlld3VlbDFlbzdmcWozZDN0czVscmtpbWY5OWVsemJ6eDZqayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ndAvMC5LFPNMCzq7m/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyZDBuZXY4ZTE1cG4wNjI1YXRudDNudzdvcGY5NjRobHdjbjQ0cXM4YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7GAs8uxFXdKss7gGvD/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyNmg4cnc3ZXI2MWp2NXFhZzU1Ym0xZGJuOGRjcThkNXhvMGF1N2dxNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tAr8T8GTQGn7xycujB/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUyOHRvNWxucWFyaWhhdzNnaW5nbDVyOGN6d3c3anQ3OHNpOHRxYjRnbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dyYOjf4hSYLuFPt4lm/giphy.gif",
];

class SlackService {
  constructor() {
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: process.env.SLACK_APP_TOKEN,
    });
  }

  /** Posts to Slack. Returns false (never throws) so one bad send cannot abort a batch. */
  async sendMessage(channel, message, includeGif = false, gifUrl) {
    if (!channel) {
      console.error("Error sending message: no channel configured");
      return false;
    }

    try {
      const messagePayload = { channel, text: message };

      if (includeGif && gifUrl) {
        messagePayload.blocks = [
          { type: "section", text: { type: "mrkdwn", text: message } },
          { type: "image", image_url: gifUrl, alt_text: message },
        ];
      }

      await this.app.client.chat.postMessage(messagePayload);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  async checkAndSendMessages() {
    const today = zonedParts();
    const datesToCheck = getDatesToCheck(today);

    if (datesToCheck.length === 0) {
      console.log("Today is a weekend, skipping check.");
      return;
    }

    try {
      // ponytail: whole active roster into memory, then filter. "Same month/day, any
      // year" cannot be indexed against a stored Date anyway. Move to a stored MM-DD
      // field with a range query if this ever passes a few thousand people.
      const users = await User.find({ isActive: true });

      for (const user of users) {
        for (const dateInfo of datesToCheck) {
          const mention = user.slackUserId
            ? `<@${user.slackUserId}>`
            : user.name;

          if (user.birthday && fallsOn(user.birthday, dateInfo)) {
            await this.announce(
              user,
              dateInfo,
              dateInfo.isWeekend
                ? `It's ${mention}'s birthday this ${dateInfo.dayName}! Wish them a Happy Birthday! 🎂`
                : `Wish ${mention} a Happy Birthday! 🎂`,
              birthdayGifs
            );
          }

          if (user.anniversary && fallsOn(user.anniversary, dateInfo)) {
            // Count years against the date being announced, not against today --
            // on Fri Dec 31 the Saturday we announce belongs to the next year.
            const years = yearsSince(user.anniversary, dateInfo);
            if (years < 1) continue; // nothing to celebrate on day one

            await this.announce(
              user,
              dateInfo,
              dateInfo.isWeekend
                ? `${mention} celebrates ${years} year work anniversary this ${dateInfo.dayName}! 🎊`
                : `Celebrate ${mention}'s ${years} year work anniversary! 🎉`,
              anniversaryGifs
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking dates:", error);
    }
  }

  async announce(user, dateInfo, message, gifs) {
    const sent = await this.sendMessage(
      process.env.SLACK_CHANNEL_ID,
      message,
      true,
      gifs[Math.floor(Math.random() * gifs.length)]
    );
    const when = dateInfo.isWeekend ? `${dateInfo.dayName} alert` : "today";
    console.log(
      sent
        ? `Sent celebration message for ${user.name} (${when})`
        : `FAILED to send celebration message for ${user.name} (${when})`
    );
  }

  sendWatercoolerQuestion = async () => {
    try {
      let [question] = await Question.aggregate([
        { $match: { isUsed: false } },
        { $sample: { size: 1 } },
      ]);

      if (!question) {
        // Pool exhausted. Recycle rather than going silent forever.
        const { modifiedCount } = await Question.updateMany(
          { isUsed: true },
          { isUsed: false }
        );
        if (modifiedCount === 0) {
          console.log("No watercooler questions in the database, skipping.");
          return;
        }
        console.log(`Recycled ${modifiedCount} watercooler questions.`);
        [question] = await Question.aggregate([{ $sample: { size: 1 } }]);
      }

      const sent = await this.sendMessage(
        process.env.SLACK_WATERCOOLER_CHANNEL_ID,
        question.text
      );
      if (!sent) return; // leave it unused so the next run retries it

      await Question.findByIdAndUpdate(question._id, { isUsed: true });
      console.log(`Sent watercooler question: ${question.text}`);
    } catch (error) {
      console.error("Error sending watercooler question:", error);
    }
  };

  getUserFullName = async (slackUserId) => {
    try {
      const userInfo = await this.app.client.users.info({
        user: slackUserId,
      });
      return userInfo.user ? userInfo.user.real_name : null;
    } catch (error) {
      console.error("Error fetching user full name:", error);
      return null;
    }
  };

  /**
   * Every member of the workspace. users.list is cursor-paginated -- a single
   * call silently truncates at one page, which is why lookups used to fail in
   * workspaces past ~200 people.
   */
  async fetchAllSlackMembers() {
    const members = [];
    let cursor;

    do {
      const result = await this.app.client.users.list({ limit: 200, cursor });
      members.push(...(result.members || []));
      cursor = result.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return members;
  }

  async listSlackUsers() {
    try {
      const members = await this.fetchAllSlackMembers();

      return members
        .filter(
          (member) =>
            !member.is_bot && !member.deleted && member.id !== "USLACKBOT"
        )
        .map((user) => ({
          slackUserId: user.id,
          name: user.real_name || user.name,
          email: user.profile?.email || null,
          displayName: user.profile?.display_name || user.name,
          isActive: !user.deleted,
        }));
    } catch (error) {
      console.error("Error listing Slack users:", error);
      throw error;
    }
  }

  /**
   * Links unlinked DB users to Slack accounts by email, then by exact full name.
   * Substring matching used to be allowed here and happily linked "Jon" to
   * "Jonathan" -- a wrong link posts someone else's birthday to the whole company,
   * so anything less than an exact match is left for /manual-link.
   */
  async linkExistingUsers() {
    try {
      const slackUsers = await this.listSlackUsers();
      const linkResults = { linked: 0, unmatched: [], errors: [] };

      const byEmail = new Map();
      const byName = new Map();
      for (const slackUser of slackUsers) {
        if (slackUser.email) byEmail.set(slackUser.email.toLowerCase(), slackUser);
        // Ambiguous names are dropped: two "John Smith"s must be linked by hand.
        const nameKey = slackUser.name?.trim().toLowerCase();
        if (nameKey) byName.set(nameKey, byName.has(nameKey) ? null : slackUser);
      }

      const dbUsers = await User.find({ isActive: true });
      const claimed = new Set(
        dbUsers.map((user) => user.slackUserId).filter(Boolean)
      );

      for (const dbUser of dbUsers) {
        if (dbUser.slackUserId) continue; // already linked, leave it alone

        try {
          const match =
            (dbUser.email && byEmail.get(dbUser.email.trim().toLowerCase())) ||
            byName.get(dbUser.name?.trim().toLowerCase()) ||
            null;

          if (!match || claimed.has(match.slackUserId)) {
            linkResults.unmatched.push({
              name: dbUser.name,
              email: dbUser.email || "No email",
            });
            continue;
          }

          dbUser.slackUserId = match.slackUserId;
          if (match.email && !dbUser.email) dbUser.email = match.email;
          await dbUser.save();
          claimed.add(match.slackUserId);
          linkResults.linked++;
          console.log(`Linked ${dbUser.name} to Slack user ${match.name}`);
        } catch (error) {
          linkResults.errors.push({ user: dbUser.name, error: error.message });
        }
      }

      console.log(`Link complete: ${linkResults.linked} users linked`);
      if (linkResults.unmatched.length > 0) {
        console.log("Unmatched users:", linkResults.unmatched);
      }
      if (linkResults.errors.length > 0) {
        console.error("Link errors:", linkResults.errors);
      }

      return linkResults;
    } catch (error) {
      console.error("Error linking existing users:", error);
      throw error;
    }
  }

  async manualLinkUser(dbUserName, slackUserId) {
    try {
      const dbUser = await User.findOne({
        name: { $regex: new RegExp(dbUserName, "i") },
        isActive: true,
      });

      if (!dbUser) {
        throw new Error(`Database user "${dbUserName}" not found`);
      }

      // Get Slack user info to verify the ID exists
      const slackUserInfo = await this.app.client.users.info({
        user: slackUserId,
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
        slackUserId: slackUserId,
      };
    } catch (error) {
      console.error("Error manually linking user:", error);
      throw error;
    }
  }

  async resolveSlackUserId(inputText) {
    let slackUserId = null;

    // Try to extract user ID from proper mention format first
    let userMatch = inputText.match(/<@(\w+)\|?.*?>/);
    if (userMatch) {
      slackUserId = userMatch[1];
      console.log("Found proper mention format, User ID:", slackUserId);
      return slackUserId;
    }

    // Try to extract username from @username format
    userMatch = inputText.match(/@(\w+)/);
    if (userMatch) {
      const username = userMatch[1];

      // Look up the username to get the actual user ID
      try {
        const members = await this.fetchAllSlackMembers();

        let slackUser = members.find(
          (member) =>
            member.name === username ||
            member.profile?.display_name === username ||
            member.real_name?.toLowerCase().replace(/\s+/g, "") === username
        );

        if (!slackUser) {
          slackUser = members.find(
            (member) => member.name === inputText.replace("@", "")
          );
        }

        if (slackUser) {
          slackUserId = slackUser.id;
          console.log(
            `Resolved username "${username}" to user ID:`,
            slackUserId
          );
          return slackUserId;
        } else {
          throw new Error(
            `Could not find Slack user with username "${username}"`
          );
        }
      } catch (lookupError) {
        console.error("Error looking up username:", lookupError);
        throw lookupError;
      }
    }

    return null;
  }

  async start() {
    // Help command
    this.app.command("/celebration-bot-help", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/celebration-bot-help");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      await respond({
        text:
          `*Celebrations Bot Commands (Admin Only):*\n\n` +
          `*User Management:*\n` +
          `• \`/add-user @user\` - Add a new user to the database\n` +
          `• \`/set-admin @user\` - Grant admin rights to a user\n` +
          `• \`/set-birthday @user YYYY-MM-DD\` - Set a user's birthday\n` +
          `• \`/set-anniversary @user YYYY-MM-DD\` - Set a user's work anniversary\n` +
          `• \`/remove-user @user\` - Remove a user from the database\n` +
          `• \`/link-users\` - Auto-link database users to Slack users\n` +
          `• \`/manual-link "DB Name" @user\` - Manually link a user\n` +
          `• \`/unlinked-users\` - Show users not linked to Slack\n\n` +
          `*Information:*\n` +
          `• \`/celebration-bot-help\` - Show this list\n` +
          `• \`/list-users\` - List all users in the database\n` +
          `• \`/user-info @user\` - Show user's birthday and anniversary\n\n` +
          `*Testing:*\n` +
          `• \`/test-message message\` - Send a test message to the channel\n`,
      });
    });

    // Link existing users command
    this.app.command("/link-users", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/link-users");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        const linkResults = await this.linkExistingUsers();
        let responseText = `✅ User linking complete!\n• Linked: ${linkResults.linked} users`;

        if (linkResults.unmatched.length > 0) {
          responseText += `\n• Unmatched: ${linkResults.unmatched.length} users\n\n*Unmatched users:*\n`;
          linkResults.unmatched.forEach((user) => {
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
          text: `❌ Link failed: ${error.message}`,
        });
      }
    });

    // Manual link command
    this.app.command("/manual-link", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/manual-link");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        const text = command.text.trim();
        const nameMatch = text.match(/^"([^"]+)"\s+(.+)$/);

        if (!nameMatch) {
          await respond({
            text: '❌ Usage: `/manual-link "Database User Name" @slackuser`\nExample: `/manual-link "John Smith" @john.smith`',
          });
          return;
        }

        const dbUserName = nameMatch[1];
        const userPart = nameMatch[2];

        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(userPart);
        } catch (error) {
          await respond({
            text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.`,
          });
          return;
        }

        if (!slackUserId) {
          await respond({
            text: '❌ Usage: `/manual-link "Database User Name" @slackuser`\nExample: `/manual-link "John Smith" @john.smith`',
          });
          return;
        }

        const result = await this.manualLinkUser(dbUserName, slackUserId);

        await respond({
          text: `✅ Successfully linked:\n• Database: ${result.dbUser}\n• Slack: <@${result.slackUserId}> (${result.slackUser})`,
        });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Show unlinked users command
    this.app.command("/unlinked-users", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/unlinked-users");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        const totalUsers = await User.countDocuments({ isActive: true });
        const unlinkedUsers = await User.find({
          isActive: true,
          $or: [
            { slackUserId: { $exists: false } },
            { slackUserId: null },
            { slackUserId: "" },
          ],
        }).sort("name");

        if (totalUsers === 0) {
          await respond({
            text: '❌ No users found in database! You need to create users first.\n\nUse `/add-user @user` to add users, or `pnpm import-csv <file>` to bulk import.',
          });
          return;
        }

        if (unlinkedUsers.length === 0) {
          await respond({
            text: `✅ All ${totalUsers} active users are linked to Slack!`,
          });
          return;
        }

        let userList = `*Unlinked Users (${unlinkedUsers.length}):*\n`;
        unlinkedUsers.forEach((user) => {
          userList += `• ${user.name}`;
          if (user.email) userList += ` (${user.email})`;
          if (user.birthday)
            userList += ` - Birthday: ${new Date(
              user.birthday
            ).toLocaleDateString()}`;
          if (user.anniversary)
            userList += ` - Anniversary: ${new Date(
              user.anniversary
            ).toLocaleDateString()}`;
          userList += "\n";
        });

        userList += `\nUse \`/manual-link "Name" @slackuser\` to link them.`;

        await respond({ text: userList });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // List users command
    this.app.command("/list-users", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/list-users");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        const users = await User.find({ isActive: true }).sort("name");
        if (users.length === 0) {
          await respond({ text: "No users found in database." });
          return;
        }

        let userList = "*Active Users in Database:*\n";
        users.forEach((user) => {
          const slackMention = user.slackUserId
            ? `<@${user.slackUserId}>`
            : "❌ Not linked";
          userList += `• ${slackMention} (${user.name})`;
          if (user.birthday)
            userList += ` - Birthday: ${new Date(
              user.birthday
            ).toLocaleDateString()}`;
          if (user.anniversary)
            userList += ` - Anniversary: ${new Date(
              user.anniversary
            ).toLocaleDateString()}`;
          userList += "\n";
        });

        await respond({ text: userList });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Set birthday command
    this.app.command("/set-birthday", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/set-birthday");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        const args = command.text.trim().split(" ");
        if (args.length !== 2) {
          await respond({ text: "❌ Usage: `/set-birthday @user YYYY-MM-DD`" });
          return;
        }

        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(args[0]);
        } catch (error) {
          await respond({
            text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.`,
          });
          return;
        }

        if (!slackUserId) {
          await respond({
            text: "❌ Please mention a user: `/set-birthday @user YYYY-MM-DD`",
          });
          return;
        }

        const dateStr = args[1];
        // parseDateOnly rejects 2024-02-31 instead of silently storing March 2.
        const date = parseDateOnly(dateStr);

        if (!date) {
          await respond({
            text: "❌ Invalid date. Use YYYY-MM-DD, e.g. `1990-05-15`",
          });
          return;
        }

        let user = await User.findOne({ slackUserId });
        if (!user) {
          // Create user if doesn't exist
          const slackUserInfo = await this.app.client.users.info({
            user: slackUserId,
          });

          user = await User.create({
            slackUserId,
            name: slackUserInfo.user.real_name || slackUserInfo.user.name,
            email: slackUserInfo.user.profile?.email,
            birthday: date,
          });
          await respond({
            text: `✅ Created user <@${slackUserId}> and set birthday to ${dateStr}`,
          });
        } else {
          user.birthday = date;
          await user.save();
          await respond({
            text: `✅ Updated <@${slackUserId}>'s birthday to ${dateStr}`,
          });
        }
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Set anniversary command
    this.app.command("/set-anniversary", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/set-anniversary");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        const args = command.text.trim().split(" ");
        if (args.length !== 2) {
          await respond({
            text: "❌ Usage: `/set-anniversary @user YYYY-MM-DD`",
          });
          return;
        }

        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(args[0]);
        } catch (error) {
          await respond({
            text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.`,
          });
          return;
        }

        if (!slackUserId) {
          await respond({
            text: "❌ Please mention a user: `/set-anniversary @user YYYY-MM-DD`",
          });
          return;
        }
        const dateStr = args[1];
        // parseDateOnly rejects 2024-02-31 instead of silently storing March 2.
        const date = parseDateOnly(dateStr);

        if (!date) {
          await respond({
            text: "❌ Invalid date. Use YYYY-MM-DD, e.g. `1990-05-15`",
          });
          return;
        }

        let user = await User.findOne({ slackUserId });
        if (!user) {
          // Create user if doesn't exist
          const slackUserInfo = await this.app.client.users.info({
            user: slackUserId,
          });

          user = await User.create({
            slackUserId,
            name: slackUserInfo.user.real_name || slackUserInfo.user.name,
            email: slackUserInfo.user.profile?.email,
            anniversary: date,
          });
          await respond({
            text: `✅ Created user <@${slackUserId}> and set anniversary to ${dateStr}`,
          });
        } else {
          user.anniversary = date;
          await user.save();
          await respond({
            text: `✅ Updated <@${slackUserId}>'s work anniversary to ${dateStr}`,
          });
        }
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // User info command
    this.app.command("/user-info", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/user-info");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(command.text.trim());
        } catch (error) {
          await respond({
            text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.`,
          });
          return;
        }

        if (!slackUserId) {
          await respond({
            text: "❌ Please mention a user: `/user-info @user`",
          });
          return;
        }
        const user = await User.findOne({ slackUserId });

        if (!user) {
          await respond({
            text: `❌ User <@${slackUserId}> not found in database. Add them with \`/add-user @user\` first.`,
          });
          return;
        }

        let info = `*User Information for <@${slackUserId}>:*\n`;
        info += `• Name: ${user.name}\n`;
        info += `• Birthday: ${
          user.birthday
            ? new Date(user.birthday).toLocaleDateString()
            : "Not set"
        }\n`;
        info += `• Anniversary: ${
          user.anniversary
            ? new Date(user.anniversary).toLocaleDateString()
            : "Not set"
        }\n`;
        info += `• Active: ${user.isActive ? "Yes" : "No"}`;

        await respond({ text: info });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Remove user command
    this.app.command("/remove-user", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/remove-user");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(command.text.trim());
        } catch (error) {
          await respond({
            text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.`,
          });
          return;
        }

        if (!slackUserId) {
          await respond({
            text: "❌ Please mention a user: `/remove-user @user`",
          });
          return;
        }
        const user = await User.findOne({ slackUserId });

        if (!user) {
          await respond({
            text: `❌ User <@${slackUserId}> not found in database.`,
          });
          return;
        }

        user.isActive = false;
        await user.save();

        await respond({
          text: `✅ User <@${slackUserId}> has been deactivated.`,
        });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    //add-user command
    this.app.command("/add-user", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/add-user");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        const args = command.text.trim().split(" ");

        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(args[0]);
        } catch (error) {
          await respond({
            text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.`,
          });
          return;
        }

        if (!slackUserId) {
          await respond({ text: "❌ Please mention a user: `/add-user @user`" });
          return;
        }

        const fullName = await this.getUserFullName(slackUserId);
        if (!fullName) {
          await respond({
            text: `❌ Could not read <@${slackUserId}>'s profile from Slack. Check the \`users:read\` scope.`,
          });
          return;
        }

        // Upsert: slackUserId is uniquely indexed, so re-adding somebody who was
        // deactivated by /remove-user used to blow up with a duplicate key error.
        const existing = await User.findOne({ slackUserId });
        if (existing) {
          const wasInactive = !existing.isActive;
          existing.isActive = true;
          existing.name = fullName;
          await existing.save();
          await respond({
            text: wasInactive
              ? `✅ User <@${slackUserId}> has been reactivated.`
              : `ℹ️ User <@${slackUserId}> is already in the database.`,
          });
          return;
        }

        await User.create({ name: fullName, slackUserId });
        await respond({ text: `✅ User <@${slackUserId}> has been added.` });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Grant admin rights. The FIRST admin has to be created out-of-band with
    // `pnpm set-admin <@user|email>` -- otherwise nobody can call anything.
    this.app.command("/set-admin", async ({ command, ack, respond }) => {
      await ack();

      const adminCheck = await checkAdminAccess(command.user_id, "/set-admin");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        let slackUserId;
        try {
          slackUserId = await this.resolveSlackUserId(command.text.trim());
        } catch (error) {
          await respond({
            text: `❌ ${error.message}. Try typing @ and selecting the user from the dropdown.`,
          });
          return;
        }

        if (!slackUserId) {
          await respond({ text: "❌ Please mention a user: `/set-admin @user`" });
          return;
        }

        const user = await User.findOne({ slackUserId, isActive: true });
        if (!user) {
          await respond({
            text: `❌ User <@${slackUserId}> not found in database. Add them with \`/add-user @user\` first.`,
          });
          return;
        }

        user.isAdmin = true;
        await user.save();
        await respond({ text: `✅ <@${slackUserId}> is now an admin.` });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    // Test message command
    this.app.command("/test-message", async ({ command, ack, respond }) => {
      await ack();

      // Check admin access
      const adminCheck = await checkAdminAccess(command.user_id, "/test-message");
      if (!adminCheck.authorized) {
        await respond({ text: adminCheck.message });
        return;
      }

      try {
        console.log("Test message command text:", JSON.stringify(command.text));

        //  Extract the message from the command text
        const testMessage = command.text.trim();
        if (!testMessage) {
          await respond({
            text: "❌ Please provide a message to send. Usage: `/test-message message`",
          });
          return;
        }

        await this.sendMessage(
          process.env.SLACK_CHANNEL_ID,
          testMessage,
          false
        );
        await respond({ text: `✅ Test message sent` });
      } catch (error) {
        await respond({ text: `❌ Error: ${error.message}` });
      }
    });

    await this.app.start();
    console.log("Slack bot is running!");
  }
}

module.exports = SlackService;
