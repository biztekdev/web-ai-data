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

// Import entities
async function importEntities() {
    console.log('🔄 Importing entities...');
    
    const entitiesDir = path.join(__dirname, 'entities');
    const entityFiles = fs.readdirSync(entitiesDir).filter(file => file.endsWith('.json'));
    
    for (const file of entityFiles) {
        const entityPath = path.join(entitiesDir, file);
        const entityData = JSON.parse(fs.readFileSync(entityPath, 'utf8'));
        
        console.log(`📝 Importing entity: ${entityData.name}`);
        
        try {
            // Check if entity exists
            try {
                await makeRequest(`${WIT_API_BASE}/entities/${entityData.name}`);
                console.log(`   Entity ${entityData.name} already exists, updating...`);
                
                // Update existing entity
                await makeRequest(
                    `${WIT_API_BASE}/entities/${entityData.name}`,
                    'PUT',
                    entityData
                );
            } catch (error) {
                if (error.message.includes('404')) {
                    console.log(`   Creating new entity: ${entityData.name}`);
                    // Create new entity
                    await makeRequest(
                        `${WIT_API_BASE}/entities`,
                        'POST',
                        entityData
                    );
                } else {
                    throw error;
                }
            }
            
            console.log(`✅ Entity ${entityData.name} imported successfully`);
        } catch (error) {
            console.error(`❌ Failed to import entity ${entityData.name}:`, error.message);
        }
    }
}

// Import intents
async function importIntents() {
    console.log('🔄 Importing intents...');
    const intentsDir = path.join(__dirname, 'intents');
    const intentFiles = fs.readdirSync(intentsDir).filter(file => file.endsWith('.json'));
    for (const file of intentFiles) {
        const intentPath = path.join(intentsDir, file);
        const intentData = JSON.parse(fs.readFileSync(intentPath, 'utf8'));
        console.log(`📝 Importing intent: ${intentData.name}`);
        try {
            // Check if intent exists
            let intentExists = false;
            try {
                await makeRequest(`${WIT_API_BASE}/intents/${intentData.name}`);
                intentExists = true;
                console.log(`   Intent ${intentData.name} already exists, updating...`);
                // Wit.ai does not support updating intents via PUT. Delete and recreate intent.
                await makeRequest(
                    `${WIT_API_BASE}/intents/${intentData.name}`,
                    'DELETE'
                );
            } catch (error) {
                if (error.message.includes('404') || error.message.includes('400') || error.message.includes('not-found')) {
                    console.log(`   Intent ${intentData.name} does not exist, creating new...`);
                } else {
                    throw error;
                }
            }
            
            // Create the intent
            await makeRequest(
                `${WIT_API_BASE}/intents`,
                'POST',
                intentData
            );
            
            console.log(`✅ Intent ${intentData.name} imported successfully`);
        } catch (error) {
            console.error(`❌ Failed to import intent ${intentData.name}:`, error.message);
        }
    }
}

// Import utterances
async function importUtterances() {
    console.log('🔄 Importing utterances...');
    const utterancesDir = path.join(__dirname, 'utterances');
    const utteranceFiles = fs.readdirSync(utterancesDir).filter(file => file.endsWith('.json'));
    for (const file of utteranceFiles) {
        const utterancePath = path.join(utterancesDir, file);
        const utteranceData = JSON.parse(fs.readFileSync(utterancePath, 'utf8'));
        if (!utteranceData.utterances || !Array.isArray(utteranceData.utterances)) {
            console.error(`❌ Utterances file ${file} is missing 'utterances' array.`);
            continue;
        }
        console.log(`📝 Importing utterances from: ${file}`);
        console.log(`   Found ${utteranceData.utterances.length} utterances`);
        try {
                let successCount = 0;
                let failCount = 0;
                for (let i = 0; i < utteranceData.utterances.length; i++) {
                    const utt = utteranceData.utterances[i];
                    if (!utt.text || !utt.intent) {
                        console.error(`❌ Invalid utterance at index ${i}:`, utt);
                        failCount++;
                        continue;
                    }
                    try {
                        await makeRequest(
                            `${WIT_API_BASE}/utterances`,
                            'POST',
                            [utt]
                        );
                        successCount++;
                    } catch (error) {
                        console.error(`❌ Failed to import utterance at index ${i}:`, error.message);
                        failCount++;
                    }
                }
                console.log(`✅ Imported ${successCount} utterances from ${file}, skipped ${failCount}`);
        } catch (error) {
            console.error(`❌ Failed to import utterances from ${file}:`, error.message);
        }
    }
}

// Train the model
async function trainModel() {
    console.log('🔄 Training Wit.ai model...');
    
    try {
        await makeRequest(
            `${WIT_API_BASE}/train`,
            'POST',
            {}
        );
        
        console.log('✅ Model training started successfully');
        console.log('⏳ Training may take a few minutes to complete');
    } catch (error) {
        console.error('❌ Failed to start model training:', error.message);
    }
}

// Main import function
async function importToWit() {
    console.log('🚀 Starting Wit.ai import process...');
    console.log(`📱 App ID: ${WIT_AI_APP_ID}`);
    console.log(`🔑 Access Token: ${WIT_AI_ACCESS_TOKEN.substring(0, 10)}...`);
    try {
        await importEntities();
        await importIntents();
        // Ensure intent exists before importing utterances
        try {
            await makeRequest(`${WIT_API_BASE}/intents/get_quote`);
        } catch (error) {
            if (error.message.includes('404') || error.message.includes('400') || error.message.includes('not-found')) {
                console.error('❌ Intent get_quote does not exist. Creating it now...');
                // Try to create the intent
                try {
                    const intentData = JSON.parse(fs.readFileSync(path.join(__dirname, 'intents', 'get_quote.json'), 'utf8'));
                    await makeRequest(`${WIT_API_BASE}/intents`, 'POST', intentData);
                    console.log('✅ Intent get_quote created successfully');
                } catch (createError) {
                    console.error('❌ Failed to create intent get_quote:', createError.message);
                    return;
                }
            } else {
                console.error('❌ Error checking intent get_quote:', error.message);
                return;
            }
        }
        await importUtterances();
        // Wit.ai trains automatically after import. Explicit trainModel call removed.
        console.log('🎉 Wit.ai import completed successfully!');
        console.log('📊 Check your Wit.ai dashboard to verify the import');
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Run the import
if (require.main === module) {
    importToWit();
}

module.exports = { importToWit, importEntities, importIntents, importUtterances, trainModel };
