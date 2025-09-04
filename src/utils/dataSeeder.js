require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../db/connection');

async function seedData() {
  try {
    await connectDB();
    
    const sampleUsers = [
      {
        slackUserId: 'U12345678',
        name: 'John Doe',
        birthday: new Date('1990-05-15'),
        anniversary: new Date('2020-03-01'),
        isActive: true
      },
      {
        slackUserId: 'U87654321',
        name: 'Jane Smith',
        birthday: new Date('1985-09-22'),
        anniversary: new Date('2019-06-15'),
        isActive: true
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ slackUserId: userData.slackUserId });
      if (!existingUser) {
        await User.create(userData);
        console.log(`Created user: ${userData.name}`);
      } else {
        console.log(`User already exists: ${userData.name}`);
      }
    }

    console.log('Data seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedData();
}