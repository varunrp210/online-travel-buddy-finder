const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  maxBuddies: {
    type: Number,
    default: 1,
    min: 1
  },
  currentBuddies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['Planning', 'Active', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  tags: [{
    type: String
  }],
  transportMode: {
    type: String,
    enum: ['Bike', 'Car', 'Bus', 'Train'],
    default: 'Bike'
  },
  transportNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);

