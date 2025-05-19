const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SnippetTag extends Model {}

SnippetTag.init(
  {
    snippetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Snippets',
        key: 'id',
      },
    },
    tagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tags',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'SnippetTag',
    indexes: [
      {
        unique: true,
        fields: ['snippetId', 'tagId'],
      },
    ],
  }
);

module.exports = SnippetTag; 