const { Tag, Snippet, SnippetTag } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @desc    Get all unique tags for the logged-in user
 * @route   GET /api/tags
 * @access  Private
 */
const getUserTags = async (req, res) => {
  try {
    console.log('Getting tags for user:', req.user.id);
    
    // Find all tags associated with the user's snippets
    const userTags = await Tag.findAll({
      include: [{
        model: Snippet,
        where: { userId: req.user.id },
        attributes: [], // Don't include the snippets data
        through: { attributes: [] } // Don't include the join table
      }],
      attributes: ['id', 'name']
    });
    
    console.log('Found tags count:', userTags.length);
    console.log('Tag names:', userTags.map(tag => tag.name));
    
    res.json(userTags);
  } catch (error) {
    console.error('Error fetching user tags:', error);
    res.status(500).json({ message: 'Server error while fetching tags' });
  }
};

module.exports = {
  getUserTags
}; 