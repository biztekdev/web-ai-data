const fs = require('fs');

// Read the database finishes
const dbFinishes = JSON.parse(fs.readFileSync('mylarAiQuotes.product_finishes.json', 'utf8'));
const dbFinishNames = new Set(dbFinishes.map(finish => finish.name));

// Read the Wit.ai finishes
const witFinishes = JSON.parse(fs.readFileSync('entities/finishes.json', 'utf8'));
const witFinishNames = witFinishes.keywords.map(keyword => keyword.keyword);

// Find finishes in Wit.ai that are NOT in the database
const missingFromDb = witFinishNames.filter(name => !dbFinishNames.has(name));

console.log('Finishes in Wit.ai entity but NOT in database:');
missingFromDb.forEach(name => console.log(`- "${name}"`));

console.log(`\nTotal missing: ${missingFromDb.length}`);
console.log(`Total in Wit.ai: ${witFinishNames.length}`);
console.log(`Total in database: ${dbFinishNames.size}`);