const express = require('express');
const { register, login, getProfile, editProfile, getSelfByIdFromToken } = require('../controllers/authController');
const auth = require('../middleware/auth');  // Use 'auth' as middleware
const verifyToken = require('../middleware/verifyToken');  // Imported verifyToken middleware

const router = express.Router();

// Define the routes and associate them with controller functions
router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile); // Using 'auth' middleware
router.put('/edit', auth, editProfile);  // Using 'auth' middleware
// router.get('/:id', auth, getUserById);  // Using 'auth' middleware
router.get('/me', verifyToken, getSelfByIdFromToken);  // Using 'verifyToken' middleware

module.exports = router;