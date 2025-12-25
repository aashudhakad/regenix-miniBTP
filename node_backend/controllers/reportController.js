// controllers/reportController.js
const Session = require('../models/Session');
const { calculateSpiderData } = require('../services/reportService');

// Get spider chart data
exports.getSpiderData = async (req, res) => {
  try {
    // Get all sessions for the user
    const sessions = await Session.find({ userId: req.user._id });
    
    // Calculate spider chart data
    const spiderData = calculateSpiderData(sessions);
    
    res.status(200).json({
      success: true,
      data: spiderData
    });
  } catch (error) {
    console.error('Spider data calculation error:', error);
    res.status(500).json({ error: 'Server error while generating reports' });
  }
};
