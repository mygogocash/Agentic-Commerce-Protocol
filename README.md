# 🛒 Agentic Commerce Protocol (ACP)
> **AI-Powered Product Discovery & Cashback Engine**

[![Firebase Deployment](https://github.com/Start-up-Bangkok/Agentic-Commerce-Protocol/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://gogocash-acp.web.app)
[![ChatGPT Ready](https://img.shields.io/badge/ChatGPT-Action_Ready-green)](https://gogocash-acp.web.app/openapi.yaml)

ACP is a headless commerce backend built on **Firebase** (Firestore + Cloud Functions). It enables AI agents (like ChatGPT) to search for products and check cashback rewards in real-time.

## 🚀 Key Features
*   **Pure Firebase Architecture**: No MongoDB, no Vercel. 100% Serverless.
*   **Agentic Search**: Keyword-based product discovery optimized for LLMs.
*   **Massive Scale**: Capable of handling 19M+ product records via `upload-csv-to-firestore.ts`.
*   **ChatGPT Integration**: Native OpenAPI support for Custom GPTs.
*   **Analytics**: Integrated Firebase Analytics for user tracking.

## 🛠️ Quick Start

### 1. Prerequisites
*   Node.js v20+
*   Firebase CLI (`npm install -g firebase-tools`)
*   `gcloud` CLI

### 2. Setup
```bash
npm install
cp .env.local.example .env.local
# Add your FIREBASE_SERVICE_ACCOUNT_KEY to env
```

### 3. Deployment
We have a unified script that handles permissions, builds, and deployment:
```bash
./fix_and_deploy.sh
```

## 🤖 ChatGPT Integration
1.  Create a Custom GPT.
2.  Import OpenAPI Spec: `https://gogocash-acp.web.app/openapi.yaml`
3.  Copy Instructions from: [`CHATGPT_INTEGRATION.md`](./CHATGPT_INTEGRATION.md)

## 📊 Data Management
*   **Upload Data**: Run `./run_daily_upload.sh` to upload CSV data to Firestore (Free Tier friendly).
*   **Search Logic**: Located in `src/ACP/services/firestore.ts`.

## 🧪 Testing
We use **Playwright** for End-to-End testing.
```bash
npx playwright test
```

## 🔄 Sync & Handover
*   **Repository Status**: Fully Synced.
*   **Next Machine**: Clone this repo and run `./fix_and_deploy.sh` to initialize.
*   **Data Upload**: Ensure you run `firebase login:print-access-token` daily before using `./run_daily_upload.sh`.

## 📂 Project Structure
*   `src/ACP`: Core logic (Services, Config, Scripts).
*   `tests/`: Playwright E2E tests.
*   `app/api`: Next.js App Router API Enpoints (Cloud Functions).
*   `public/openapi.yaml`: AI Agent Schema.

## 📝 Documentation
*   [Handover Status](./wiki_content/Handover_Status.md)
*   [Large Data Strategy](./LARGE_DATA_STRATEGY.md)
*   [ChatGPT Integration Guide](./CHATGPT_INTEGRATION.md)

