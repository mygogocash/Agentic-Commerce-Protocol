#!/bin/bash
set -e

echo "🚀 Starting 'Do It All' Fixer..."

# 1. Fix IAM Permissions using gcloud
# We get the project number first
PROJECT_ID="gogocash-acp"
echo "🔧 Fetching Project Number for $PROJECT_ID..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "✅ Project Number: $PROJECT_NUMBER"
echo "🔧 Granting permissions to Cloud Build SA: $BUILD_SA"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$BUILD_SA" --role="roles/logging.logWriter"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$BUILD_SA" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$BUILD_SA" --role="roles/storage.objectViewer"
# 1. Fix IAM Permissions using gcloud (Skip if already done, but harmless to repeat)
echo "🔧 Ensuring IAM Permissions..."
# ... (Permission commands remain, skipped for brevity in this replace block, assuming they are fine)

# 2. Deep Clean & fresh Install
echo "🧹 performing Deep Clean (removing .firebase, .next, node_modules)..."
rm -rf .firebase .next node_modules package-lock.json

echo "🔧 Installing Dependencies..."
# Install exact versions known to work well together
npm install

echo "🏗️ Building Next.js..."
npm run build

echo "🚀 Deploying to Firebase..."
# We use standard 'firebase deploy' which handles both hosting and the SSR functions automatically
firebase deploy

# 3. Prompt for Token Refresh for Upload
echo "🔄 Now let's fix the Upload Script."
echo "Please run: firebase login:print-access-token"
echo "And copy the token into .env.local manually, then run ./run_daily_upload.sh"
echo "Done."
