require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const User = require('../models/User');
const connectDB = require('../db/connection');
const { parseDateOnly } = require('./dates');

/**
 * Dates must land on UTC midnight to match how the bot reads them. ISO strings
 * already parse that way; anything else (5/15/1990) parses as *local* midnight,
 * so re-anchor it to the calendar date it actually names.
 */
function parseCsvDate(value) {
  if (!value) return undefined;

  const iso = parseDateOnly(value);
  if (iso) return iso;

  const loose = new Date(value);
  if (Number.isNaN(loose.getTime())) return null;
  return new Date(
    Date.UTC(loose.getFullYear(), loose.getMonth(), loose.getDate())
  );
}

function readRecords(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (record) => records.push(record))
      .on('error', reject)
      .on('end', () => resolve(records));
  });
}

async function importFromCSV(filePath) {
  await connectDB();

  const records = await readRecords(filePath);
  console.log(`Found ${records.length} records in CSV file`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const name = record.name?.trim();
      if (!name) {
        console.log(`Skipping record - missing name: ${JSON.stringify(record)}`);
        skipped++;
        continue;
      }

      const birthday = parseCsvDate(record.birthday);
      const anniversary = parseCsvDate(record.anniversary);
      if (birthday === null || anniversary === null) {
        console.log(`Skipping ${name} - unparseable date: ${JSON.stringify(record)}`);
        skipped++;
        continue;
      }

      // Only set the keys the CSV actually carries. A blanket $set would wipe
      // existing Slack links every time somebody re-imports a roster without them.
      const userData = { name, isActive: record.is_active === undefined ? true : record.is_active === 'true' };
      if (birthday) userData.birthday = birthday;
      if (anniversary) userData.anniversary = anniversary;
      if (record.email) userData.email = record.email.trim();

      // No fabricated IDs: a made-up slackUserId renders as a broken <@...>
      // mention in the celebration channel and hides the row from /unlinked-users.
      const slackUserId = (record.slack_user_id || record.slackUserId || '').trim();
      if (slackUserId) userData.slackUserId = slackUserId;

      const existingUser = slackUserId
        ? await User.findOne({ slackUserId })
        : await User.findOne({ name });

      if (existingUser) {
        await User.updateOne({ _id: existingUser._id }, { $set: userData });
        console.log(`Updated: ${name}`);
        updated++;
      } else {
        await User.create(userData);
        console.log(`Imported: ${name}`);
        imported++;
      }
    } catch (error) {
      console.error(`Error processing record: ${JSON.stringify(record)}`, error.message);
      skipped++;
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Total records processed: ${records.length}`);
  console.log(`New users imported: ${imported}`);
  console.log(`Existing users updated: ${updated}`);
  console.log(`Records skipped: ${skipped}`);
}

if (require.main === module) {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('Please provide a CSV file path');
    console.log('Usage: pnpm import-csv <path-to-csv-file>');
    console.log('Example: pnpm import-csv birthdays.csv');
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`Importing from: ${resolvedPath}`);
  importFromCSV(resolvedPath)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importFromCSV, parseCsvDate };
