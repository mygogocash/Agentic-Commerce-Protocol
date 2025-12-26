# 🛒 Agentic Commerce Protocol (ACP)

> **AI-powered shopping assistant that helps users find products across multiple merchants and earn cashback rewards.**

[![Live Demo](https://img.shields.io/badge/Live-gogocash--acp.vercel.app-brightgreen)](https://gogocash-acp.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/atlas)

---

## 🎯 What is ACP?

The **Agentic Commerce Protocol** is an open API specification that enables AI agents (like ChatGPT, Claude, or custom agents) to:

- 🔍 **Search products** across multiple e-commerce platforms (Shopee, Lazada)
- 💰 **Earn cashback** through affiliate tracking
- 🎁 **Get gift recommendations** based on recipient and budget
- 👛 **Link wallets** for session tracking and rewards

Think of it as an **AI Shopping Assistant API** - your AI agent connects to ACP, and users can shop through natural conversation.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- (Optional) Affiliate API keys for Lazada/InvolveAsia

### Installation

```bash
# Clone the repository
git clone https://github.com/mygogocash/Agentic-Commerce-Protocol.git
cd Agentic-Commerce-Protocol

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB connection string

# Run the development server
npm run dev
```

### Environment Variables

```env
# MongoDB Atlas (Required)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
MONGODB_DB=gogocash

# Atlas Search (Optional - for fuzzy matching)
ATLAS_SEARCH_ENABLED=false

# Affiliate APIs (Optional)
INVOLVE_API_KEY=your_key
INVOLVE_API_SECRET=your_secret
```

---

## 📚 API Reference

Base URL: `https://gogocash-acp.vercel.app`

### 1. Link Wallet

Start a session by linking a wallet address.

```http
POST /api/linkWallet
Content-Type: application/json

{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "session_token": "abc123...",
  "message": "Wallet linked successfully",
  "user": { "address": "0x742d..." }
}
```

### 2. Search Products

Search across all integrated merchants.

```http
GET /api/searchProducts?query=wireless+headphones&session_token=abc123
```

**Response:**
```json
{
  "results": [
    {
      "product_name": "Sony WH-1000XM5 Wireless Headphones",
      "product_price": 9990,
      "product_price_usd": 294,
      "currency": "THB",
      "merchant_name": "Shopee",
      "rating": 4.8,
      "cashback_rate": 0.05,
      "image_url": "https://...",
      "affiliate_link": "https://gogocash-acp.vercel.app/api/redirect?url=...",
      "in_stock": true
    }
  ]
}
```

### 3. Get Gift Ideas

Get personalized gift recommendations.

```http
GET /api/getGifts?recipient=mom&budget=50&session_token=abc123
```

### 4. Check Cashback Progress

View pending and earned cashback.

```http
GET /api/getCashback?session_token=abc123
```

### 5. Unlink Wallet

End the session.

```http
POST /api/unlink
Content-Type: application/json

{
  "session_token": "abc123"
}
```

---

## 🔌 Integrating with AI Agents

### OpenAPI Specification

The full OpenAPI spec is available at:
```
https://gogocash-acp.vercel.app/openapi.yaml
```

### ChatGPT Custom GPT

1. Create a new GPT at [chat.openai.com](https://chat.openai.com)
2. Go to **Configure** > **Actions**
3. Import schema from URL: `https://gogocash-acp.vercel.app/openapi.yaml`
4. Add the system prompt from `agent_instructions.md`

### Claude / Other Agents

Use the OpenAPI spec or implement direct HTTP calls to the endpoints above.

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│   ACP API       │────▶│   Merchants     │
│ (ChatGPT/Claude)│     │ (Next.js/Vercel)│     │ (Shopee/Lazada) │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  MongoDB Atlas  │
                        │ (379K products) │
                        └─────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | MongoDB Atlas |
| Search | Text Index + Atlas Search |
| Deployment | Vercel |
| Language | TypeScript |

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── searchProducts/    # Product search endpoint
│   │   ├── getGifts/          # Gift recommendations
│   │   ├── getCashback/       # Cashback tracking
│   │   ├── linkWallet/        # Session management
│   │   ├── unlink/            # End session
│   │   └── redirect/          # Affiliate link handler
│   └── page.tsx               # Landing page
├── src/ACP/
│   ├── shopee.ts              # Shopee integration
│   ├── lazada.ts              # Lazada integration
│   ├── involve-asia.ts        # Involve Asia affiliate
│   ├── lib/mongodb.ts         # Database connection
│   ├── scripts/               # Utility scripts
│   └── data/                  # Schema & config
├── public/
│   └── openapi.yaml           # API specification
└── docs/
    └── migration-*.md         # Documentation
```

---

## 🛠️ Scripts

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Run ESLint

# Database
npx ts-node src/ACP/data/mongodb-setup.ts      # Create indexes
npx ts-node src/ACP/scripts/push-to-cloud.ts   # Import products
npx ts-node src/ACP/scripts/check-db-stats.ts  # View stats
```

---

## 🌐 Supported Merchants

| Merchant | Region | Status |
|----------|--------|--------|
| Shopee | Thailand 🇹🇭 | ✅ Active (379K products) |
| Lazada | Thailand 🇹🇭 | ✅ Active (API) |
| Involve Asia | SEA | ✅ Active (Affiliate) |

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live API**: [gogocash-acp.vercel.app](https://gogocash-acp.vercel.app)
- **OpenAPI Spec**: [openapi.yaml](https://gogocash-acp.vercel.app/openapi.yaml)
- **GitHub**: [mygogocash/Agentic-Commerce-Protocol](https://github.com/mygogocash/Agentic-Commerce-Protocol)

---

<p align="center">
  Made with ❤️ by the GoGoCash Team
</p>
