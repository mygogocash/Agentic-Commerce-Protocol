# 🛒 Agentic Commerce Protocol (ACP)
> **AI-Powered Product Discovery & Cashback Engine**

[![Build Status](https://github.com/mygogocash/Agentic-Commerce-Protocol/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://gogocash-acp.web.app)
[![ChatGPT Ready](https://img.shields.io/badge/ChatGPT-Action_Ready-green)](https://gogocash-acp.web.app/openapi.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosted-orange)](https://firebase.google.com/)

---

## 📖 Table of Contents
- [What is ACP?](#-what-is-acp)
- [How It Works](#-how-it-works)
- [For Non-Technical Users](#-for-non-technical-users)
- [For Developers](#-for-developers)
- [API Reference](#-api-reference)
- [Search Features](#-search-features)
- [Product Card Pages](#-product-card-pages)
- [ChatGPT Integration](#-chatgpt-integration)
- [Project Structure](#-project-structure)
- [Deployment Guide](#-deployment-guide)
- [Contributing](#-contributing)

---

## 🎯 What is ACP?

**Agentic Commerce Protocol (ACP)** is the backend system that powers the **GoGoCash AI Shopping Assistant**. It allows users to:

1. **Search for products** using natural language (e.g., "find me a mechanical keyboard under 3000 baht")
2. **View product details** with images, prices, and ratings
3. **Earn cashback** (5%) when purchasing through our affiliate links
4. **Track their rewards** through their GoGoCash account

### 🌟 Key Benefits
| For Users | For Merchants | For Developers |
|-----------|---------------|----------------|
| Save money with 5% cashback | Increase sales via AI recommendations | Open-source and extensible |
| Natural language search | Access to AI-driven traffic | RESTful API design |
| Multi-language support | Performance analytics | TypeScript support |

---

## 🔄 How It Works

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│   User asks     │─────▶│   ChatGPT GPT    │─────▶│   ACP API       │
│   "Find me..."  │      │   (AI Assistant) │      │   (This Project)│
│                 │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └────────┬────────┘
                                                            │
                                                            ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│   User buys     │◀─────│   Product Card   │◀─────│   Firestore     │
│   & earns 5%    │      │   with Image     │      │   (Products)    │
│                 │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

### Step-by-Step Flow:
1. **User asks ChatGPT**: "Find me a gaming keyboard under 1000 baht on Shopee"
2. **ChatGPT calls our API**: Sends the search query to `/api/searchProducts`
3. **API searches Firestore**: Finds products matching keywords and price
4. **Returns results**: Products with images, prices, ratings, and cashback info
5. **User views product**: Clicks link to see product card with full details
6. **User purchases**: Buys through affiliate link and earns 5% cashback

---

## 👥 For Non-Technical Users

### What Can You Do With This?

**As a Shopper:**
- Talk to the GoGoCash AI on ChatGPT
- Ask for products in plain language (Thai or English)
- View product images and prices on beautiful product pages
- Earn 5% cashback on every purchase

**As a Business Owner:**
- Integrate AI shopping into your platform
- Use our API to power product recommendations
- White-label the product pages

### How to Use the GoGoCash AI:

1. **Create Account**: Go to https://app.gogocash.co and sign up
2. **Open ChatGPT**: Visit ChatGPT and find the "GoGoCash" GPT
3. **Share Your Email**: Tell the AI your email for cashback tracking
4. **Start Shopping**: Ask for products like:
   - "หาคีย์บอร์ดเกมมิ่งราคาไม่เกิน 2000 บาท"
   - "Find me wireless headphones under $50"
   - "ขอดูหูฟังบลูทูธ"
5. **Click & Buy**: Use the links provided to purchase and earn cashback!

### Example Conversation:
```
You: Find me a mechanical keyboard under 1000 THB

GoGoCash AI: Here are some great options with 5% cashback! 🎹

**NUBWO ALISATER X33 Mechanical Keyboard**
💰 Price: ฿749 | ⭐ Rating: 4.91
💵 Cashback: ฿37.45 (5%)
👁️ View Product | 🛒 Buy Now

[Click "View Product" to see the image and details]
```

---

## 💻 For Developers

### Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework with API routes | 16.x |
| **TypeScript** | Type-safe JavaScript | 5.x |
| **Firebase Firestore** | Product database | Latest |
| **Firebase Hosting** | Web hosting | Latest |
| **Cloud Run** | Serverless functions | Node 20 |
| **MongoDB** | User database | 7.x |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APPLICATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │ /api/search  │  │ /api/user    │  │ /product/[id]│         │
│   │ Products     │  │ /profile     │  │              │         │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│          │                 │                 │                  │
│          ▼                 ▼                 ▼                  │
│   ┌──────────────────────────────────────────────────┐         │
│   │              BUSINESS LOGIC LAYER                 │         │
│   │  - Search Engine (keywords, synonyms)            │         │
│   │  - Price Filtering                               │         │
│   │  - Cashback Calculation                          │         │
│   └──────────────────────────────────────────────────┘         │
│          │                 │                                    │
│          ▼                 ▼                                    │
│   ┌──────────────┐  ┌──────────────┐                           │
│   │  Firestore   │  │   MongoDB    │                           │
│   │  (Products)  │  │   (Users)    │                           │
│   └──────────────┘  └──────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/mygogocash/Agentic-Commerce-Protocol.git
cd Agentic-Commerce-Protocol

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev
# Open http://localhost:3000

# 5. Deploy to Firebase
firebase deploy --only hosting
```

### Environment Variables

Create a `.env.local` file with these variables:

```bash
# Firebase (Required for product search)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# MongoDB (Required for user data)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB=gogocash

# Base URL (for affiliate links)
NEXT_PUBLIC_BASE_URL=https://gogocash-acp.web.app

# Optional: Involve Asia API (for affiliate tracking)
INVOLVE_API_KEY=your-api-key
INVOLVE_API_SECRET=your-api-secret
```

---

## 📚 API Reference

### Base URL
```
https://gogocash-acp.web.app/api
```

### Endpoints

#### 1. Search Products
Search for products with natural language queries.

```http
GET /api/searchProducts?query={query}&user_email={email}&limit={limit}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query (e.g., "mechanical keyboard under 1000 THB") |
| user_email | string | No | User's email for cashback tracking |
| limit | integer | No | Number of results (default: 5) |

**Example Request:**
```bash
curl "https://gogocash-acp.web.app/api/searchProducts?query=keyboard&limit=3"
```

**Example Response:**
```json
{
  "query": "keyboard",
  "user_email": null,
  "total_results": 3,
  "results": [
    {
      "product_id": "10048433388",
      "product_name": "NUBWO ALISATER X33 Mechanical Keyboard",
      "product_price": 749,
      "currency": "THB",
      "merchant_name": "Shopee",
      "image_url": "https://gogocash-acp.web.app/api/image?url=...",
      "image_url_original": "https://cf.shopee.co.th/file/...",
      "product_url": "https://shopee.co.th/product/...",
      "product_card_url": "https://gogocash-acp.web.app/product/10048433388",
      "rating": 4.91,
      "reviews_count": 15,
      "cashback_rate": 0.05,
      "estimated_cashback": 37.45,
      "affiliate_link": "https://gogocash-acp.web.app/api/redirect?url=...",
      "in_stock": true
    }
  ],
  "source": "firestore",
  "keywords_used": ["keyboard", "คีย์บอร์ด", "mechanical", "gaming"],
  "timestamp": "2026-01-01T09:00:00.000Z"
}
```

#### 2. User Profile
Get user's cashback balance and tier.

```http
GET /api/user/profile?user_email={email}
```

**Example Response:**
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "balance": 150.50,
    "go_points": 3000,
    "go_tier": "Gold"
  }
}
```

#### 3. Cashback History
Get user's cashback transaction history.

```http
GET /api/user/cashback?user_email={email}
```

#### 4. Image Proxy
Proxy external images through our domain.

```http
GET /api/image?url={encoded_image_url}
```

#### 5. Redirect (Affiliate Tracking)
Track affiliate clicks and redirect to merchant.

```http
GET /api/redirect?url={encoded_url}&user_email={email}
```

---

## 🔍 Search Features

### How Search Works

The search engine uses a sophisticated multi-step process:

```
User Query: "Find me a mechanical keyboard under 3000 THB on Shopee"
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 1: QUERY PARSING                                        │
│  - Remove noise words: "find", "me", "a", "on", "Shopee"     │
│  - Extract keywords: "mechanical", "keyboard"                 │
│  - Extract price: 3000 THB                                    │
└───────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 2: SYNONYM EXPANSION                                    │
│  Input: ["mechanical", "keyboard"]                            │
│  Output: ["mechanical", "keyboard", "คีย์บอร์ด", "gaming",    │
│           "คีบอร์ด", "เมคานิคอล"]                              │
└───────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 3: FIRESTORE QUERY                                      │
│  - Query: ARRAY_CONTAINS on 'keywords' field                  │
│  - One query per keyword (tries until results found)          │
│  - Deduplicates results by product_id                         │
└───────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────┐
│  STEP 4: POST-PROCESSING                                      │
│  - Filter by price (≤ 3000 THB)                               │
│  - Sort by rating (highest first)                             │
│  - Limit to requested count                                   │
│  - Add affiliate tracking links                               │
└───────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          Final Results (5 products)
```

### Supported Languages

The search supports both English and Thai:

| English | Thai | Also Matches |
|---------|------|--------------|
| keyboard | คีย์บอร์ด | mechanical, gaming, คีบอร์ด |
| headphone | หูฟัง | earphone, headset, earbud |
| laptop | โน๊ตบุ๊ค | notebook, computer |
| phone | โทรศัพท์ | smartphone, mobile, iphone |
| mouse | เมาส์ | gaming, wireless |
| watch | นาฬิกา | smartwatch, smart |
| speaker | ลำโพง | bluetooth, wireless |
| camera | กล้อง | dslr, mirrorless |

### Price Filtering

The API automatically extracts price limits from queries:

| Query Format | Extracted Price |
|--------------|-----------------|
| "under 1000 THB" | ≤ 1000 |
| "within 3,500 baht" | ≤ 3500 |
| "ไม่เกิน 2000" | ≤ 2000 |
| "below $50" | ≤ 50 USD (~1750 THB) |
| "budget 1500" | ≤ 1500 |

---

## 🖼️ Product Card Pages

Each product has a dedicated page at `/product/{product_id}`.

### URL Format
```
https://gogocash-acp.web.app/product/10048433388
```

### Page Features
- **GoGoCash branded header** with cashback badge
- **Full product image** from Shopee
- **Product name** (Thai and English)
- **Star rating** with sold count
- **Price** in Thai Baht
- **Cashback amount** (5% highlighted)
- **Buy Now button** with affiliate tracking
- **Responsive design** for mobile

### Technical Implementation
The page is a Next.js dynamic route at `app/product/[id]/page.tsx`:
- Server-side rendered for SEO
- Fetches product from Firestore
- Generates Open Graph meta tags for social sharing
- Styled with inline CSS (no external dependencies)

---

## 🤖 ChatGPT Integration

### Setting Up Your GPT

1. **Go to ChatGPT**: Open chat.openai.com
2. **Create a GPT**: Click "Explore GPTs" → "Create"
3. **Name it**: "GoGoCash Shopping Assistant"
4. **Add Actions**: 
   - Click "Configure" → "Add actions"
   - Import from URL: `https://gogocash-acp.web.app/openapi.yaml`
5. **Add Instructions**: Copy from `docs/GPT_SETUP.md`
6. **Set Privacy Policy**: `https://gogocash.gitbook.io/doc/legal/gogocash-privacy-policy`
7. **Publish**: Make it public or keep private

### GPT Instructions Template

```
You are the GoGoCash Shopping Assistant. Your goal is to help users find products with cashback rewards.

### How to Display Products:
For EACH product, show:

---
**[Product Name]**

💰 **Price:** ฿[price] | ⭐ **Rating:** [rating]
💵 **Cashback:** ฿[estimated_cashback] (5%)

👁️ [**View Product & Image**](product_card_url) | 🛒 [**Buy Now**](affiliate_link)

---

### Important Rules:
- Always ask for user's email for cashback tracking
- Use `product_card_url` for "View Product" link
- Use `affiliate_link` for "Buy Now" link
- Never make up product details
```

### OpenAPI Schema

The API is documented using OpenAPI 3.1:
```yaml
openapi: 3.1.0
info:
  title: Agentic Commerce Protocol (ACP)
  version: 1.0.0
servers:
  - url: https://gogocash-acp.web.app/api
paths:
  /searchProducts:
    get:
      operationId: searchProducts
      parameters:
        - name: query
          in: query
          required: true
          schema:
            type: string
        - name: user_email
          in: query
          required: false
          schema:
            type: string
        - name: limit
          in: query
          required: false
          schema:
            type: integer
```

---

## 📂 Project Structure

```
Agentic-Commerce-Protocol/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── searchProducts/       # Product search
│   │   │   └── route.ts          # Search logic (280 lines)
│   │   ├── user/                 # User APIs
│   │   │   ├── profile/route.ts  # Get user profile
│   │   │   └── cashback/route.ts # Cashback history
│   │   ├── image/route.ts        # Image proxy
│   │   └── redirect/route.ts     # Affiliate redirector
│   ├── product/                  # Product pages
│   │   └── [id]/page.tsx         # Dynamic product card
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── src/ACP/                      # Core business logic
│   ├── services/                 # Service modules
│   │   └── firestore.ts          # Firestore client
│   ├── lib/                      # Shared libraries
│   │   └── mongodb.ts            # MongoDB connection
│   ├── types.ts                  # TypeScript types
│   └── scripts/                  # Utility scripts
│       └── upload-products.ts    # Product data upload
│
├── public/                       # Static files
│   └── openapi.yaml              # OpenAPI specification
│
├── docs/                         # Documentation
│   └── GPT_SETUP.md              # ChatGPT setup guide
│
├── firestore.rules               # Firestore security rules
├── firebase.json                 # Firebase configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

### Key Files Explained

| File | Purpose | Lines |
|------|---------|-------|
| `app/api/searchProducts/route.ts` | Main search logic with synonyms | ~280 |
| `app/product/[id]/page.tsx` | Product detail page | ~250 |
| `public/openapi.yaml` | API spec for ChatGPT | ~140 |
| `firestore.rules` | Database security | ~20 |
| `docs/GPT_SETUP.md` | GPT instructions | ~60 |

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 20+ installed
- Firebase CLI installed (`npm i -g firebase-tools`)
- Firebase project created
- Firestore database enabled

### Step 1: Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize project
firebase init
# Select: Hosting, Firestore
# Choose existing project: gogocash-acp
```

### Step 2: Firestore Security Rules

Deploy the security rules to allow public read access to products:
```bash
firebase deploy --only firestore:rules
```

### Step 3: Build and Deploy

```bash
# Build the Next.js app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Step 4: Verify Deployment

```bash
# Test the API
curl "https://gogocash-acp.web.app/api/searchProducts?query=keyboard&limit=1"

# Test product page
open "https://gogocash-acp.web.app/product/10048433388"
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make changes**
4. **Test locally**: `npm run dev`
5. **Build**: `npm run build`
6. **Submit PR**

### Code Standards

- **TypeScript**: All code must be typed
- **Formatting**: Use Prettier (included in project)
- **Comments**: Add JSDoc comments for functions
- **Tests**: Add tests for new features

### Common Tasks

**Adding a new synonym:**
Edit `SYNONYMS` object in `app/api/searchProducts/route.ts`:
```typescript
const SYNONYMS: { [key: string]: string[] } = {
    // Add your new synonym here
    'tablet': ['tablet', 'แท็บเล็ต', 'ipad', 'galaxy tab'],
};
```

**Adding a new API endpoint:**
1. Create folder in `app/api/`
2. Add `route.ts` with handler
3. Update `public/openapi.yaml`
4. Update this README

**Updating product data:**
Products are stored in Firestore. Use the upload script:
```bash
npx ts-node src/ACP/scripts/upload-products.ts
```

---

## 📄 License

This project is proprietary software owned by GoGoCash.

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| **Live API** | https://gogocash-acp.web.app/api |
| **OpenAPI Spec** | https://gogocash-acp.web.app/openapi.yaml |
| **Product Page Example** | https://gogocash-acp.web.app/product/10048433388 |
| **GoGoCash App** | https://app.gogocash.co |
| **Privacy Policy** | https://gogocash.gitbook.io/doc/legal/gogocash-privacy-policy |
| **GitHub** | https://github.com/mygogocash/Agentic-Commerce-Protocol |

---

**GoGoCash** - Empowering AI-driven commerce with intelligent cashback rewards. 🛒💰
