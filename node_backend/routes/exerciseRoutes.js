// routes/exerciseRoutes.js
const express = require('express');
const { getExercises } = require('../controllers/exerciseController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getExercises);

module.exports = router;