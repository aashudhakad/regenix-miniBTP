// controllers/exerciseController.js
const exercises = require('../utils/exercises');

// Get all exercises
exports.getExercises = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: exercises
    });
  } catch (error) {
    console.error('Exercise fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching exercises' });
  }
};
