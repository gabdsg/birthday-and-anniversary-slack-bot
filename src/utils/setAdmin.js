require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../db/connection");

const SLACK_ID = /^<?@?(U[A-Z0-9]+)\|?[^>]*>?$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Bootstrap for the first admin. Every slash command is admin-gated, so a fresh
// deployment has nobody who can run /set-admin -- this is the way in.
async function setAdmin(identifier, name) {
  await connectDB();

  const slackUserId = identifier.match(SLACK_ID)?.[1];
  const query = slackUserId
    ? { slackUserId }
    : { email: new RegExp(`^${escapeRegex(identifier)}$`, "i") };

  let user = await User.findOneAndUpdate(query, { isAdmin: true }, { new: true });

  // An empty database has nobody to promote, so allow creating the first admin
  // outright. Requires a Slack ID because that is what the commands match on.
  if (!user && slackUserId && name) {
    user = await User.create({ slackUserId, name, isAdmin: true });
    console.log("Created a new user row.");
  }

  if (!user) {
    console.error(`No user matched "${identifier}".`);
    console.error(
      slackUserId
        ? 'Pass a display name to create them: pnpm set-admin U012345 "Your Name"'
        : "Add them first with /add-user, pnpm import-csv, or pass a Slack user ID and a name."
    );
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log(`${user.name} (${user.slackUserId || "unlinked"}) is now an admin.`);
  await mongoose.connection.close();
}

if (require.main === module) {
  const [identifier, name] = process.argv.slice(2);

  if (!identifier) {
    console.error("Usage: pnpm set-admin <slack-user-id|email> [\"Full Name\"]");
    console.error("Examples:");
    console.error("  pnpm set-admin you@yourcompany.com");
    console.error('  pnpm set-admin U012345 "Your Name"');
    process.exit(1);
  }

  setAdmin(identifier, name).catch((error) => {
    console.error("Failed to set admin:", error);
    process.exit(1);
  });
}
