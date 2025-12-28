# 🛒 Agentic Commerce Protocol (ACP)

> **AI-powered shopping assistant backend that empowers agents to search products, compare prices, and manage cashback rewards via Email, Phone, or Web3 Wallet.**

[![Live Demo](https://img.shields.io/badge/Live-gogocash--acp.vercel.app-brightgreen)](https://gogocash-acp.vercel.app)
[![CI Pipeline](https://github.com/mygogocash/Agentic-Commerce-Protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/mygogocash/Agentic-Commerce-Protocol/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Hybrid-green)](https://www.mongodb.com)

---

## 🎯 What is ACP?

The **Agentic Commerce Protocol (ACP)** is a robust API layer designed for AI agents (Custom GPTs, Claude Projects, LangChain). It allows AI models to perform real-world commerce actions:

- 🔍 **Search Products**: query 300,000+ products from Shopee & Lazada with natural language.
- 🔐 **Hybrid Authentication**: Login users via **Email**, **Phone**, or **Ethereum Wallet**.
- 💰 **Cashback Tracking**: Calculate and track affiliate commissions and reward users.
- 👤 **User Profiles**: Manage user tiers (Bronze/Silver/Gold) and balances.
- 🎁 **Gift Intelligence**: Generate curated gift ideas based on budget and recipient persona.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas (Optional - system falls back to In-Memory DB if valid connection string missing)

### Installation

```bash
# Clone
git clone https://github.com/mygogocash/Agentic-Commerce-Protocol.git
cd Agentic-Commerce-Protocol

# Install
npm install

# Setup Env
cp .env.example .env.local
# (Edit .env.local with MONGODB_URI if you have one)

# Run
npm run dev
```

### ☁️ Deployment (CI/CD)

We use a GitOps workflow:
1. **GitHub Actions (CI)**: Automatically lints, builds, and tests logic on every push.
2. **Vercel (CD)**: Automatically deploys main branch to Production.

To deploy manually:
```bash
npx vercel --prod
```

---

## 📚 API Reference

**Base URL**: `https://gogocash-acp.vercel.app`

### 1. Authentication (New!)
Support for stateless session tokens via multiple methods.

**Login with Email/Phone:**
```http
POST /api/login
{ "email": "user@example.com" }
// OR
{ "phone": "+66812345678" }
```
*Returns: `session_token` (Bearer)*

**Link Wallet (Web3):**
```http
POST /api/linkWallet
{ "wallet_address": "0x..." }
```

### 2. User & Cashback
Requires header: `Authorization: Bearer <session_token>`

**Get Profile:**
```http
GET /api/user/profile
```
*Returns matching balance, points, and tier.*

**Get Cashback History:**
```http
GET /api/user/cashback
```

### 3. Product Search
Public access (or authenticated for personalized ranking).
```http
GET /api/searchProducts?query=gaming+mouse+under+1000
```

---

## 🤖 AI Agent Configuration

Want to build a **Custom GPT** or **Claude Agent**?

### Step 1: OpenAPI Schema
Use our [OpenAPI 3.1 Specification](public/openapi.yaml) to define the agent's actions.
**URL**: `https://gogocash-acp.vercel.app/openapi.yaml`

### Step 2: System Instructions
Copy the [Agent Instructions](agent_instructions.md) into your bot's system prompt. This teaches the AI how to:
- Ask for login before checking balance.
- Display product images using Markdown.
- Format affiliate links correctly.

---

## 🏗️ Architecture

**Hybrid Database Layer (`mock-db.ts`)**:
- **Primary**: Connects to MongoDB Atlas for persistent storage.
- **Fallback**: Automatically switches to In-Memory arrays if MongoDB is unreachable or unconfigured. This ensures the app **always works** for testing and demos.

**Stack**:
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Auth**: Stateless JWT-like Sessions
- **Search**: MongoDB Atlas Search (Fuzzy Matching) + Regex Fallback

---

## 📂 Project Structure

```
├── .github/workflows/    # CI Pipelines
├── app/                  # Next.js App Router
├── src/ACP/
│   ├── api/              # Core API Logic (Refactored)
│   ├── lib/              # DB Connections
│   ├── mock-db.ts        # Hybrid DB Layer
│   ├── shopee.ts         # Merchant Integration
│   └── scripts/          # Verification Scripts
├── public/
│   └── openapi.yaml      # Agent Spec
└── agent_instructions.md # System Prompt
```

---

## 🤝 Contributing

1. Fork & Branch (`feature/cool-new-thing`)
2. Commit & Push
3. Open PR (CI will run automatically)

---

<p align="center">
  Made with ❤️ by the GoGoCash Team
</p>
