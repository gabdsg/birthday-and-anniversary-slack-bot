const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  slackUserId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
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
  },
  email: {
    type: String,
    required: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.index({ birthday: 1 });
userSchema.index({ anniversary: 1 });

module.exports = mongoose.model('User', userSchema);