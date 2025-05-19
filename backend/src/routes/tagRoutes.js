const express = require('express');
const { getUserTags } = require('../controllers/tagController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Tag routes
router.get('/', getUserTags);

module.exports = router; 