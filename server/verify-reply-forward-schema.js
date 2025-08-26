/**
 * Simple verification script for reply and forward schema
 */

const Message = require('./models/Message');

console.log('=== Message Schema Verification ===\n');

// Check if Message model is loaded correctly
if (Message) {
  console.log('✓ Message model loaded successfully');
  
  // Check schema structure
  const schema = Message.schema;
  const paths = schema.paths;
  
  // Check reply fields
  if (paths.replyTo) {
    console.log('✓ replyTo field exists in schema');
    console.log('  - Type:', paths.replyTo.instance);
    
    // Check nested fields
    const replyToSchema = paths.replyTo.schema;
    if (replyToSchema) {
      console.log('  - Nested fields:');
      Object.keys(replyToSchema.paths).forEach(field => {
        console.log(`    - ${field}: ${replyToSchema.paths[field].instance}`);
      });
    }
  } else {
    console.log('✗ replyTo field missing from schema');
  }
  
  // Check forward fields
  if (paths.isForwarded) {
    console.log('✓ isForwarded field exists in schema');
    console.log('  - Type:', paths.isForwarded.instance);
  } else {
    console.log('✗ isForwarded field missing from schema');
  }
  
  if (paths.forwardedFrom) {
    console.log('✓ forwardedFrom field exists in schema');
    console.log('  - Type:', paths.forwardedFrom.instance);
    
    // Check nested fields
    const forwardedFromSchema = paths.forwardedFrom.schema;
    if (forwardedFromSchema) {
      console.log('  - Nested fields:');
      Object.keys(forwardedFromSchema.paths).forEach(field => {
        console.log(`    - ${field}: ${forwardedFromSchema.paths[field].instance}`);
      });
    }
  } else {
    console.log('✗ forwardedFrom field missing from schema');
  }
  
  // Check indexes
  const indexes = schema.indexes();
  console.log('\n✓ Schema indexes:');
  indexes.forEach((index, i) => {
    console.log(`  ${i + 1}. ${JSON.stringify(index[0])}`);
  });
  
} else {
  console.log('✗ Message model not loaded');
}

console.log('\n=== Verification Complete ===');