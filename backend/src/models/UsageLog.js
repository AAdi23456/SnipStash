const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class UsageLog extends Model {}

UsageLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    snippetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Snippets',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'copy',
    },
  },
  {
    sequelize,
    modelName: 'UsageLog',
    indexes: [
      {
        fields: ['snippetId'],
      },
      {
        fields: ['userId'],
      },
    ],
  }
);

module.exports = UsageLog; 