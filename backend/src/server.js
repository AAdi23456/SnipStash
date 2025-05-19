const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
require('./models');
const authRoutes = require('./routes/authRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const tagRoutes = require('./routes/tagRoutes');
const folderRoutes = require('./routes/folderRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Debug middleware for logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture and log the response
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response status: ${res.statusCode}`);
    if (body) {
      console.log('Response body:', typeof body === 'string' ? body.substring(0, 200) + (body.length > 200 ? '...' : '') : body);
    }
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/folders', folderRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SnipStash API' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Successfully connected to PostgreSQL database');
    
    // Sync all models with database
    await sequelize.sync({ alter: false });
    console.log('Database synchronized successfully');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer(); 