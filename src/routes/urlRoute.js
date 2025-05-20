const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { shortenUrl, redirectToOriginal } = require('../controllers/urlController');
const { getUrlAnalytics } = require('../controllers/analytics');

const router = express.Router();

// Public route for redirection
router.get('/:shortCode', redirectToOriginal);
// Protected route for shortening
router.post('/',
  auth,
  [
    body('originalUrl').isURL(),
    body('customCode').optional().isAlphanumeric(),
    body('expiresAt').optional().isISO8601(),
  ],
  shortenUrl
);

router.get('/urls/:id/analytics', auth, getUrlAnalytics);


module.exports = router;
