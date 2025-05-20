const User = require('./User');
const Snippet = require('./Snippet');
const Tag = require('./Tag');
const Folder = require('./Folder');
const SnippetTag = require('./SnippetTag');
const SnippetFolder = require('./SnippetFolder');
const UsageLog = require('./UsageLog');
const OTPToken = require('./OTPToken');

// User associations
User.hasMany(Snippet, { foreignKey: 'userId' });
User.hasMany(Folder, { foreignKey: 'userId' });
User.hasMany(UsageLog, { foreignKey: 'userId' });

// Snippet associations
Snippet.belongsTo(User, { foreignKey: 'userId' });
Snippet.belongsToMany(Tag, { through: SnippetTag, foreignKey: 'snippetId' });
Snippet.belongsToMany(Folder, { through: SnippetFolder, foreignKey: 'snippetId' });
Snippet.hasMany(UsageLog, { foreignKey: 'snippetId' });

// Tag associations
Tag.belongsToMany(Snippet, { through: SnippetTag, foreignKey: 'tagId' });

// Folder associations
Folder.belongsTo(User, { foreignKey: 'userId' });
Folder.belongsToMany(Snippet, { through: SnippetFolder, foreignKey: 'folderId' });

// UsageLog associations
UsageLog.belongsTo(Snippet, { foreignKey: 'snippetId' });
UsageLog.belongsTo(User, { foreignKey: 'userId' });

// OTPToken associations

module.exports = {
  User,
  Snippet,
  Tag,
  Folder,
  SnippetTag,
  SnippetFolder,
  UsageLog,
  OTPToken
}; 