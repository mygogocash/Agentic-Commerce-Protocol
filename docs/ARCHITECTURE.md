# Agentic Commerce Protocol (ACP) - Technical Architecture

## 1. Project Overview
The **Agentic Commerce Protocol (ACP)** is a backend infrastructure designed to enable AI Agents (specifically ChatGPT) to perform commerce actions—searching for products and generating monetized affiliate links with user-specific cashback tracking.

**Core Goal**: Bridge the gap between AI conversation and verified affiliate commerce.

## 2. Technology Stack

### Frontend / API Layer
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Hosting**: Firebase Hosting (Asia-Southeast1)
-   **Serverless**: Firebase Cloud Functions (2nd Gen) for SSR and API endpoints.

### Database Layer
-   **Primary DB**: **MongoDB Atlas** (User Data, Sessions, Cashback History)
    -   *Why?* Flexible schema for user profiles and high-speed complex queries.
-   **Caching/Search**: **Firestore** (Product Catalog Caching - Optional/Hybrid)

### Infrastructure & DevOps
-   **CI/CD**: Firebase CLI / GitHub Actions (Manual trigger currently)
-   **Auth**: Custom Session-based Auth (mapped to MongoDB Users)
-   **Logs**: Google Cloud Logging

## 3. System Architecture

```mermaid
graph TD
    User[User / ChatGPT] -->|1. Search "iPhone"| GPT[Custom GPT Action]
    
    subgraph "ACP Cloud Infrastructure"
        GPT -->|2. GET /api/searchProducts| API[Next.js API]
        
        API -->|3. Query| Mongo[(MongoDB)]
        API -->|4. Generate Link| AffEngine[Affiliate Engine]
        
        AffEngine -->|5. Wrap Link| Response[JSON Response]
    end
    
    Response -->|6. Display "Buy Now"| User
    
    User -->|7. Click Link| RedirectAPI[GET /api/redirect]
    
    subgraph "Tracking System"
        RedirectAPI -->|8. Verify Session| Mongo
        RedirectAPI -->|9. Inject sub_id| FinalURL[Shopee URL]
    end
    
    RedirectAPI -->|10. 302 Redirect| Shopee[Shopee App/Site]
```

## 4. Key Processes

### A. Product Search & Link Generation
1.  **Input**: User queries "running shoes" via ChatGPT.
2.  **Search**: System searches local cached feed or live API (Shopee/Lazada).
3.  **Affiliate Wrapping**:
    -   System constructs a **Universal Link**.
    -   Appends `utm_source=11442` (Affiliate ID).
    -   Appends `utm_campaign=103089` (Offer ID).
4.  **User Tracking (The "Smart" Link)**:
    -   Instead of sending the raw Shopee link, the API returns a wrapper:
    -   `https://gogocash-acp.web.app/api/redirect?url=...&session_token=XYZ`
    -   This allows the server to inject the User ID at the split second of the click.

### B. User Data Sync (Optimization)
To ensure fast and fresh data:
1.  **Indexing**: MongoDB `users` collection is indexed by `email` and `token` for O(1) lookup.
2.  **No-Cache**: API endpoints (`/userProfile`, `/userCashback`) send `Cache-Control: no-store` to prevent AI halucination or stale browser caching.

## 5. Security Model
-   **Session Strictness**: The `/api/redirect` endpoint strictly validates the `session_token` against the MongoDB `users` collection.
-   **Fallback**: If a user is not found in the DB (mock/invalid token), the link redirects *without* a `sub_id`, ensuring the tracking code doesn't break.

## 6. Directory Structure
```
src/ACP/
├── api/            # Next.js API Routes (Serverless Functions)
├── scripts/        # DevOps & Data Processing Scripts
├── services/       # Business Logic (Shopee, Lazada, Firestore)
├── lib/            # DB Connectors (MongoDB, Redis)
└── data/           # Static Feeds (fallback)
```
