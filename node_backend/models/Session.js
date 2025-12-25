const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exercise: {
    type: String,
    required: true,
    enum: ['squats', 'pushups', 'deadlifts', 'lunges', 'situps', 'bicep_curls']
  },
  duration: {
    type: Number,  // in seconds
    default: 0
  },
  accuracyScore: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  completed: {
    type: Boolean,
    default: false
  },
  totalSets: {
    type: Number,
    default: 3
  },
  completedSets: {
    type: Number,
    default: 0
  },
  targetReps: {
    type: Number,
    default: 10
  },
  overallScore: Number,
  scoreLabel: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Needs Improvement']
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Session', SessionSchema);