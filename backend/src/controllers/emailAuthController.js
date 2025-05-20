const { User, OTPToken } = require('../models');
const { sendEmail, createVerificationOTPEmail, createLoginOTPEmail } = require('../config/email');
const { 
  generateOTP, 
  storeOTP,
  verifyOTP,
  generateJWT
} = require('../utils/authUtils');

// @desc    Request OTP for new user signup
// @route   POST /api/auth/email/request-verification
// @access  Public
const requestVerificationOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'An account with this email already exists. Please log in instead.',
        userExists: true 
      });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();
    
    // Store OTP in the database (expires in 10 minutes)
    const stored = await storeOTP(email, otp);
    
    if (!stored) {
      return res.status(500).json({ message: 'Failed to generate verification code' });
    }

    // Get email content
    const { subject, html } = createVerificationOTPEmail(email, otp);

    // Send verification email
    const emailSent = await sendEmail(email, subject, html);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    // Store user info temporarily
    res.status(200).json({ 
      message: 'Verification code sent to email',
      email,
      name
    });
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({ message: 'Server error during verification code generation' });
  }
};

// @desc    Request OTP for existing user login
// @route   POST /api/auth/email/request-login
// @access  Public
const requestLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ 
        message: 'No account found with this email. Please sign up first.',
        userNotFound: true 
      });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();
    
    // Store OTP in the database (expires in 10 minutes)
    const stored = await storeOTP(email, otp);
    
    if (!stored) {
      return res.status(500).json({ message: 'Failed to generate login code' });
    }

    // Get email content for login
    const { subject, html } = createLoginOTPEmail(email, otp);

    // Send login email
    const emailSent = await sendEmail(email, subject, html);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send login email' });
    }

    res.status(200).json({ 
      message: 'Login code sent to email',
      email
    });
  } catch (error) {
    console.error('Request login OTP error:', error);
    res.status(500).json({ message: 'Server error during login code generation' });
  }
};

// @desc    Verify OTP and create new user account
// @route   POST /api/auth/email/verify-signup
// @access  Public
const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name) {
      return res.status(400).json({ message: 'Email, verification code, and name are required' });
    }

    // Verify OTP
    const isValid = await verifyOTP(email, otp);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired verification code' });
    }

    // Check if user already exists (double-check)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create new user with provided credentials or a random password
    const userPassword = password || Math.random().toString(36).slice(-10);
    
    const user = await User.create({
      email,
      name,
      password: userPassword
    });

    if (!user) {
      return res.status(500).json({ message: 'Failed to create user account' });
    }

    // Generate JWT token
    const jwtToken = generateJWT(user.id, user.email);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: jwtToken
    });
  } catch (error) {
    console.error('Verify signup error:', error);
    res.status(500).json({ message: 'Server error during account creation' });
  }
};

// @desc    Verify OTP and log in existing user
// @route   POST /api/auth/email/verify-login
// @access  Public
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    // Verify OTP
    const isValid = await verifyOTP(email, otp);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired verification code' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT token
    const jwtToken = generateJWT(user.id, user.email);

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: jwtToken
    });
  } catch (error) {
    console.error('Verify login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = {
  requestVerificationOTP,
  verifySignupOTP,
  requestLoginOTP,
  verifyLoginOTP
}; 