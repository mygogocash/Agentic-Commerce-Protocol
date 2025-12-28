# Agentic Commerce Protocol (ACP) 🚀

![Firebase](https://img.shields.io/badge/Hosting-Firebase-orange) ![Backend](https://img.shields.io/badge/Backend-Cloud%20Functions%20Gen2-blue) ![Database](https://img.shields.io/badge/Database-Firestore-yellow)

**Agentic Commerce Protocol** is a next-generation e-commerce backend built on a **Pure Firebase** architecture. It is designed to be serverless, scalable, and AI-ready, enabling agentic access to product data, user profiles, and cashback rewards.

> **Status**: 🟢 Migration Complete (MongoDB & Vercel Removed)

## 📚 Documentation
Full documentation is available in the **[Project Wiki](https://github.com/mygogocash/Agentic-Commerce-Protocol/wiki)** (once initialized).
*   **[Deployment Guide](https://github.com/mygogocash/Agentic-Commerce-Protocol/wiki/Deployment-Guide)**
*   **[API Reference](https://github.com/mygogocash/Agentic-Commerce-Protocol/wiki/API-Reference)**
*   **[Architecture Overview](https://github.com/mygogocash/Agentic-Commerce-Protocol/wiki/Architecture-Overview)**

## 🌟 Key Features
*   **Catalog**: 260,000+ Products indexed in Firestore.
*   **Search**: High-performance parameterized search (`/api/searchProducts`).
*   **User**: Persistent profiles with Email/Phone auth.
*   **Cashback**: Real-time wallet linkage and transaction tracking.

## 🛠️ Tech Stack
*   **Frontend/API**: Next.js 16 (App Router)
*   **Platform**: Firebase Hosting + Cloud Functions (Gen 2)
*   **Database**: Google Cloud Firestore
*   **Language**: TypeScript

## 🚀 Getting Started

### 1. Setup
```bash
git clone https://github.com/mygogocash/Agentic-Commerce-Protocol.git
cd Agentic-Commerce-Protocol
npm install
```

### 2. Environment
Copy `.env.local` (ensure you have the `NEXT_PUBLIC_FIREBASE_API_KEY` set).

### 3. Deploy
We use a unified script to clean, build, and deploy:
```bash
./deploy_to_firebase.sh
```

## 🧹 Migration Notes
*   **MongoDB**: Completely removed. Legacy data can be checked via `/api/check-mongo-user`.
*   **Vercel**: Terminated. All hosting is now on Firebase.
