# Wit.ai CLI Import Script for PowerShell
# Make sure you have the Wit.ai CLI installed: npm install -g wit-cli

Write-Host "🚀 Starting Wit.ai import with CLI..." -ForegroundColor Green

# Check if wit-cli is installed
try {
    $witVersion = wit --version
    Write-Host "✅ Wit.ai CLI found: $witVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Wit.ai CLI not found. Installing..." -ForegroundColor Red
    npm install -g wit-cli
}

# Set your Wit.ai access token (replace with your actual token)
$env:WIT_AI_ACCESS_TOKEN = "2PK7PINGGKAOFLQCHT2QLIZFZZ25XLZB"

# Import entities
Write-Host "🔄 Importing entities..." -ForegroundColor Yellow
wit add-entity dimensions entities/dimensions.json
wit add-entity skus entities/skus.json
wit add-entity material entities/material.json
wit add-entity finishes entities/finishes.json
wit add-entity product entities/product.json
wit add-entity category entities/category.json
wit add-entity quantities entities/quantities.json

# Import intents
Write-Host "🔄 Importing intents..." -ForegroundColor Yellow
wit add-intent get_quote intents/get_quote.json

# Import utterances
Write-Host "🔄 Importing utterances..." -ForegroundColor Yellow
wit add-utterances utterances/utterances-1.json

# Train the model
Write-Host "🔄 Training model..." -ForegroundColor Yellow
wit train

Write-Host "✅ Import completed!" -ForegroundColor Green
Write-Host "📊 Check your Wit.ai dashboard to verify the import" -ForegroundColor Cyan
