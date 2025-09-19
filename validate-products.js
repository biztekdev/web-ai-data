const fs = require('fs');

// Read the database products
const dbProducts = JSON.parse(fs.readFileSync('mylarAiQuotes.products.json', 'utf8'));
const dbProductNames = new Set(dbProducts.map(product => product.name));

// Read the Wit.ai products
const witProducts = JSON.parse(fs.readFileSync('entities/product.json', 'utf8'));
const witProductNames = new Set(witProducts.keywords.map(keyword => keyword.keyword));

// Find products in Wit.ai that are NOT in the database
const missingFromDb = Array.from(witProductNames).filter(name => !dbProductNames.has(name));

console.log('Products in Wit.ai entity but NOT in database:');
missingFromDb.forEach(name => console.log(`- "${name}"`));

console.log(`\nTotal missing from database: ${missingFromDb.length}`);
console.log(`Total in Wit.ai: ${witProductNames.size}`);
console.log(`Total in database: ${dbProductNames.size}`);