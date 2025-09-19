const https = require('https');
const fs = require('fs');

// Wit.ai API configuration
const WIT_ACCESS_TOKEN = process.env.WIT_AI_ACCESS_TOKEN || '2PK7PINGGKAOFLQCHT2QLIZFZZ25XLZB';
const WIT_API_VERSION = '20200513';

if (!WIT_ACCESS_TOKEN) {
    console.error('❌ WIT_ACCESS_TOKEN environment variable is required');
    process.exit(1);
}

// Function to make HTTPS requests to Wit.ai API
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : {};
                    resolve({ statusCode: res.statusCode, response });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, response: body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Function to delete existing entity
async function deleteEntity(entityName) {
    console.log(`Deleting existing ${entityName} entity...`);

    const options = {
        hostname: 'api.wit.ai',
        path: `/entities/${entityName}?v=${WIT_API_VERSION}`,
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${WIT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const result = await makeRequest(options);
        if (result.statusCode === 200 || result.statusCode === 404) {
            console.log(`${entityName} entity deleted successfully (or didn't exist).`);
            return true;
        } else {
            console.log(`Could not delete existing entity. Status: ${result.statusCode}, Response:`, result.response);
            return false;
        }
    } catch (error) {
        console.error('Error deleting entity:', error);
        return false;
    }
}

// Function to create new entity
async function createEntity(entityData) {
    console.log(`Creating new ${entityData.name} entity...`);

    const options = {
        hostname: 'api.wit.ai',
        path: `/entities?v=${WIT_API_VERSION}`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WIT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const result = await makeRequest(options, entityData);
        if (result.statusCode === 200 || result.statusCode === 201) {
            console.log(`${entityData.name} entity created successfully.`);
            return true;
        } else {
            console.error(`Failed to create ${entityData.name} entity. Status: ${result.statusCode}, Response:`, result.response);
            return false;
        }
    } catch (error) {
        console.error('Error creating entity:', error);
        return false;
    }
}

// Main function
async function main() {
    try {
        // Read the dimensions entity file
        const entityData = JSON.parse(fs.readFileSync('./entities/dimensions.json', 'utf8'));

        // Delete existing entity (ignore if it doesn't exist)
        await deleteEntity(entityData.name);

        // Create new entity
        const success = await createEntity(entityData);

        if (success) {
            console.log('Dimensions entity imported successfully.');
        } else {
            console.error('Failed to import dimensions entity.');
            process.exit(1);
        }

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
main();