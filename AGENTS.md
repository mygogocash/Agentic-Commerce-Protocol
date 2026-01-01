# 🤖 AI Agent Development Guide

> **Purpose**: This document helps AI coding agents understand the project state and continue development seamlessly.

---

## 📍 Project Overview

**Agentic Commerce Protocol (ACP)** is a Next.js 16 application that powers the GoGoCash AI Shopping Assistant. It provides:
- Product search API for ChatGPT integration
- Product card pages with images
- Cashback tracking and affiliate links

## 🏗️ Architecture Summary

```
User (ChatGPT) → API → Firestore → Response
                 ↓
            Product Card Page (/product/[id])
```

**Key Technologies:**
- Next.js 16 (App Router)
- TypeScript
- Firebase Hosting + Cloud Run
- Firestore (products) + MongoDB (users)

---

## 📂 Key Files for Development

### API Routes (`app/api/`)
| File | Purpose | Lines |
|------|---------|-------|
| `searchProducts/route.ts` | Main search logic with synonyms, keywords | ~330 |
| `user/profile/route.ts` | Get user balance/tier | ~50 |
| `user/cashback/route.ts` | Cashback history | ~50 |
| `image/route.ts` | Image proxy for Shopee CDN | ~50 |
| `redirect/route.ts` | Affiliate click tracking | ~40 |

### Pages (`app/`)
| File | Purpose |
|------|---------|
| `product/[id]/page.tsx` | Product detail page with image |
| `page.tsx` | Home page |

### Configuration
| File | Purpose |
|------|---------|
| `public/openapi.yaml` | OpenAPI spec for ChatGPT |
| `docs/GPT_SETUP.md` | GPT instructions template |
| `firestore.rules` | Database security rules |
| `firebase.json` | Firebase deployment config |

---

## 🔍 Search Engine Details

Located in: `app/api/searchProducts/route.ts`

### Key Components:

1. **SYNONYMS Dictionary** (lines 15-55)
   - Maps English ↔ Thai terms
   - Expandable for new product categories

2. **extractSearchKeywords()** (lines 105-135)
   - Removes noise words ("find me a", "on Shopee")
   - Expands with synonyms
   - Returns array of keywords to search

3. **queryFirestoreByKeyword()** (lines 160-190)
   - Single keyword Firestore query
   - Uses ARRAY_CONTAINS on `keywords` field

4. **searchFirestoreProducts()** (lines 195-240)
   - Tries multiple keywords
   - Filters by price
   - Deduplicates results

### Adding New Synonyms:
```typescript
// In SYNONYMS object:
'newterm': ['newterm', 'ภาษาไทย', 'related1', 'related2'],
```

---

## 🗄️ Database Structure

### Firestore: `products` collection
```javascript
{
  title: "Product Name",
  price: 999,
  image_url: "https://cf.shopee.co.th/...",
  product_url: "https://shopee.co.th/product/...",
  rating: 4.5,
  sold: 100,
  keywords: ["keyword1", "keyword2", "คำค้นหา"],
  shopid: "123456",
  itemid: "789012"
}
```

### MongoDB: `users` collection
```javascript
{
  email: "user@example.com",
  balance: 150.50,
  go_points: 3000,
  go_tier: "Gold"
}
```

---

## 🚀 Deployment Commands

```bash
# Local development
npm run dev

# Build check
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Check security vulnerabilities
npm audit
npm audit fix
```

---

## 🔧 Common Development Tasks

### Task 1: Add New Product Category Synonyms
1. Edit `app/api/searchProducts/route.ts`
2. Add to SYNONYMS object
3. Deploy: `firebase deploy --only hosting`

### Task 2: Update API Response Fields
1. Edit the route handler
2. Update `public/openapi.yaml`
3. Update `docs/GPT_SETUP.md` if GPT behavior affected
4. Deploy and push to GitHub

### Task 3: Add New API Endpoint
1. Create folder `app/api/{endpoint}/`
2. Add `route.ts` with handler
3. Update `public/openapi.yaml`
4. Update README.md
5. Deploy

### Task 4: Modify Product Card Page
1. Edit `app/product/[id]/page.tsx`
2. Styles are inline (no external CSS)
3. Deploy

---

## 📋 Recent Changes (January 2026)

### Completed ✅
- [x] Firestore product search with ARRAY_CONTAINS
- [x] English/Thai synonyms (30+ terms)
- [x] Price filtering from natural language
- [x] Product card pages at /product/[id]
- [x] Image proxy at /api/image
- [x] OpenAPI schema with product_card_url
- [x] Comprehensive README documentation
- [x] Firebase Hosting deployment

### Known Issues 🔧
- `npm audit` shows vulnerabilities in `qs` and `cookie` packages
- These are transitive dependencies from firebase-frameworks
- Run `npm audit fix` when node_modules is clean

### Pending Improvements 📝
- [ ] Add more product category synonyms
- [ ] Implement full-text search (Algolia/Elasticsearch)
- [ ] Add product sorting options
- [ ] Implement user favorites
- [ ] Add product comparison feature

---

## 🔗 Important URLs

| Resource | URL |
|----------|-----|
| Live API | https://gogocash-acp.web.app/api |
| OpenAPI Spec | https://gogocash-acp.web.app/openapi.yaml |
| Product Example | https://gogocash-acp.web.app/product/10048433388 |
| Firebase Console | https://console.firebase.google.com/project/gogocash-acp |
| GitHub Repo | https://github.com/mygogocash/Agentic-Commerce-Protocol |

---

## 🔑 Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gogocash-acp
NEXT_PUBLIC_BASE_URL=https://gogocash-acp.web.app
MONGODB_URI=mongodb+srv://...
MONGODB_DB=gogocash
```

---

## 💡 Tips for AI Agents

1. **Search Logic**: The main search file is `app/api/searchProducts/route.ts`
2. **Product Pages**: Template is in `app/product/[id]/page.tsx`
3. **API Schema**: Always sync `public/openapi.yaml` with API changes
4. **Deploy Command**: Use `firebase deploy --only hosting`
5. **Test API**: `curl "https://gogocash-acp.web.app/api/searchProducts?query=keyboard"`

---

*Last Updated: January 1, 2026*
