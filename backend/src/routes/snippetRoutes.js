const express = require('express');
const { 
  createSnippet,
  getSnippets,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  logSnippetUsage,
  copySnippet
} = require('../controllers/snippetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Snippet CRUD routes
router.post('/', createSnippet);
router.get('/', getSnippets);
router.get('/:id', getSnippetById);
router.put('/:id', updateSnippet);
router.delete('/:id', deleteSnippet);

// Usage tracking
router.post('/:id/log-usage', logSnippetUsage);
router.post('/:id/copy', copySnippet);

module.exports = router; 