// routes/reportRoutes.js
const express = require('express');
const { getSpiderData } = require('../controllers/reportController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/spider', auth, getSpiderData);

module.exports = router;