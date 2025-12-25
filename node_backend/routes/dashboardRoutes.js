// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getUserDashboardSummary } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');  // Use 'auth' as middleware


// Get user's rehabilitation dashboard summary
router.get('/user/:userId/summary', auth, getUserDashboardSummary);

module.exports = router;