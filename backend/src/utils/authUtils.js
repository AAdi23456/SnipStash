const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OTPToken } = require('../models');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in database with expiration time
const storeOTP = async (email, otp, expiresInMinutes = 10) => {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    await OTPToken.create({
      email,
      token: otp,
      type: 'OTP',
      expiresAt,
      isUsed: false,
    });

    return true;
  } catch (error) {
    console.error('Error storing OTP:', error);
    return false;
  }
};

// Verify OTP token
const verifyOTP = async (email, otp) => {
  try {
    const token = await OTPToken.findOne({
      where: {
        email,
        token: otp,
        type: 'OTP',
        isUsed: false,
        expiresAt: {
          [Symbol.for('gt')]: new Date(),
        },
      },
    });

    if (!token) {
      return false;
    }

    // Mark token as used
    token.isUsed = true;
    await token.save();

    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

// Generate JWT token for authentication
const generateJWT = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '30d' }
  );
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  generateJWT,
}; 