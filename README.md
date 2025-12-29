# 🛒 Agentic Commerce Protocol (ACP)
> **AI-Powered Product Discovery & Cashback Engine**

[![Build Status](https://github.com/mygogocash/Agentic-Commerce-Protocol/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://gogocash-acp.web.app)
[![ChatGPT Ready](https://img.shields.io/badge/ChatGPT-Action_Ready-green)](https://gogocash-acp.web.app/openapi.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

ACP is a Next.js 16 application that powers the **GoGoCash** AI shopping assistant. It enables users to search for products across merchants (primarily Shopee), compare prices, and earn cashback through an AI-powered interface.

## 🚀 Key Features
*   **Next.js 16 Architecture**: Modern App Router with TypeScript support
*   **MongoDB Integration**: Scalable product database with optimized queries
*   **AI-Optimized Search**: Natural language processing for product discovery
*   **Email-Based Authentication**: Simplified account linking via https://app.gogocash.co
*   **ChatGPT Integration**: Native OpenAPI support for Custom GPTs
*   **Shopee Focus**: Primary integration with Shopee marketplace data
*   **Cashback Tracking**: Real-time reward calculation and user profiles

## 🏗️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (via `src/ACP/lib/mongodb.ts`)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **AI Integration**: OpenAPI 3.1 specification

## 🛠️ Quick Start

### 1. Prerequisites
*   Node.js v20+
*   MongoDB connection (local or Atlas)
*   Environment variables configured

### 2. Setup
```bash
npm install
cp .env.example .env.local
# Add your MONGODB_URI and MONGODB_DB to .env.local
```

### 3. Development
```bash
npm run dev
# Visit http://localhost:3000
```

### 4. Build & Deploy
```bash
npm run build
# Deploy to your preferred platform (Vercel recommended)
```

## 🤖 ChatGPT Integration
1.  Create a Custom GPT in ChatGPT
2.  Import OpenAPI Spec: `https://gogocash-acp.web.app/openapi.yaml`
3.  Copy Instructions from: [`agent_instructions.md`](./agent_instructions.md)
4.  **Account Linking**: Users create accounts at `https://app.gogocash.co` and share their email with the AI

## 🔑 Authentication Flow
The system uses a simplified email-based authentication:
1. Users create accounts at **https://app.gogocash.co**
2. Users share their email address with the ChatGPT assistant
3. The system links their account for cashback tracking
4. No complex session token management required

## 📊 API Endpoints
*   **`/api/searchProducts`**: Product search with cashback tracking
*   **`/api/user/profile`**: User balance and tier information
*   **`/api/user/cashback`**: Cashback transaction history
*   **`/api/getGifts`**: Christmas gift recommendations

## 🧪 Testing
We use **Playwright** for End-to-End testing:
```bash
npx playwright test
```

## 📂 Project Structure
```
├── src/ACP/                 # Core business logic
│   ├── shopee.ts           # Shopee product search service
│   ├── lib/mongodb.ts      # Database connection
│   └── scripts/            # Utility scripts
├── app/api/                # Next.js API routes
│   ├── searchProducts/     # Product search endpoint
│   ├── user/              # User profile & cashback APIs
│   └── getGifts/          # Gift recommendations
├── public/openapi.yaml     # AI Agent API specification
├── agent_instructions.md   # ChatGPT system prompt
└── tests/                 # E2E test suites
```

## 🔄 Recent Updates (December 2024)
- ✅ **Fixed TypeScript Build Errors**: Resolved all compilation issues for CI/CD
- ✅ **Updated Account Linking**: Simplified flow using https://app.gogocash.co
- ✅ **Next.js 16 Compatibility**: Removed deprecated eslint config
- ✅ **Email-Based Auth**: Streamlined authentication without session tokens
- ✅ **MongoDB Integration**: Migrated from Firebase to MongoDB for better scalability

## 📝 Documentation
*   [Agent Instructions](./agent_instructions.md) - ChatGPT system prompt
*   [ChatGPT Integration Guide](./CHATGPT_INTEGRATION.md) - Setup instructions
*   [Agent Documentation](./AGENTS.md) - Development guidelines
*   [Large Data Strategy](./LARGE_DATA_STRATEGY.md) - Scaling considerations

## 🚀 Getting Started for Developers
1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure environment**: Copy `.env.example` to `.env.local`
4. **Set up MongoDB**: Add your `MONGODB_URI` and `MONGODB_DB`
5. **Run development server**: `npm run dev`
6. **Test the build**: `npm run build`

## 🤝 Contributing
This project follows the Agentic Commerce Protocol standards. When making changes:
- Always update `public/openapi.yaml` if API signatures change
- Update `agent_instructions.md` for ChatGPT integration changes
- Run `npm run build` to verify TypeScript compilation
- Test with Playwright before deploying

---
**GoGoCash** - Empowering AI-driven commerce with intelligent cashback rewards.

