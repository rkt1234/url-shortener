const express = require('express');
const { signup, login } = require('../controllers/authController');
const { body } = require('express-validator');

const router = express.Router();
router.post('/signup', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], signup);

router.post('/login', [
  body('email').isEmail(),
  body('password').exists(),
], login);

module.exports = router;
