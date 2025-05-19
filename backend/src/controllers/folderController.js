const { Folder, Snippet, SnippetFolder, Tag } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @desc    Create a new folder
 * @route   POST /api/folders
 * @access  Private
 */
const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    // Check if folder with same name already exists for this user
    const existingFolder = await Folder.findOne({
      where: {
        name,
        userId: req.user.id
      }
    });

    if (existingFolder) {
      return res.status(400).json({ message: 'Folder with this name already exists' });
    }

    // Create the folder
    const folder = await Folder.create({
      name,
      userId: req.user.id
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Server error while creating folder' });
  }
};

/**
 * @desc    Get all folders for the logged-in user
 * @route   GET /api/folders
 * @access  Private
 */
const getFolders = async (req, res) => {
  try {
    const folders = await Folder.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Snippet,
          include: [{ model: Tag }]
        }
      ]
    });
    
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Server error while fetching folders' });
  }
};

/**
 * @desc    Get a single folder by ID with its snippets
 * @route   GET /api/folders/:id
 * @access  Private
 */
const getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: Snippet,
          include: [{ model: Tag }]
        }
      ]
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ message: 'Server error while fetching folder' });
  }
};

/**
 * @desc    Update a folder
 * @route   PATCH /api/folders/:id
 * @access  Private
 */
const updateFolder = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    // Check if the folder exists and belongs to the user
    const folder = await Folder.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if folder with same name already exists for this user
    const existingFolder = await Folder.findOne({
      where: {
        name,
        userId: req.user.id,
        id: { [Op.ne]: folder.id }
      }
    });

    if (existingFolder) {
      return res.status(400).json({ message: 'Folder with this name already exists' });
    }
    
    // Update the folder
    await folder.update({ name });
    
    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ message: 'Server error while updating folder' });
  }
};

/**
 * @desc    Delete a folder
 * @route   DELETE /api/folders/:id
 * @access  Private
 */
const deleteFolder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if the folder exists and belongs to the user
    const folder = await Folder.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!folder) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Remove all snippet-folder associations
    await SnippetFolder.destroy({
      where: { folderId: folder.id },
      transaction
    });
    
    // Delete the folder
    await folder.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Server error while deleting folder' });
  }
};

/**
 * @desc    Add a snippet to a folder
 * @route   POST /api/snippets/:id/folders
 * @access  Private
 */
const addSnippetToFolders = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { folderIds } = req.body;
    const snippetId = req.params.id;
    
    if (!folderIds || !Array.isArray(folderIds) || folderIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Folder IDs are required' });
    }
    
    // Check if the snippet exists and belongs to the user
    const snippet = await Snippet.findOne({
      where: {
        id: snippetId,
        userId: req.user.id
      }
    });
    
    if (!snippet) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Snippet not found' });
    }
    
    // Verify all folders exist and belong to the user
    const folders = await Folder.findAll({
      where: {
        id: { [Op.in]: folderIds },
        userId: req.user.id
      }
    });
    
    if (folders.length !== folderIds.length) {
      await transaction.rollback();
      return res.status(404).json({ message: 'One or more folders not found' });
    }
    
    // Remove existing folder associations
    await SnippetFolder.destroy({
      where: { snippetId },
      transaction
    });
    
    // Create new associations
    const snippetFolderPromises = folderIds.map(folderId => 
      SnippetFolder.create({
        snippetId,
        folderId
      }, { transaction })
    );
    
    await Promise.all(snippetFolderPromises);
    await transaction.commit();
    
    // Return the snippet with its updated folders
    const updatedSnippet = await Snippet.findByPk(snippetId, {
      include: [
        { model: Tag },
        { model: Folder }
      ]
    });
    
    res.json(updatedSnippet);
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding snippet to folders:', error);
    res.status(500).json({ message: 'Server error while adding snippet to folders' });
  }
};

/**
 * @desc    Remove a snippet from a folder
 * @route   DELETE /api/snippets/:id/folders/:folderId
 * @access  Private
 */
const removeSnippetFromFolder = async (req, res) => {
  try {
    const snippetId = req.params.id;
    const folderId = req.params.folderId;
    
    // Check if the snippet exists and belongs to the user
    const snippet = await Snippet.findOne({
      where: {
        id: snippetId,
        userId: req.user.id
      }
    });
    
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    
    // Check if the folder exists and belongs to the user
    const folder = await Folder.findOne({
      where: {
        id: folderId,
        userId: req.user.id
      }
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Remove the association
    const deleted = await SnippetFolder.destroy({
      where: {
        snippetId,
        folderId
      }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Snippet is not in this folder' });
    }
    
    res.json({ message: 'Snippet removed from folder successfully' });
  } catch (error) {
    console.error('Error removing snippet from folder:', error);
    res.status(500).json({ message: 'Server error while removing snippet from folder' });
  }
};

module.exports = {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  addSnippetToFolders,
  removeSnippetFromFolder
}; 