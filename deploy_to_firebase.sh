#!/bin/bash
echo "🚀 Starting Fresh Deployment..."

# 1. Clean previous builds (Fixes ETIMEDOUT errors)
echo "🧹 Cleaning up .next and .firebase directories..."
rm -rf .next .firebase

# 2. Build the app (Node 18)
echo "🏗️  Building Next.js App..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build Successful!"
else
  echo "❌ Build Failed!"
  exit 1
fi

# 3. Deploy
echo "🔥 Deploying to Firebase..."
firebase deploy

echo "Done!"
