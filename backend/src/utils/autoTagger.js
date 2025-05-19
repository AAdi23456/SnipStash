/**
 * Auto-tags code snippets based on patterns
 * Uses rule-based logic (no AI) to detect common patterns in code
 */

// Tag rules as key-value pairs where key is the tag name and value is the regex pattern
const tagRules = {
  'loop': /\b(for|while|forEach|do\s+while)\b/i,
  'API': /\b(fetch|axios|XMLHttpRequest|http\.get|\.ajax|\.post|api\.)\b/i,
  'error handling': /\b(try|catch|throw|finally|Error\()\b/i,
  'array ops': /\.(map|filter|reduce|find|some|every|forEach)\(/i,
  'debugging': /\b(console\.log|console\.debug|console\.error|console\.warn|debugger)\b/i,
  'async': /\b(async|await|Promise|then)\b/i,
  'DOM': /\b(document\.|window\.|querySelector|getElementById|addEventListener)\b/i,
  'react': /\b(useState|useEffect|useContext|useRef|React\.)\b/i,
  'condition': /\b(if|else|switch|case|ternary|conditional)\b/i,
  'function': /\b(function|=>\s*{|\(\)\s*=>|class\s+\w+)\b/i
};

/**
 * Analyzes code and applies appropriate tags based on content
 * @param {string} code - The code snippet to analyze
 * @param {Array<string>} manualTags - Optional array of manually added tags
 * @returns {Array<string>} Combined and deduplicated list of tags
 */
const autoTagCode = (code, manualTags = []) => {
  // Default to empty array if code is null/undefined
  if (!code) return manualTags;
  
  // Detect tags based on regex patterns
  const detectedTags = [];
  
  for (const [tag, pattern] of Object.entries(tagRules)) {
    if (pattern.test(code)) {
      detectedTags.push(tag);
    }
  }
  
  // Combine auto-detected tags with any manually provided tags
  const allTags = [...detectedTags, ...manualTags];
  
  // Remove duplicates (case insensitive)
  const uniqueTags = [];
  const lowercaseTags = {};
  
  allTags.forEach(tag => {
    const lower = tag.toLowerCase();
    if (!lowercaseTags[lower]) {
      lowercaseTags[lower] = true;
      uniqueTags.push(tag);
    }
  });
  
  return uniqueTags;
};

module.exports = {
  autoTagCode
}; 