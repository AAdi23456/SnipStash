/**
 * Simple test for auto-tagging functionality
 */

const { autoTagCode } = require('./autoTagger');

console.log('Starting auto-tag test');

const tags = autoTagCode('for (let i = 0; i < 10; i++) { console.log(i); }', ['js'], 'Simple loop');

console.log('Test complete, tags:', tags); 