# Agentic Commerce Protocol (ACP) - Agent Documentation

## Project Overview
This repository hosts the **Agentic Commerce Protocol**, a Next.js application designed to power an AI shopping assistant ("GoGoCash"). It enables users to search for products across merchants (primarily Shopee), compare prices, and earn cashback via blockchain-linked wallets.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (via `src/ACP/lib/mongodb.ts`)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Key Directories & Files

### `src/ACP` (Core Logic)
- **`shopee.ts`**: Main service for Shopee product search. Uses MongoDB for data retrieval (`shopee_products` collection).
  - *Key Feature*: Implements natural language preprocessing (stripping "gift", "ideas") and strict fallbacks.
- **`lib/mongodb.ts`**: Singleton MongoDB connection handler optimized for serverless.
- **`scripts/`**: Utility scripts for data processing and testing (e.g., `process-shopee-feed.ts`).

### `app/api` (API Routes)
- **`/api/searchProducts`**: Endpoint for general product search. Strictly enforces Shopee data feed.
- **`/api/getGifts`**: Endpoint for Christmas gift recommendations.
- **`/api/linkWallet`**: Handles user authentication via Ethereum wallet address.
- **`/api/unlink`**: Terminates the session.

### Configuration
- **`public/openapi.yaml`**: The OpenAPI specification used by Custom GPTs to interface with this backend.
- **`agent_instructions.md`**: System prompt instructions for the AI Agent.

## Setup Instructions for Agents
1. **Environment**: Ensure `.env.local` is populated (see `.env.example`).
   - Requires `MONGODB_URI` and `MONGODB_DB`.
2. **Dependencies**: Run `npm install`.
3. **Build**: Run `npm run build` to verify type safety and build integrity.

## Common Tasks
- **Adding a new Merchant**: Implement a new service in `src/ACP/` and add it to `searchProducts.ts`.
- **Updating Search Logic**: Modify `src/ACP/shopee.ts` to adjust text search queries or filters.
- **API Changes**: Always update `public/openapi.yaml` and `agent_instructions.md` if API signatures change.
