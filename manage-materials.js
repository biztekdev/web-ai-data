const fs = require('fs');
const path = require('path');

// Configuration
const WIT_API_TOKEN = process.env.WIT_API_TOKEN || '2PK7PINGGKAOFLQCHT2QLIZFZZ25XLZB';
const WIT_APP_ID = process.env.WIT_APP_ID || '1338138705022102';

// File paths
const DB_MATERIALS_FILE = path.join(__dirname, 'mylarAiQuotes.materials.json');
const WIT_MATERIALS_FILE = path.join(__dirname, 'entities', 'material.json');

// Wit.ai API endpoints
const WIT_API_BASE = 'https://api.wit.ai';
const headers = {
    'Authorization': `Bearer ${WIT_API_TOKEN}`,
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

// Load database materials
function loadDatabaseMaterials() {
    try {
        const data = fs.readFileSync(DB_MATERIALS_FILE, 'utf8');
        const materials = JSON.parse(data);
        return materials.map(material => ({
            name: material.name,
            erp_id: material.erp_id,
            isActive: material.isActive
        })).filter(material => material.isActive);
    } catch (error) {
        console.error('Error loading database materials:', error.message);
        return [];
    }
}

// Load Wit.ai materials
function loadWitMaterials() {
    try {
        const data = fs.readFileSync(WIT_MATERIALS_FILE, 'utf8');
        const entity = JSON.parse(data);
        return entity.keywords.map(keyword => ({
            keyword: keyword.keyword,
            synonyms: keyword.synonyms
        }));
    } catch (error) {
        console.error('Error loading Wit.ai materials:', error.message);
        return [];
    }
}

// Compare materials
function compareMaterials() {
    const dbMaterials = loadDatabaseMaterials();
    const witMaterials = loadWitMaterials();

    const dbMaterialNames = new Set(dbMaterials.map(m => m.name.toLowerCase()));
    const witMaterialNames = new Set(witMaterials.map(m => m.keyword.toLowerCase()));

    const missingInWit = dbMaterials.filter(m => !witMaterialNames.has(m.name.toLowerCase()));
    const extraInWit = witMaterials.filter(m => !dbMaterialNames.has(m.keyword.toLowerCase()));

    console.log('📊 Materials Comparison Results:');
    console.log(`Database materials: ${dbMaterials.length}`);
    console.log(`Wit.ai materials: ${witMaterials.length}`);
    console.log(`Missing in Wit.ai: ${missingInWit.length}`);
    console.log(`Extra in Wit.ai: ${extraInWit.length}`);

    if (missingInWit.length > 0) {
        console.log('\n❌ Missing materials in Wit.ai:');
        missingInWit.forEach(m => console.log(`  - ${m.name}`));
    }

    if (extraInWit.length > 0) {
        console.log('\n⚠️  Extra materials in Wit.ai (not in database):');
        extraInWit.forEach(m => console.log(`  - ${m.keyword}`));
    }

    return { dbMaterials, witMaterials, missingInWit, extraInWit };
}

// Validate materials
function validateMaterials() {
    const { dbMaterials, witMaterials } = compareMaterials();

    console.log('\n✅ Validation Results:');
    console.log(`Database materials loaded: ${dbMaterials.length}`);
    console.log(`Wit.ai materials loaded: ${witMaterials.length}`);

    return dbMaterials.length > 0 && witMaterials.length > 0;
}

// Clean materials (remove extra ones)
function cleanMaterials() {
    const { dbMaterials, extraInWit } = compareMaterials();

    if (extraInWit.length === 0) {
        console.log('✨ No extra materials to clean!');
        return;
    }

    console.log(`\n🧹 Cleaning ${extraInWit.length} extra materials...`);

    // Create new keywords array without extra materials
    const cleanedKeywords = dbMaterials.map(material => ({
        keyword: material.name,
        synonyms: [material.name]
    }));

    const newEntity = {
        name: "material",
        roles: ["material"],
        lookups: ["free-text", "keywords"],
        keywords: cleanedKeywords
    };

    try {
        fs.writeFileSync(WIT_MATERIALS_FILE, JSON.stringify(newEntity, null, 4));
        console.log(`✅ Cleaned material.json - removed ${extraInWit.length} extra materials`);
        console.log(`📝 Now contains ${cleanedKeywords.length} materials from database`);
    } catch (error) {
        console.error('❌ Error cleaning materials:', error.message);
    }
}

// Add missing materials
function addMissingMaterials() {
    const { dbMaterials, witMaterials, missingInWit } = compareMaterials();

    if (missingInWit.length === 0) {
        console.log('✨ No missing materials to add!');
        return;
    }

    console.log(`\n➕ Adding ${missingInWit.length} missing materials...`);

    // Create keywords for missing materials
    const newKeywords = missingInWit.map(material => ({
        keyword: material.name,
        synonyms: [material.name]
    }));

    // Combine existing and new keywords
    const allKeywords = [...witMaterials, ...newKeywords];

    const newEntity = {
        name: "material",
        roles: ["material"],
        lookups: ["free-text", "keywords"],
        keywords: allKeywords
    };

    try {
        fs.writeFileSync(WIT_MATERIALS_FILE, JSON.stringify(newEntity, null, 4));
        console.log(`✅ Added ${missingInWit.length} missing materials to material.json`);
        console.log(`📝 Now contains ${allKeywords.length} total materials`);
    } catch (error) {
        console.error('❌ Error adding materials:', error.message);
    }
}

// Sync materials (clean + add)
function syncMaterials() {
    console.log('🔄 Starting materials sync...');
    cleanMaterials();
    addMissingMaterials();
    console.log('✅ Materials sync completed!');
}

// Delete material entity from Wit.ai
async function deleteMaterialEntityFromWit() {
    try {
        console.log('🗑️  Deleting existing material entity from Wit.ai...');
        await makeRequest(`${WIT_API_BASE}/entities/material`, 'DELETE');
        console.log('✅ Material entity deleted from Wit.ai');
        return true;
    } catch (error) {
        if (error.message.includes('404') || error.message.includes('not-found') || error.message.includes('Entity \'material\' not found')) {
            console.log('ℹ️  Material entity not found in Wit.ai (already deleted or never existed)');
            return true;
        }
        console.error('❌ Error deleting material entity:', error.message);
        return false;
    }
}

// Create material entity in Wit.ai
async function createMaterialEntityInWit() {
    try {
        const entityData = JSON.parse(fs.readFileSync(WIT_MATERIALS_FILE, 'utf8'));
        console.log('📤 Creating material entity in Wit.ai...');
        const response = await makeRequest(`${WIT_API_BASE}/entities`, 'POST', entityData);
        console.log('✅ Material entity created in Wit.ai');
        return response;
    } catch (error) {
        console.error('❌ Error creating material entity:', error.message);
        throw error;
    }
}

// Update material entity in Wit.ai
async function updateMaterialEntityInWit() {
    try {
        const entityData = JSON.parse(fs.readFileSync(WIT_MATERIALS_FILE, 'utf8'));
        console.log('📤 Updating material entity in Wit.ai...');
        const response = await makeRequest(`${WIT_API_BASE}/entities/material`, 'PUT', entityData);
        console.log('✅ Material entity updated in Wit.ai');
        return response;
    } catch (error) {
        console.error('❌ Error updating material entity:', error.message);
        throw error;
    }
}

// Import materials to Wit.ai
async function importMaterialsToWit() {
    try {
        console.log('🚀 Starting materials import to Wit.ai...');

        const entityData = JSON.parse(fs.readFileSync(WIT_MATERIALS_FILE, 'utf8'));

        // Check if entity exists
        try {
            await makeRequest(`${WIT_API_BASE}/entities/material`);
            console.log('   Material entity already exists, updating...');

            // Update existing entity
            await updateMaterialEntityInWit();
        } catch (error) {
            if (error.message.includes('404')) {
                console.log('   Creating new material entity...');
                // Create new entity
                await createMaterialEntityInWit();
            } else {
                throw error;
            }
        }

        console.log('🎉 Materials import completed successfully!');
        console.log('📊 Current material.json has been uploaded to Wit.ai');

    } catch (error) {
        console.error('❌ Materials import failed:', error.message);
        process.exit(1);
    }
}

// Force upload (delete and recreate)
async function forceUploadMaterials() {
    try {
        console.log('🔄 Starting force upload of materials...');

        // First try to delete existing entity
        try {
            await deleteMaterialEntityFromWit();
        } catch (deleteError) {
            console.log('⚠️  Could not delete existing entity, continuing with creation...');
        }

        // Then create new entity
        await createMaterialEntityInWit();

        console.log('🎉 Force upload completed successfully!');
        console.log('📊 Current material.json has been uploaded to Wit.ai');

    } catch (error) {
        console.error('❌ Force upload failed:', error.message);
        process.exit(1);
    }
}

// Show statistics
function showStats() {
    const { dbMaterials, witMaterials, missingInWit, extraInWit } = compareMaterials();

    console.log('\n📈 Materials Statistics:');
    console.log(`Database: ${dbMaterials.length} active materials`);
    console.log(`Wit.ai: ${witMaterials.length} materials`);
    console.log(`Missing: ${missingInWit.length} materials`);
    console.log(`Extra: ${extraInWit.length} materials`);
    console.log(`Match: ${dbMaterials.length - missingInWit.length} materials`);
}

// Reset materials (recreate from database)
function resetMaterials() {
    console.log('🔄 Resetting materials from database...');
    const dbMaterials = loadDatabaseMaterials();

    const keywords = dbMaterials.map(material => ({
        keyword: material.name,
        synonyms: [material.name]
    }));

    const newEntity = {
        name: "material",
        roles: ["material"],
        lookups: ["free-text", "keywords"],
        keywords: keywords
    };

    try {
        fs.writeFileSync(WIT_MATERIALS_FILE, JSON.stringify(newEntity, null, 4));
        console.log(`✅ Reset complete - material.json now contains ${keywords.length} materials from database`);
    } catch (error) {
        console.error('❌ Error resetting materials:', error.message);
    }
}

// Main CLI handler
async function main() {
    const command = process.argv[2];

    if (!command) {
        console.log('Usage: node manage-materials.js <command>');
        console.log('Commands:');
        console.log('  compare    - Compare database vs Wit.ai materials');
        console.log('  validate   - Validate materials files');
        console.log('  clean      - Remove extra materials from Wit.ai file');
        console.log('  add        - Add missing materials to Wit.ai file');
        console.log('  sync       - Clean and add materials (clean + add)');
        console.log('  reset      - Reset materials from database');
        console.log('  import     - Import materials to Wit.ai');
        console.log('  force-upload - Delete existing and upload current materials');
        console.log('  stats      - Show materials statistics');
        return;
    }

    switch (command) {
        case 'compare':
            compareMaterials();
            break;
        case 'validate':
            validateMaterials();
            break;
        case 'clean':
            cleanMaterials();
            break;
        case 'add':
            addMissingMaterials();
            break;
        case 'sync':
            syncMaterials();
            break;
        case 'reset':
            resetMaterials();
            break;
        case 'import':
            await importMaterialsToWit();
            break;
        case 'force-upload':
            await forceUploadMaterials();
            break;
        case 'stats':
            showStats();
            break;
        default:
            console.log(`Unknown command: ${command}`);
    }
}

// Run main if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    loadDatabaseMaterials,
    loadWitMaterials,
    compareMaterials,
    validateMaterials,
    cleanMaterials,
    addMissingMaterials,
    syncMaterials,
    resetMaterials,
    importMaterialsToWit,
    forceUploadMaterials,
    showStats
};