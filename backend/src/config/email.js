const Mailjet = require('node-mailjet');
require('dotenv').config();

// Initialize Mailjet client
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY || 'your-mailjet-api-key',
  process.env.MAILJET_API_SECRET || 'your-mailjet-secret-key'
);

// Helper function to send an email with Mailjet
const sendEmail = async (to, subject, html) => {
  try {
    const response = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.FROM_EMAIL || 'your-registered-mailjet-sender@example.com',
              Name: 'SnipStash',
            },
            To: [
              {
                Email: to,
              },
            ],
            Subject: subject,
            HTMLPart: html,
          },
        ],
      });

    console.log('Email sent via Mailjet:', response.body);
    return true;
  } catch (error) {
    console.error('Error sending email via Mailjet:', error.message);
    return false;
  }
};

// Helper function to create a verification OTP email for signup
const createVerificationOTPEmail = (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your SnipStash Account</h2>
      <p>Thanks for signing up! Please use the following verification code to complete your registration:</p>
      <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't create an account with SnipStash, you can safely ignore this email.</p>
    </div>
  `;

  return {
    subject: 'Verify Your SnipStash Account',
    html
  };
};

// Helper function to create a login OTP email for existing users
const createLoginOTPEmail = (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Login to Your SnipStash Account</h2>
      <p>Use the following verification code to log in to your account:</p>
      <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request to log in to SnipStash, please secure your account.</p>
    </div>
  `;

  return {
    subject: 'Login to SnipStash',
    html
  };
};

module.exports = {
  sendEmail,
  createVerificationOTPEmail,
  createLoginOTPEmail
}; 