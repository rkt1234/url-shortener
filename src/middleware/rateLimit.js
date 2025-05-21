const rateLimit = require('express-rate-limit');

const shortenLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: 'Too many URL shortening requests, please try again later',
});

module.exports = shortenLimiter;
