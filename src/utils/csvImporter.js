require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../db/connection');

async function importFromCSV(filePath) {
  try {
    await connectDB();
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = [];
    
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    
    parser.on('error', function(err) {
      console.error('Error parsing CSV:', err.message);
    });
    
    parser.write(fileContent);
    parser.end();
    
    await new Promise(resolve => parser.on('end', resolve));
    
    console.log(`Found ${records.length} records in CSV file`);
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const record of records) {
      try {
        const userData = {
          name: record.name,
          birthday: record.birthday ? new Date(record.birthday) : undefined,
          anniversary: record.anniversary ? new Date(record.anniversary) : undefined,
          isActive: record.is_active !== undefined ? 
            (record.is_active === 'true' || record.is_active === true) : true
        };
        
        // Generate a unique slackUserId if not provided
        if (record.slack_user_id || record.slackUserId) {
          userData.slackUserId = record.slack_user_id || record.slackUserId;
        } else if (userData.name) {
          // Generate a temporary ID based on name if no slack ID provided
          userData.slackUserId = `TEMP_${userData.name.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`;
        }
        
        if (!userData.name) {
          console.log(`Skipping record - missing name: ${JSON.stringify(record)}`);
          skipped++;
          continue;
        }
        
        // Try to find existing user by name if no slackUserId match
        let existingUser = await User.findOne({ slackUserId: userData.slackUserId });
        if (!existingUser && !record.slack_user_id) {
          existingUser = await User.findOne({ name: userData.name });
        }
        
        if (existingUser) {
          // Update with the found user's ID if we matched by name
          if (existingUser.slackUserId !== userData.slackUserId) {
            userData.slackUserId = existingUser.slackUserId;
          }
          await User.updateOne(
            { _id: existingUser._id },
            { $set: userData }
          );
          console.log(`Updated: ${userData.name}`);
          updated++;
        } else {
          await User.create(userData);
          console.log(`Imported: ${userData.name}`);
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
    
    process.exit(0);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.error('Please provide a CSV file path');
    console.log('Usage: npm run import-csv <path-to-csv-file>');
    console.log('Example: npm run import-csv birthdays.csv');
    process.exit(1);
  }
  
  const resolvedPath = path.resolve(csvPath);
  
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }
  
  console.log(`Importing from: ${resolvedPath}`);
  importFromCSV(resolvedPath);
}