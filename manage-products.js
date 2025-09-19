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

// File paths
const DB_PRODUCTS_PATH = path.join(__dirname, 'mylarAiQuotes.products.json');
const WIT_PRODUCTS_PATH = path.join(__dirname, 'entities', 'product.json');

/**
 * Helper function to make API requests to Wit.ai
 */
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

/**
 * Load products from database file
 */
function loadDatabaseProducts() {
    try {
        const dbProducts = JSON.parse(fs.readFileSync(DB_PRODUCTS_PATH, 'utf8'));
        return dbProducts.map(product => product.name);
    } catch (error) {
        console.error('❌ Failed to load database products:', error.message);
        return [];
    }
}

/**
 * Load products from Wit.ai entity file
 */
function loadWitProducts() {
    try {
        const witProducts = JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));
        return witProducts.keywords.map(keyword => keyword.keyword);
    } catch (error) {
        console.error('❌ Failed to load Wit.ai products:', error.message);
        return [];
    }
}

/**
 * Compare database products with Wit.ai products
 */
function compareProducts() {
    const dbProductNames = loadDatabaseProducts();
    const witProductNames = loadWitProducts();

    console.log('📊 Product Comparison Results:');
    console.log('===============================');
    console.log(`Database products: ${dbProductNames.length}`);
    console.log(`Wit.ai products: ${witProductNames.length}`);
    console.log('');

    // Find products in Wit.ai that are NOT in database
    const productsToRemove = witProductNames.filter(name => !dbProductNames.includes(name));
    console.log(`Products to remove from Wit.ai (${productsToRemove.length}):`);
    if (productsToRemove.length > 0) {
        productsToRemove.forEach(product => console.log(`  - ${product}`));
    } else {
        console.log('  None');
    }
    console.log('');

    // Find products in database that are NOT in Wit.ai
    const productsToAdd = dbProductNames.filter(name => !witProductNames.includes(name));
    console.log(`Products to add to Wit.ai (${productsToAdd.length}):`);
    if (productsToAdd.length > 0) {
        productsToAdd.forEach(product => console.log(`  + ${product}`));
    } else {
        console.log('  None');
    }
    console.log('');

    return {
        dbProducts: dbProductNames,
        witProducts: witProductNames,
        toRemove: productsToRemove,
        toAdd: productsToAdd,
        isSynced: productsToRemove.length === 0 && productsToAdd.length === 0
    };
}

/**
 * Validate JSON syntax of product files
 */
function validateProductFiles() {
    console.log('🔍 Validating product files...');

    let isValid = true;

    // Validate database products file
    try {
        JSON.parse(fs.readFileSync(DB_PRODUCTS_PATH, 'utf8'));
        console.log('✅ Database products file is valid JSON');
    } catch (error) {
        console.error('❌ Database products file has invalid JSON:', error.message);
        isValid = false;
    }

    // Validate Wit.ai products file
    try {
        JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));
        console.log('✅ Wit.ai products file is valid JSON');
    } catch (error) {
        console.error('❌ Wit.ai products file has invalid JSON:', error.message);
        isValid = false;
    }

    return isValid;
}

/**
 * Clean Wit.ai products by removing products not in database
 */
function cleanProducts(productsToRemove) {
    if (productsToRemove.length === 0) {
        console.log('✅ No products to remove - Wit.ai products are clean');
        return;
    }

    try {
        const witProducts = JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));

        console.log(`🧹 Removing ${productsToRemove.length} irrelevant products...`);

        // Filter out products to remove
        const originalCount = witProducts.keywords.length;
        witProducts.keywords = witProducts.keywords.filter(keyword =>
            !productsToRemove.includes(keyword.keyword)
        );

        const removedCount = originalCount - witProducts.keywords.length;
        console.log(`✅ Removed ${removedCount} products from Wit.ai entity`);

        // Write back the cleaned file
        fs.writeFileSync(WIT_PRODUCTS_PATH, JSON.stringify(witProducts, null, 4));
        console.log('💾 Cleaned products saved to file');

    } catch (error) {
        console.error('❌ Failed to clean products:', error.message);
    }
}

/**
 * Add missing products to Wit.ai entity
 */
function addMissingProducts(productsToAdd) {
    if (productsToAdd.length === 0) {
        console.log('✅ No products to add - all database products are present');
        return;
    }

    try {
        const witProducts = JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));

        console.log(`➕ Adding ${productsToAdd.length} missing products...`);

        // Add missing products with basic synonyms
        productsToAdd.forEach(productName => {
            const newKeyword = {
                keyword: productName,
                synonyms: [
                    productName,
                    productName.toLowerCase(),
                    productName.replace(/\s+/g, ' ')
                ]
            };
            witProducts.keywords.push(newKeyword);
        });

        console.log(`✅ Added ${productsToAdd.length} products to Wit.ai entity`);

        // Write back the updated file
        fs.writeFileSync(WIT_PRODUCTS_PATH, JSON.stringify(witProducts, null, 4));
        console.log('💾 Updated products saved to file');

    } catch (error) {
        console.error('❌ Failed to add missing products:', error.message);
    }
}

/**
 * Sync products by cleaning and adding as needed
 */
function syncProducts() {
    console.log('🔄 Starting product synchronization...');

    const comparison = compareProducts();

    if (comparison.isSynced) {
        console.log('✅ Products are already synchronized!');
        return true;
    }

    // Clean irrelevant products
    cleanProducts(comparison.toRemove);

    // Add missing products
    addMissingProducts(comparison.toAdd);

    console.log('🔄 Re-validating after sync...');
    const finalComparison = compareProducts();

    if (finalComparison.isSynced) {
        console.log('🎉 Product synchronization completed successfully!');
        return true;
    } else {
        console.log('⚠️  Product synchronization completed with some discrepancies remaining');
        return false;
    }
}

/**
 * Import products entity to Wit.ai
 */
async function importProductsToWit() {
    console.log('📤 Importing products to Wit.ai...');

    try {
        // Validate file first
        if (!validateProductFiles()) {
            console.error('❌ Cannot import - product files have validation errors');
            return false;
        }

        // Read the product entity data
        const productData = JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));

        console.log(`📝 Importing product entity: ${productData.name}`);

        // Check if entity exists
        try {
            await makeRequest(`${WIT_API_BASE}/entities/${productData.name}`);
            console.log(`   Entity ${productData.name} already exists, updating...`);

            // Update existing entity
            await makeRequest(
                `${WIT_API_BASE}/entities/${productData.name}`,
                'PUT',
                productData
            );
        } catch (error) {
            if (error.message.includes('404')) {
                console.log(`   Creating new entity: ${productData.name}`);
                // Create new entity
                await makeRequest(
                    `${WIT_API_BASE}/entities`,
                    'POST',
                    productData
                );
            } else {
                throw error;
            }
        }

        console.log('✅ Products imported to Wit.ai successfully');
        console.log('⏳ Wit.ai may take a few minutes to process the changes');

        return true;

    } catch (error) {
        console.error('❌ Failed to import products to Wit.ai:', error.message);
        return false;
    }
}
async function deleteProductEntityFromWit() {
    console.log('�️  Deleting product entity from Wit.ai...');

    try {
        // Try to delete the entity
        await makeRequest(`${WIT_API_BASE}/entities/product`, 'DELETE');
        console.log('✅ Product entity deleted from Wit.ai');
        return true;
    } catch (error) {
        if (error.message.includes('404')) {
            console.log('ℹ️  Product entity does not exist in Wit.ai');
            return true;
        } else {
            console.error('❌ Failed to delete product entity from Wit.ai:', error.message);
            return false;
        }
    }
}

/**
 * Force upload current product.json to Wit.ai (delete existing + upload)
 */
async function forceUploadProducts() {
    console.log('🚀 Force uploading products to Wit.ai...');

    // Validate the current product.json file
    if (!validateProductFiles()) {
        console.error('❌ Cannot upload - product files have validation errors');
        return false;
    }

    try {
        // Read the product entity data
        const productData = JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));
        console.log(`📝 Force uploading product entity: ${productData.name}`);

        // Step 1: Try to delete existing entity (may fail due to API issues)
        console.log('Step 1: Attempting to delete existing product entity...');
        try {
            await makeRequest(`${WIT_API_BASE}/entities/product`, 'DELETE');
            console.log('✅ Product entity deleted from Wit.ai');
        } catch (deleteError) {
            if (deleteError.message.includes('404') || deleteError.message.includes('not-found')) {
                console.log('ℹ️  Product entity does not exist in Wit.ai (nothing to delete)');
            } else if (deleteError.message.includes('500') || deleteError.message.includes('unknown')) {
                console.log('⚠️  Delete failed (API issue), will try to update existing entity instead');
            } else {
                console.error('❌ Failed to delete product entity from Wit.ai:', deleteError.message);
                return false;
            }
        }

        // Step 2: Create or update the entity
        console.log('Step 2: Creating/updating product entity...');
        try {
            // Try to create new entity first
            await makeRequest(
                `${WIT_API_BASE}/entities`,
                'POST',
                productData
            );
            console.log('✅ New product entity created in Wit.ai');
        } catch (createError) {
            if (createError.message.includes('already exists') || createError.message.includes('409')) {
                console.log('   Entity exists, updating instead...');
                // If creation fails because it exists, try to update
                await makeRequest(
                    `${WIT_API_BASE}/entities/${productData.name}`,
                    'PUT',
                    productData
                );
                console.log('✅ Existing product entity updated in Wit.ai');
            } else {
                throw createError;
            }
        }

        console.log('🎉 Force upload completed successfully!');
        console.log('📊 Current product.json has been uploaded to Wit.ai');
        console.log('⏳ Wit.ai may take a few minutes to process the changes');

        return true;

    } catch (error) {
        console.error('❌ Force upload failed:', error.message);
        return false;
    }
}

/**
 * Clear all products from Wit.ai entity file
 */
function clearAllProducts() {
    try {
        const witProducts = JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));
        
        console.log(`🗑️  Clearing all products from Wit.ai entity...`);
        console.log(`   Found ${witProducts.keywords.length} products to remove`);
        
        // Clear all keywords
        witProducts.keywords = [];
        
        // Write back the cleared file
        fs.writeFileSync(WIT_PRODUCTS_PATH, JSON.stringify(witProducts, null, 4));
        console.log('✅ All products cleared from Wit.ai entity file');
        
        return true;
    } catch (error) {
        console.error('❌ Failed to clear products:', error.message);
        return false;
    }
}

/**
 * Reload all products from database to Wit.ai entity
 */
function reloadProductsFromDatabase() {
    try {
        const dbProducts = loadDatabaseProducts();
        const witProducts = JSON.parse(fs.readFileSync(WIT_PRODUCTS_PATH, 'utf8'));
        
        console.log(`🔄 Reloading ${dbProducts.length} products from database...`);
        
        // Clear existing keywords and reload from database
        witProducts.keywords = [];
        
        // Add all database products with basic synonyms
        dbProducts.forEach(productName => {
            const newKeyword = {
                keyword: productName,
                synonyms: [
                    productName,
                    productName.toLowerCase(),
                    productName.replace(/\s+/g, ' ')
                ]
            };
            witProducts.keywords.push(newKeyword);
        });
        
        console.log(`✅ Reloaded ${witProducts.keywords.length} products from database`);
        
        // Write back the reloaded file
        fs.writeFileSync(WIT_PRODUCTS_PATH, JSON.stringify(witProducts, null, 4));
        console.log('💾 Products reloaded and saved to file');
        
        return true;
    } catch (error) {
        console.error('❌ Failed to reload products from database:', error.message);
        return false;
    }
}

/**
 * Reset products - clear all and reload from database
 */
function resetProducts() {
    console.log('🔄 Resetting products - clearing all and reloading from database...');
    
    if (!validateProductFiles()) {
        console.error('❌ Cannot reset - product files have validation errors');
        return false;
    }
    
    // Clear all products
    if (!clearAllProducts()) {
        return false;
    }
    
    // Reload from database
    if (!reloadProductsFromDatabase()) {
        return false;
    }
    
    console.log('🎉 Product reset completed successfully!');
    return true;
}

/**
 * Get product statistics
 */
function getProductStats() {
    const dbProducts = loadDatabaseProducts();
    const witProducts = loadWitProducts();

    console.log('📈 Product Statistics:');
    console.log('======================');
    console.log(`Database products: ${dbProducts.length}`);
    console.log(`Wit.ai products: ${witProducts.length}`);

    const inBoth = dbProducts.filter(name => witProducts.includes(name)).length;
    const onlyInDb = dbProducts.filter(name => !witProducts.includes(name)).length;
    const onlyInWit = witProducts.filter(name => !dbProducts.includes(name)).length;

    console.log(`Products in both: ${inBoth}`);
    console.log(`Only in database: ${onlyInDb}`);
    console.log(`Only in Wit.ai: ${onlyInWit}`);

    const syncPercentage = dbProducts.length > 0 ? ((inBoth / dbProducts.length) * 100).toFixed(1) : 0;
    console.log(`Sync percentage: ${syncPercentage}%`);
}

/**
 * Main CLI interface
 */
async function main() {
    const command = process.argv[2];

    console.log('🛍️  Wit.ai Product Manager');
    console.log('==========================');

    switch (command) {
        case 'compare':
        case 'check':
            compareProducts();
            break;

        case 'validate':
            const isValid = validateProductFiles();
            console.log(isValid ? '✅ All files are valid' : '❌ Validation failed');
            break;

        case 'clean':
            const comparison = compareProducts();
            cleanProducts(comparison.toRemove);
            break;

        case 'add':
            const comp = compareProducts();
            addMissingProducts(comp.toAdd);
            break;

        case 'sync':
            syncProducts();
            break;

        case 'import':
            await importProductsToWit();
            break;

        case 'stats':
            getProductStats();
            break;

        case 'force-upload':
            await forceUploadProducts();
            break;

        default:
            console.log('Usage: node manage-products.js <command>');
            console.log('');
            console.log('Commands:');
            console.log('  compare  - Compare database vs Wit.ai products');
            console.log('  validate - Validate JSON syntax of product files');
            console.log('  clean    - Remove irrelevant products from Wit.ai');
            console.log('  add      - Add missing products to Wit.ai');
            console.log('  sync     - Sync products (clean + add)');
            console.log('  reset       - Clear all products and reload from database');
            console.log('  force-upload - Delete existing Wit.ai entity and upload current product.json');
            console.log('  import      - Import products to Wit.ai');
            console.log('  stats       - Show product statistics');
            console.log('  full        - Run complete workflow (validate + sync + import)');
            break;
    }
}

// Export functions for use as module
module.exports = {
    compareProducts,
    validateProductFiles,
    cleanProducts,
    addMissingProducts,
    syncProducts,
    importProductsToWit,
    getProductStats,
    loadDatabaseProducts,
    loadWitProducts,
    clearAllProducts,
    reloadProductsFromDatabase,
    resetProducts,
    deleteProductEntityFromWit,
    forceUploadProducts
};

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    });
}