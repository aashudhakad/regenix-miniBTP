// controllers/dashboardController.js
const Session = require('../models/Session');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Get user's rehabilitation dashboard summary
exports.getUserDashboardSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get completed sessions
    const sessions = await Session.find({ 
      userId,
      completed: true,
      endTime: { $exists: true }
    });
    
    // Calculate total time spent
    let totalTimeInMinutes = 0;
    sessions.forEach(session => {
      if (session.endTime && session.startTime) {
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60); // Convert to minutes
        totalTimeInMinutes += duration;
      }
    });
    
    // Calculate average session duration
    const averageSessionDuration = sessions.length > 0 ? Math.round(totalTimeInMinutes / sessions.length) : 0;
    
    // Get exercise distribution - CHANGED FROM exerciseType to exercise
    const exerciseDistribution = await Session.aggregate([
      { $match: { 
          userId: new ObjectId(userId),
          completed: true  // Only count completed sessions
        } 
      },
      { $group: {
          _id: '$exercise',  // CHANGED FROM exerciseType to exercise 
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Determine most performed exercise
    let mostPerformedExercise = exerciseDistribution.length > 0 ? exerciseDistribution[0]._id : null;
    
    // Format exercise distribution
    const formattedExerciseDistribution = exerciseDistribution.map(item => ({
      exercise: item._id,
      count: item.count
    }));
    
    return res.status(200).json({
      overview: {
        totalSessions: sessions.length,
        totalTimeSpent: Math.round(totalTimeInMinutes),
        averageSessionDuration,
        mostPerformedExercise
      },
      exerciseDistribution: formattedExerciseDistribution
    });
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};