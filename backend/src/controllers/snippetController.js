const { Snippet, Tag, SnippetTag, UsageLog, Folder, SnippetFolder } = require('../models');
const { autoTagCode } = require('../utils/autoTagger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @desc    Create a new snippet
 * @route   POST /api/snippets
 * @access  Private
 */
const createSnippet = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { title, code, language, description, tags = [] } = req.body;
    
    if (!title || !code || !language) {
      return res.status(400).json({ message: 'Title, code, and language are required' });
    }

    // Apply auto-tagging and combine with manual tags, including description for context
    const finalTags = autoTagCode(code, tags, description || '');

    // Create the snippet
    const snippet = await Snippet.create({
      title,
      code,
      language,
      description: description || '',
      userId: req.user.id
    }, { transaction });

    // Process tags - first find or create all tags
    const tagPromises = finalTags.map(tagName => 
      Tag.findOrCreate({
        where: { name: tagName },
        transaction
      })
    );
    
    const tagResults = await Promise.all(tagPromises);
    
    // Associate tags with the snippet
    const snippetTagPromises = tagResults.map(([tag]) => 
      SnippetTag.create({
        snippetId: snippet.id,
        tagId: tag.id
      }, { transaction })
    );
    
    await Promise.all(snippetTagPromises);
    await transaction.commit();

    // Return the created snippet with its tags
    const createdSnippet = await Snippet.findByPk(snippet.id, {
      include: [{ model: Tag }]
    });

    res.status(201).json(createdSnippet);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating snippet:', error);
    res.status(500).json({ message: 'Server error while creating snippet' });
  }
};

/**
 * @desc    Get all snippets for the logged-in user with filtering
 * @route   GET /api/snippets
 * @access  Private
 */
const getSnippets = async (req, res) => {
  try {
    const { language, tag, tags, query, sortBy, folderId } = req.query;
    console.log('Request Query Params:', req.query);
    console.log('Filters - language:', language, 'tag:', tag, 'tags:', tags, 'query:', query, 'sortBy:', sortBy, 'folderId:', folderId);
    console.log('User ID:', req.user?.id);
    
    // Check if user has any snippets at all first
    const totalSnippets = await Snippet.count({
      where: { userId: req.user.id }
    });
    
    console.log('Total snippets for user:', totalSnippets);
    
    const whereClause = { userId: req.user.id };
    const includeClause = [];
    
    // Apply language filter if provided
    if (language) {
      console.log('Filtering by language:', language);
      // If language is 'all', don't filter by language
      if (language !== 'all') {
        whereClause.language = { [Op.iLike]: language };
      }
    }
    
    // Apply search query if provided (search in title, code, and description)
    if (query) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { code: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ];
    }
    
    // Setup tag inclusion if tag filter(s) provided
    if (tags || tag) {
      // Extract tags from either individual tag or comma-separated list
      const tagList = tags ? tags.split(',') : (tag ? [tag] : []);
      console.log('Tag list for filtering:', tagList);
      
      if (tagList.length > 0) {
        includeClause.push({
          model: Tag,
          where: { 
            name: { 
              [Op.in]: tagList 
            } 
          },
          through: { attributes: [] } // Don't include the join table
        });
      }
    } else {
      includeClause.push({
        model: Tag,
        through: { attributes: [] }
      });
    }

    // Setup folder inclusion and filter if provided
    if (folderId) {
      includeClause.push({
        model: Folder,
        where: { id: folderId },
        through: { attributes: [] }
      });
    } else {
      includeClause.push({
        model: Folder,
        through: { attributes: [] }
      });
    }
    
    // Determine the order based on sortBy parameter
    let order = [['createdAt', 'DESC']]; // Default sort by newest
    
    if (sortBy === 'most-used') {
      order = [['copyCount', 'DESC']]; // Sort by most copied
    } else if (sortBy === 'recently-used') {
      order = [['lastCopiedAt', 'DESC']]; // Sort by most recently copied
    }
    
    console.log('Final whereClause:', JSON.stringify(whereClause));
    console.log('Include clause models:', includeClause.map(inc => inc.model?.name || 'Unknown'));
    
    // Get snippets with applied filters
    const snippets = await Snippet.findAll({
      where: whereClause,
      include: includeClause,
      order: order
    });
    
    console.log('Found snippets count:', snippets.length);
    res.json(snippets);
  } catch (error) {
    console.error('Error fetching snippets:', error);
    res.status(500).json({ message: 'Server error while fetching snippets' });
  }
};

/**
 * @desc    Get a single snippet by ID
 * @route   GET /api/snippets/:id
 * @access  Private
 */
const getSnippetById = async (req, res) => {
  try {
    const snippet = await Snippet.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        { model: Tag },
        { model: Folder }
      ]
    });
    
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    
    res.json(snippet);
  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json({ message: 'Server error while fetching snippet' });
  }
};

/**
 * @desc    Update a snippet
 * @route   PUT /api/snippets/:id
 * @access  Private
 */
const updateSnippet = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { title, code, language, description, tags = [], folderIds = [] } = req.body;
    
    // Check if the snippet exists and belongs to the user
    const snippet = await Snippet.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!snippet) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Snippet not found' });
    }
    
    // Use the provided code or fall back to existing code
    const codeToUse = code || snippet.code;
    // Use the provided description or fall back to existing description
    const descriptionToUse = description !== undefined ? description : snippet.description;
    
    // Auto-tag the code and combine with manual tags, including description
    const finalTags = autoTagCode(codeToUse, tags, descriptionToUse);
    
    // Update the snippet
    await snippet.update({
      title: title || snippet.title,
      code: codeToUse,
      language: language || snippet.language,
      description: descriptionToUse
    }, { transaction });
    
    // Remove existing tag associations
    await SnippetTag.destroy({
      where: { snippetId: snippet.id },
      transaction
    });
    
    // Process tags - first find or create all tags
    const tagPromises = finalTags.map(tagName => 
      Tag.findOrCreate({
        where: { name: tagName },
        transaction
      })
    );
    
    const tagResults = await Promise.all(tagPromises);
    
    // Associate tags with the snippet
    const snippetTagPromises = tagResults.map(([tag]) => 
      SnippetTag.create({
        snippetId: snippet.id,
        tagId: tag.id
      }, { transaction })
    );
    
    await Promise.all(snippetTagPromises);

    // If folderIds are provided, update folder associations
    if (folderIds.length > 0) {
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
      
      // Get existing folder associations for this snippet
      const existingAssociations = await SnippetFolder.findAll({
        where: { snippetId: snippet.id },
        attributes: ['folderId'],
        transaction
      });
      
      const existingFolderIds = existingAssociations.map(assoc => assoc.folderId);
      
      // Filter out folders that are already associated with the snippet
      const newFolderIds = folderIds.filter(id => !existingFolderIds.includes(id));
      
      // Create new associations only for folders that don't already have an association
      if (newFolderIds.length > 0) {
        const snippetFolderPromises = newFolderIds.map(folderId => 
          SnippetFolder.create({
            snippetId: snippet.id,
            folderId
          }, { transaction })
        );
        
        await Promise.all(snippetFolderPromises);
      }
    }
    
    await transaction.commit();
    
    // Return the updated snippet with its tags and folders
    const updatedSnippet = await Snippet.findByPk(snippet.id, {
      include: [
        { model: Tag },
        { model: Folder }
      ]
    });
    
    res.json(updatedSnippet);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating snippet:', error);
    res.status(500).json({ message: 'Server error while updating snippet' });
  }
};

/**
 * @desc    Delete a snippet
 * @route   DELETE /api/snippets/:id
 * @access  Private
 */
const deleteSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    
    await snippet.destroy();
    
    res.json({ message: 'Snippet deleted successfully' });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    res.status(500).json({ message: 'Server error while deleting snippet' });
  }
};

/**
 * @desc    Log snippet usage (copy, etc.)
 * @route   POST /api/snippets/:id/log-usage
 * @access  Private
 */
const logSnippetUsage = async (req, res) => {
  try {
    const { action = 'copy' } = req.body;
    const snippetId = req.params.id;
    
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
    
    // Log the usage
    await UsageLog.create({
      snippetId,
      userId: req.user.id,
      action
    });
    
    res.status(201).json({ message: 'Usage logged successfully' });
  } catch (error) {
    console.error('Error logging snippet usage:', error);
    res.status(500).json({ message: 'Server error while logging usage' });
  }
};

/**
 * @desc    Copy a snippet and track usage
 * @route   POST /api/snippets/:id/copy
 * @access  Private
 */
const copySnippet = async (req, res) => {
  try {
    // Check if the snippet exists and belongs to the user
    const snippet = await Snippet.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{ model: Tag }]
    });
    
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    
    // Increment copyCount and update lastCopiedAt
    const newCopyCount = snippet.copyCount + 1;
    const newLastCopiedAt = new Date();
    
    await snippet.update({
      copyCount: newCopyCount,
      lastCopiedAt: newLastCopiedAt
    });
    
    // Also log the usage
    await UsageLog.create({
      snippetId: snippet.id,
      userId: req.user.id,
      action: 'copy'
    });
    
    // Get the updated snippet with all relations
    const updatedSnippet = await Snippet.findByPk(snippet.id, {
      include: [{ model: Tag }]
    });
    
    // Return the full updated snippet
    res.status(200).json(updatedSnippet);
  } catch (error) {
    console.error('Error copying snippet:', error);
    res.status(500).json({ message: 'Server error while copying snippet' });
  }
};

module.exports = {
  createSnippet,
  getSnippets,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  logSnippetUsage,
  copySnippet
}; 