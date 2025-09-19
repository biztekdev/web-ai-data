const fs = require('fs');

// Read the database products
const dbProducts = JSON.parse(fs.readFileSync('mylarAiQuotes.products.json', 'utf8'));

// Extract product names from database
const dbProductNames = dbProducts.map(product => product.name);
console.log('Database products (' + dbProductNames.length + '):');
console.log(dbProductNames.join('\n'));

// Read the Wit.ai products
const witProducts = JSON.parse(fs.readFileSync('entities/product.json', 'utf8'));

// Extract product names from Wit.ai
const witProductNames = witProducts.keywords.map(keyword => keyword.keyword);
console.log('\nWit.ai products (' + witProductNames.length + '):');
console.log(witProductNames.join('\n'));

// Find products in Wit.ai that are NOT in database
const productsToRemove = witProductNames.filter(name => !dbProductNames.includes(name));
console.log('\nProducts to remove from Wit.ai (' + productsToRemove.length + '):');
console.log(productsToRemove.join('\n'));

// Find products in database that are NOT in Wit.ai
const productsToAdd = dbProductNames.filter(name => !witProductNames.includes(name));
console.log('\nProducts to add to Wit.ai (' + productsToAdd.length + '):');
console.log(productsToAdd.join('\n'));