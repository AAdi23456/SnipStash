const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SnippetFolder extends Model {}

SnippetFolder.init(
  {
    snippetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Snippets',
        key: 'id',
      },
    },
    folderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Folders',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'SnippetFolder',
    indexes: [
      {
        unique: true,
        fields: ['snippetId', 'folderId'],
      },
    ],
  }
);

module.exports = SnippetFolder; 