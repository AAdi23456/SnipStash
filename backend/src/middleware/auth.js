const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  console.log('Auth middleware - headers:', req.headers.authorization);
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      if (!token) {
        console.log('No token found in authorization header');
        return res.status(401).json({ message: 'Not authorized, no token' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      
      // Get user from token
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        console.log('User not found for token');
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      req.user = user;
      
      console.log('Auth successful - user:', req.user?.id);
      
      next();
    } catch (error) {
      console.log('Auth error:', error.message);
      res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } else {
    console.log('No authorization header');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect }; 