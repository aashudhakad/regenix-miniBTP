const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

// Session routes
router.post('/', auth, sessionController.createSession);
router.get('/user-sessions', auth, sessionController.getUserSessions);
router.get('/history', auth, sessionController.getUserSessionHistory);

// Session-specific routes with ownership check
router.post('/:sessionId/logs', 
  auth,
  sessionController.checkSessionOwnership,
  sessionController.saveSessionLogs
);

router.put('/:sessionId/complete',
  auth,
  sessionController.checkSessionOwnership,
  sessionController.completeSession
);

router.get('/:sessionId',
  auth,
  sessionController.checkSessionOwnership,
  sessionController.getSessionDetails
);

router.get('/:sessionId/summary',
  auth,
  sessionController.checkSessionOwnership,
  sessionController.getSessionSummary
);

module.exports = router;