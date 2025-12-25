//mdels/Planner.js
const mongoose = require('mongoose');

const planItemSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  exercise: {
    type: String,
    enum: ['squat', 'dumbbell curl', 'lunges', 'push ups', 'deadlift', 'sit ups'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  accuracyTarget: {
    type: Number,
    required: true,
    min: 50,
    max: 100
  }
});

const plannerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  plan: [planItemSchema]
}, {
  timestamps: true
});

const Planner = mongoose.model('Planner', plannerSchema);
module.exports = Planner;
