const mongoose = require('mongoose');

const buddyRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate requests
buddyRequestSchema.index({ fromUser: 1, toUser: 1, planId: 1 }, { unique: true });

module.exports = mongoose.model('BuddyRequest', buddyRequestSchema);

