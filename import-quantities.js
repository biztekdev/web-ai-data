const fs = require('fs');
const path = require('path');

// Wit.ai API configuration
const WIT_AI_ACCESS_TOKEN = process.env.WIT_AI_ACCESS_TOKEN || '2PK7PINGGKAOFLQCHT2QLIZFZZ25XLZB';
const WIT_AI_APP_ID = process.env.WIT_AI_APP_ID || '1338138705022102';

if (!WIT_AI_ACCESS_TOKEN) {
    console.error('❌ WIT_AI_ACCESS_TOKEN environment variable is required');
    process.exit(1);
}

// Wit.ai API endpoints
const WIT_API_BASE = 'https://api.wit.ai';
const headers = {
    'Authorization': `Bearer ${WIT_AI_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};

// Helper function to make API requests
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) })
    };

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(result)}`);
        }

        return result;
    } catch (error) {
        console.error(`❌ Request failed for ${url}:`, error.message);
        throw error;
    }
}

// Import quantities entity
async function importQuantities() {
    console.log('🔄 Importing quantities entity...');

    const quantitiesPath = path.join(__dirname, 'entities', 'quantities.json');

    if (!fs.existsSync(quantitiesPath)) {
        console.error('❌ quantities.json file not found');
        return;
    }

    const quantitiesData = JSON.parse(fs.readFileSync(quantitiesPath, 'utf8'));

    console.log(`📝 Processing quantities entity: ${quantitiesData.name}`);

    try {
        // First, try to delete the existing quantities entity
        try {
            console.log('   Deleting existing quantities entity...');
            await makeRequest(`${WIT_API_BASE}/entities/quantities`, 'DELETE');
            console.log('   ✅ Existing quantities entity deleted');
        } catch (deleteError) {
            if (deleteError.message.includes('404') || deleteError.message.includes('400') || deleteError.message.includes('not-found')) {
                console.log('   ℹ️  Quantities entity does not exist, proceeding to create...');
            } else {
                console.log('   ⚠️  Could not delete existing entity, but continuing:', deleteError.message);
            }
        }

        // Create the new quantities entity
        console.log('   Creating new quantities entity...');
        await makeRequest(
            `${WIT_API_BASE}/entities`,
            'POST',
            quantitiesData
        );

        console.log('✅ Quantities entity imported successfully');

    } catch (error) {
        console.error('❌ Failed to import quantities entity:', error.message);
        throw error;
    }
}

// Main function
async function importQuantitiesOnly() {
    console.log('🚀 Starting quantities import process...');
    console.log(`📱 App ID: ${WIT_AI_APP_ID}`);
    console.log(`🔑 Access Token: ${WIT_AI_ACCESS_TOKEN.substring(0, 10)}...`);

    try {
        await importQuantities();
        console.log('🎉 Quantities import completed successfully!');
        console.log('📊 Check your Wit.ai dashboard to verify the quantities entity');
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Run the import
if (require.main === module) {
    importQuantitiesOnly();
}

module.exports = { importQuantitiesOnly, importQuantities };