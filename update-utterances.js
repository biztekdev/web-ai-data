const fs = require('fs');
const path = require('path');

const WIT_AI_ACCESS_TOKEN = process.env.WIT_AI_ACCESS_TOKEN || '2PK7PINGGKAOFLQCHT2QLIZFZZ25XLZB';
const WIT_API_BASE = 'https://api.wit.ai';
const headers = {
    'Authorization': `Bearer ${WIT_AI_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};

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

async function updateUtterances() {
    console.log('🔄 Updating utterances one by one...');
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
                console.log(`✅ Imported utterance at index ${i}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to import utterance at index ${i}:`, error.message);
                failCount++;
            }
        }
        console.log(`✅ Imported ${successCount} utterances from ${file}, skipped ${failCount}`);
    }
    console.log('🎉 Utterance update completed!');
    console.log('📊 Check your Wit.ai dashboard to verify the update');
}

if (require.main === module) {
    // Use node-fetch v3+ (ESM only)
    (async () => {
        global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        await updateUtterances();
    })();
}
