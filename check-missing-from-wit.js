const fs = require('fs');

// Read the database finishes
const dbFinishes = JSON.parse(fs.readFileSync('mylarAiQuotes.product_finishes.json', 'utf8'));
const dbFinishNames = new Set(dbFinishes.map(finish => finish.name));

// Read the Wit.ai finishes
const witFinishes = JSON.parse(fs.readFileSync('entities/finishes.json', 'utf8'));
const witFinishNames = new Set(witFinishes.keywords.map(keyword => keyword.keyword));

// Find finishes in database that are NOT in Wit.ai
const missingFromWit = Array.from(dbFinishNames).filter(name => !witFinishNames.has(name));

console.log('Finishes in database but NOT in Wit.ai entity:');
missingFromWit.forEach(name => console.log(`- "${name}"`));

console.log(`\nTotal missing from Wit.ai: ${missingFromWit.length}`);
console.log(`Total in Wit.ai: ${witFinishNames.size}`);
console.log(`Total in database: ${dbFinishNames.size}`);