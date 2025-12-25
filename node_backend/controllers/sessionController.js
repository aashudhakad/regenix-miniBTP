// controllers/sessionController.js
const Session = require('../models/Session');
const SessionLog = require('../models/SessionLog');

// Create a new exercise session
exports.createSession = async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    const { exercise, totalSets, targetReps } = req.body;
    
    const newSession = new Session({
      userId, // Now using authenticated user's ID
      exercise,
      totalSets: totalSets || 3,
      targetReps: targetReps || 10
    });
    
    await newSession.save();
    
    return res.status(201).json({ 
      success: true, 
      data: newSession 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// Save session logs received from frontend
// Modify saveSessionLogs controller
// Update the saveSessionLogs controller in sessionController.js
exports.saveSessionLogs = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { setNumber, repCount, logs } = req.body;

    console.log(`Received log data for session ${sessionId}, set ${setNumber}, with ${logs.length} logs`);

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Explicitly find logs for this specific set
    let sessionLog = await SessionLog.findOne({ 
      sessionId, 
      setNumber: setNumber // Ensure we're finding the correct set
    });
    
    if (sessionLog) {
      // Update existing log for this set
      sessionLog.logs.push(...logs);
      sessionLog.repCount = repCount;
      await sessionLog.save();
    } else {
      // Create new log for this set
      sessionLog = new SessionLog({
        sessionId, 
        setNumber,
        repCount,
        logs
      });
      await sessionLog.save();
    }

    // Update set completion
    if (sessionLog.repCount >= session.targetReps) {
      // Check if this set is already marked as completed
      const existingCompletedSets = await SessionLog.countDocuments({
        sessionId,
        repCount: { $gte: session.targetReps }
      });
      
      // Only update if this is a new completed set
      if (session.completedSets < existingCompletedSets) {
        session.completedSets = existingCompletedSets;
        if (session.completedSets >= session.totalSets) {
          session.completed = true;
          session.endTime = new Date();
        }
        await session.save();
      }
    }

    res.json({ 
      success: true,
      session, 
      sessionLog 
    });
  } catch (error) {
    console.error('Error saving logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete a session
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration, accuracyScore } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.duration = duration;
    session.accuracyScore = accuracyScore;
    session.endTime = new Date();
    session.completed = true;

    await calculateSessionScore(sessionId);
    await session.save();

    const updatedSession = await Session.findById(sessionId);
    
    return res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to calculate session score
async function calculateSessionScore(sessionId) {
  try {
    const session = await Session.findById(sessionId);
    if (!session) return;
    
    const sessionLogs = await SessionLog.find({ sessionId });
    if (!sessionLogs.length) return;
    
    let totalScore = 0;
    let scoreCount = 0;
    
    sessionLogs.forEach(setLog => {
      setLog.logs.forEach(log => {
        if (log.repScore !== undefined) {
          totalScore += log.repScore;
          scoreCount++;
        }
      });
    });
    
    if (scoreCount > 0) {
      session.overallScore = Math.round(totalScore / scoreCount);
      
      if (session.overallScore >= 90) {
        session.scoreLabel = 'Excellent';
      } else if (session.overallScore >= 75) {
        session.scoreLabel = 'Good';
      } else if (session.overallScore >= 60) {
        session.scoreLabel = 'Average';
      } else {
        session.scoreLabel = 'Needs Improvement';
      }
      await session.save();
    }
  } catch (error) {
    console.error('Error calculating session score:', error);
  }
}

// Get all sessions for a user
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get session details with logs
exports.getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const sessionLogs = await SessionLog.find({ sessionId })
      .sort({ setNumber: 1 });
    
    return res.status(200).json({
      success: true,
      data: {
        session,
        logs: sessionLogs
      }
    });
  } catch (error) {
    console.error('Error getting session details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get session summary with statistics
exports.getSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const sessionLogs = await SessionLog.find({ sessionId });
    const setStats = [];
    
    for (const log of sessionLogs) {
      const feedbackItems = {};
      log.logs.forEach(entry => {
        if (entry.feedback) {
          feedbackItems[entry.feedback] = (feedbackItems[entry.feedback] || 0) + 1;
        }
      });
      
      const commonFeedback = Object.entries(feedbackItems)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(item => item[0]);
      
      let totalScore = 0;
      let scoreCount = 0;
      log.logs.forEach(entry => {
        if (entry.repScore !== undefined) {
          totalScore += entry.repScore;
          scoreCount++;
        }
      });
      
      const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
      
      setStats.push({
        setNumber: log.setNumber,
        repCount: log.repCount,
        averageScore,
        commonFeedback
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        session,
        setStats,
        totalSets: session.totalSets,
        completedSets: session.completedSets,
        overallScore: session.overallScore,
        scoreLabel: session.scoreLabel
      }
    });
  } catch (error) {
    console.error('Error getting session summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's previous sessions with summary info
// Get user's previous sessions with summary info
exports.getUserSessionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find and delete incomplete sessions with 0 completed sets
    await Session.deleteMany({ 
      userId, 
      completed: false, 
      completedSets: 0 
    });

    // Now retrieve only completed sessions
    const sessions = await Session.find({ 
      userId,
      completed: true
    })
      .sort({ createdAt: -1 })
      .select('exercise startTime endTime completed overallScore scoreLabel totalSets completedSets');
    
    const formattedSessions = sessions.map(session => {
      const startTime = new Date(session.startTime);
      let duration = null;
      
      if (session.endTime) {
        const endTime = new Date(session.endTime);
        duration = Math.round((endTime - startTime) / 1000);
      }
      
      return {
        id: session._id,
        exercise: session.exercise,
        startTime: startTime,
        completed: session.completed,
        duration: duration,
        score: session.overallScore || 0,
        scoreLabel: session.scoreLabel || 'Not Rated',
        progress: `${session.completedSets}/${session.totalSets} sets`
      };
    });
    
    return res.status(200).json({
      success: true,
      count: formattedSessions.length,
      data: formattedSessions
    });
  } catch (error) {
    console.error('Error getting user session history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add this middleware in sessionController.js
exports.checkSessionOwnership = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        message: 'Session not found' 
      });
    }
    
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized access to session' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};