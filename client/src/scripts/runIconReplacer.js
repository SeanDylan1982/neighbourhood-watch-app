/**
 * Script to run the icon replacer
 * Run with: node src/scripts/runIconReplacer.js
 */

const { replaceIcons } = require('../utils/iconReplacer');

console.log('Starting icon replacement process...');

replaceIcons()
  .then(() => {
    console.log('Icon replacement completed successfully!');
  })
  .catch((error) => {
    console.error('Error during icon replacement:', error);
    process.exit(1);
  });