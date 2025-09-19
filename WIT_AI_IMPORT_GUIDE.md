# Wit.ai Import Guide

This guide will help you import the updated training data to your Wit.ai app.

## Prerequisites

1. **Wit.ai Access Token**: You need a valid Wit.ai access token
2. **Node.js**: Make sure Node.js is installed
3. **Wit.ai App**: You should have a Wit.ai app created

## Method 1: Using the Node.js Script (Recommended)

### Step 1: Set Environment Variable
```bash
# Windows PowerShell
$env:WIT_AI_ACCESS_TOKEN = "your_actual_access_token_here"

# Windows Command Prompt
set WIT_AI_ACCESS_TOKEN=your_actual_access_token_here

# Linux/Mac
export WIT_AI_ACCESS_TOKEN="your_actual_access_token_here"
```

### Step 2: Install Dependencies
```bash
cd "C:\Users\HPEliteBook850G7 A&I\Downloads\quote_mylar_ai-2025-09-18-16-14-09\quote_mylar_ai"
npm install node-fetch
```

### Step 3: Run the Import Script
```bash
node import-to-wit.js
```

## Method 2: Using Wit.ai CLI

### Step 1: Install Wit.ai CLI
```bash
npm install -g wit-cli
```

### Step 2: Set Access Token
```bash
# Windows PowerShell
$env:WIT_AI_ACCESS_TOKEN = "your_actual_access_token_here"

# Windows Command Prompt
set WIT_AI_ACCESS_TOKEN=your_actual_access_token_here
```

### Step 3: Run Import Commands
```bash
# Import entities
wit add-entity dimensions entities/dimensions.json
wit add-entity skus entities/skus.json
wit add-entity material entities/material.json
wit add-entity finishes entities/finishes.json
wit add-entity product entities/product.json
wit add-entity category entities/category.json
wit add-entity quantities entities/quantities.json

# Import intents
wit add-intent get_quote intents/get_quote.json

# Import utterances
wit add-utterances utterances/utterances-1.json

# Train the model
wit train
```

## Method 3: Using PowerShell Script

### Step 1: Edit the Script
Open `import-with-cli.ps1` and replace `"your_access_token_here"` with your actual Wit.ai access token.

### Step 2: Run the Script
```powershell
.\import-with-cli.ps1
```

## What Gets Imported

### Entities
- **dimensions**: Enhanced with keyword patterns for common dimension formats
- **skus**: Fixed mapping (2->2 instead of 2->5) with comprehensive 1-20 values
- **material**: 200+ material types and synonyms
- **finishes**: 400+ finish options and synonyms
- **product**: Product types and variations
- **category**: Product categories
- **quantities**: Quantity values and patterns

### Intents
- **get_quote**: Main intent for quote requests

### Utterances
- **100+ training examples** covering various scenarios
- **New training for your specific command**: "20000 standup pouches with spot UV and foil"
- **Multiple variations** of the same request for better recognition

## Verification

After import, verify in your Wit.ai dashboard:

1. **Entities**: Check that all entities are properly configured
2. **Intents**: Verify the `get_quote` intent exists
3. **Utterances**: Confirm all training examples are imported
4. **Model Status**: Ensure the model is trained and ready

## Testing

Test your specific command:
```
I am looking for 20000 standup pouches on standard size with spot UV and foil. I have 4 different flavors and I need white inside the pouch. Can you quote a price for me?
```

Expected entities to be extracted:
- **quantities**: 20000
- **product**: standup pouches
- **finishes**: spot UV, foil, white
- **skus**: 4

## Troubleshooting

### Common Issues

1. **Access Token Invalid**: Make sure your token is correct and has proper permissions
2. **Entity Already Exists**: The script will update existing entities
3. **Rate Limiting**: Wit.ai has rate limits, the script includes delays
4. **Network Issues**: Check your internet connection

### Error Messages

- `API Error: 401`: Invalid access token
- `API Error: 404`: Entity/intent not found (will be created)
- `API Error: 429`: Rate limit exceeded (wait and retry)

## Next Steps

After successful import:

1. **Test the model** with various quote requests
2. **Monitor performance** in the Wit.ai dashboard
3. **Add more training data** if needed
4. **Update your application** to use the improved model

## Support

If you encounter issues:
1. Check the Wit.ai documentation
2. Verify your access token permissions
3. Ensure all JSON files are valid
4. Check the Wit.ai dashboard for error details
