#!/bin/bash
# Cron Job Script for Agentic Commerce Protocol
# Adds 20,000 records per day to stay within Free Tier limits

cd /Users/kunanonjarat/Desktop/Agentic-Commerce-Protocol

# Ensure dependencies are installed
# npm install (optional, assumed installed)

# Run the upload script
# It automatically checks 'daily_tracker.json' and stops after 20k
npx ts-node --compiler-options '{"types":["node"], "module": "commonjs"}' src/ACP/scripts/upload-csv-to-firestore.ts >> upload.log 2>&1

echo "Daily upload job finished at $(date)" >> upload.log
