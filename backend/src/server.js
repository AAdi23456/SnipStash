const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
require('./models');
const authRoutes = require('./routes/authRoutes');
const snippetRoutes = require('./routes/snippetRoutes');
const tagRoutes = require('./routes/tagRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/tags', tagRoutes);

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