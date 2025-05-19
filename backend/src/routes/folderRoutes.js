const express = require('express');
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder
} = require('../controllers/folderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Folder CRUD routes
router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:id', getFolderById);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);

module.exports = router; 