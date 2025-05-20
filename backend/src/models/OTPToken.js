const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class OTPToken extends Model {}

OTPToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('OTP', 'MAGIC_LINK'),
      allowNull: false,
      defaultValue: 'OTP',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'OTPToken',
  }
);

module.exports = OTPToken; 