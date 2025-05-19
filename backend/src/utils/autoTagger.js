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
  'function': /\b(function|=>\s*{|\(\)\s*=>|class\s+\w+)\b/i,
  // Additional tag rules
  'timing': /\b(setTimeout|setInterval|clearTimeout|clearInterval)\b/i,
  'OOP': /\b(class|constructor|extends|super|this\.)\b/i,
  'module': /\b(import|export|require|from)\b/i,
  'MongoDB': /\b(mongoose|schema|model|findOne|findById)\b/i,
  'Express': /\b(express|Router|app\.use|app\.get|app\.post|req\.|res\.)\b/i,
  'SQL': /\b(SELECT|INSERT|UPDATE|DELETE|JOIN|WHERE|sql|sequelize)\b/i,
  'auth': /\b(token|JWT|authenticate|authorization|passport|bcrypt)\b/i,
  'security': /\b(crypto|encrypt|decrypt|hash|salt)\b/i,
  'AI': /\b(ai|openai|gpt|llm|chatgpt|huggingface|transformer)\b/i,
  'Machine Learning': /\b(ml|scikit|tensorflow|pytorch|train_test_split|model\.fit)\b/i
};

/**
 * Analyzes code and description and applies appropriate tags based on content
 * @param {string} code - The code snippet to analyze
 * @param {Array<string>} manualTags - Optional array of manually added tags
 * @param {string} description - Optional description to analyze for additional context
 * @returns {Array<string>} Combined and deduplicated list of tags
 */
const autoTagCode = (code, manualTags = [], description = '') => {
  console.log('Auto-tagging snippet...');
  console.log(`Manual tags provided: ${manualTags.length ? manualTags.join(', ') : 'none'}`);
  
  // Default to empty array if code is null/undefined
  if (!code && !description) {
    console.log('No code or description provided, returning only manual tags');
    return manualTags;
  }
  
  // Detect tags based on regex patterns
  const detectedTags = [];
  
  for (const [tag, pattern] of Object.entries(tagRules)) {
    // Check both code and description for pattern matches
    if ((code && pattern.test(code)) || (description && pattern.test(description))) {
      detectedTags.push(tag);
      console.log(`Auto-detected tag: ${tag}`);
    }
  }
  
  console.log(`Auto-detected ${detectedTags.length} tags: ${detectedTags.join(', ') || 'none'}`);
  
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
  
  console.log(`Final tags (${uniqueTags.length}): ${uniqueTags.join(', ') || 'none'}`);
  return uniqueTags;
};

module.exports = {
  autoTagCode
}; 