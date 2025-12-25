// routes/plannerRoutes.js
const express = require('express');
const { getPlanner, savePlanner } = require('../controllers/plannerController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getPlanner);
router.post('/', auth, savePlanner);

module.exports = router;
