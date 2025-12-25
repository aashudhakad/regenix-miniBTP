// controllers/plannerController.js
const Planner = require('../models/Planner');
const { generateWeeklyPlan } = require('../services/plannerService');

// Get AI-generated planner for user
exports.getPlanner = async (req, res) => {
  try {
    // First check if user already has a plan for current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to Sunday
    
    let planner = await Planner.findOne({
      userId: req.user._id,
      weekStartDate: { $gte: startOfWeek }
    });
    
    // If no plan exists, generate one
    if (!planner) {
      const plan = generateWeeklyPlan(req.user);
      
      planner = {
        userId: req.user._id,
        weekStartDate: startOfWeek,
        plan
      };
    }
    
    res.status(200).json({
      success: true,
      data: planner
    });
  } catch (error) {
    console.error('Planner generation error:', error);
    res.status(500).json({ error: 'Server error while generating planner' });
  }
};

// Save custom plan
exports.savePlanner = async (req, res) => {
  try {
    const { weekStartDate, plan } = req.body;
    
    // Create or update planner
    const planner = await Planner.findOneAndUpdate(
      { 
        userId: req.user._id,
        weekStartDate: new Date(weekStartDate)
      },
      {
        userId: req.user._id,
        weekStartDate: new Date(weekStartDate),
        plan
      },
      { new: true, upsert: true }
    );
    
    res.status(201).json({
      success: true,
      data: planner
    });
  } catch (error) {
    console.error('Planner save error:', error);
    res.status(500).json({ error: 'Server error while saving planner' });
  }
};
