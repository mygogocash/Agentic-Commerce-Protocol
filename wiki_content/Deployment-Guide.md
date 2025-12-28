# Deployment Guide

## Prerequisites
*   Node.js 20 (LTS)
*   Firebase CLI (`npm install -g firebase-tools`)
*   Google Cloud Permissions (`Cloud Build Service Account` role)

## 1. Automated Deployment (Recommended)
We have a helper script that handles the clean-build-deploy cycle.
```bash
./deploy_to_firebase.sh
```

## 2. Manual Deployment
If you need to run steps manually:

### Build
```bash
rm -rf .next .firebase
npm run build
```
*Note: This strictly uses the Next.js build adapter for Firebase.*

### Deploy
```bash
firebase deploy --only hosting
```
*Note: This deploys both the static assets and the server-side Cloud Functions.*

## Troubleshooting
*   **"Missing Permissions"**: Go to [GCP IAM](https://console.cloud.google.com/iam-admin) and grant "Cloud Build Service Account" to the `@cloudbuild` service account.
*   **"Node Version Error"**: Ensure `package.json` has `"engines": { "node": "20" }`.
