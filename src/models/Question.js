const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true,
  },
  isUsed: {
    type: Boolean,
    required: true,
    default: false
  },
}, {
  timestamps: true
});

questionSchema.index({ isUsed: 1 });

module.exports = mongoose.model('Question', questionSchema);