const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exercise', exerciseSchema);