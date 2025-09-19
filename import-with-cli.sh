#!/bin/bash

# Wit.ai CLI Import Script
# Make sure you have the Wit.ai CLI installed: npm install -g wit-cli

echo "🚀 Starting Wit.ai import with CLI..."

# Check if wit-cli is installed
if ! command -v wit &> /dev/null; then
    echo "❌ Wit.ai CLI not found. Installing..."
    npm install -g wit-cli
fi

# Set your Wit.ai access token
export WIT_AI_ACCESS_TOKEN="2PK7PINGGKAOFLQCHT2QLIZFZZ25XLZB"

# Import entities
echo "🔄 Importing entities..."
wit add-entity dimensions entities/dimensions.json
wit add-entity skus entities/skus.json
wit add-entity material entities/material.json
wit add-entity finishes entities/finishes.json
wit add-entity product entities/product.json
wit add-entity category entities/category.json
wit add-entity quantities entities/quantities.json

# Import intents
echo "🔄 Importing intents..."
wit add-intent get_quote intents/get_quote.json

# Import utterances
echo "🔄 Importing utterances..."
wit add-utterances utterances/utterances-1.json

# Train the model
echo "🔄 Training model..."
wit train

echo "✅ Import completed!"
echo "📊 Check your Wit.ai dashboard to verify the import"
