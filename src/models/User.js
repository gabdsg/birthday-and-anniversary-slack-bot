const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  slackUserId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  birthday: {
    type: Date,
    required: false
  },
  anniversary: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ birthday: 1 });
userSchema.index({ anniversary: 1 });

module.exports = mongoose.model('User', userSchema);