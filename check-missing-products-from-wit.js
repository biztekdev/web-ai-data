const fs = require('fs');

// Read the database products
const dbProducts = JSON.parse(fs.readFileSync('mylarAiQuotes.products.json', 'utf8'));
const dbProductNames = new Set(dbProducts.map(product => product.name));

// Read the Wit.ai products
const witProducts = JSON.parse(fs.readFileSync('entities/product.json', 'utf8'));
const witProductNames = new Set(witProducts.keywords.map(keyword => keyword.keyword));

// Find products in database that are NOT in Wit.ai
const missingFromWit = Array.from(dbProductNames).filter(name => !witProductNames.has(name));

console.log('Products in database but NOT in Wit.ai entity:');
missingFromWit.forEach(name => console.log(`- "${name}"`));

console.log(`\nTotal missing from Wit.ai: ${missingFromWit.length}`);
console.log(`Total in Wit.ai: ${witProductNames.size}`);
console.log(`Total in database: ${dbProductNames.size}`);