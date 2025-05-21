const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { shortenUrl, redirectToOriginal } = require('../controllers/urlController');
const { getUrlAnalytics } = require('../controllers/analyticsController');
const { getUserUrls, getUrlById, updateUrl, deleteUrl, } = require('../controllers/urlController');
const shortenLimiter = require('../middleware/rateLimit');

const router = express.Router();

// Public route for redirection
router.get('/:shortCode', redirectToOriginal);
// Protected route for shortening
router.post(
  '/',
  auth,
  shortenLimiter,
  [
    body('originalUrl').isURL(),
    body('customCode').optional().isAlphanumeric(),
    body('expiresAt').optional().isISO8601(),
  ],
  shortenUrl
);

router.get('/urls/:id/analytics', auth, getUrlAnalytics);

router.get('/urls', auth, getUserUrls);
router.get('/urls/:id', auth, getUrlById);
router.patch('/urls/:id', auth, updateUrl);
router.delete('/urls/:id', auth, deleteUrl);


module.exports = router;
