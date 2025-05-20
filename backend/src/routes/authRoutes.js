const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { 
  requestVerificationOTP, 
  verifySignupOTP,
  requestLoginOTP,
  verifyLoginOTP
} = require('../controllers/emailAuthController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Traditional email/password auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Email verification for signup
router.post('/email/request-verification', requestVerificationOTP);
router.post('/email/verify-signup', verifySignupOTP);

// Email OTP for passwordless login
router.post('/email/request-login', requestLoginOTP);
router.post('/email/verify-login', verifyLoginOTP);

module.exports = router; 