# Agentic Commerce Protocol (ACP) - GoGoCash

An AI-first commerce protocol designed to act as the backend for ChatGPT Agents (and other LLMs). It enables AI agents to search for products across multiple platforms, generate affiliate links, link user wallets, and track cashback.

## Features

*   **Platform Agnostic Search**: Hybrid search engine combining **Lazada Open Platform** (Real-time), **Shopee** (via Involve Asia), and fallback mock data for demonstration.
*   **Affiliate Link Wrapping**: Automatically wraps all product links with a branded redirection service (`/api/redirect?url=...`) to track clicks and attribute commissions.
*   **Stateless Session Management**: Securely links user wallets using stateless, Base64-encoded session tokens (robust against serverless cold starts).
*   **AI-Optimized Schemas**: Includes a highly optimized `openapi.yaml` and System Prompt designed specifically for GPT Actions.
*   **Mock & Real Modes**: seamlessly switches between mock data (for testing/demo) and real APIs (Lazada/Involve Asia) based on credentials.

## Technology Stack

*   **Framework**: Next.js 14+ (App Router)
*   **Language**: TypeScript
*   **Deployment**: Vercel (recommended)
*   **Data**: Stateless (No external database required for MVP)

---

## Getting Started

### Prerequisites

*   Node.js 18+
*   A Vercel account (for deployment)
*   (Optional) Lazada Open Platform Account
*   (Optional) Involve Asia Publisher Account

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/mygogocash/Agentic-Commerce-Protocol.git
    cd Agentic-Commerce-Protocol
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env.local` file in the root directory:
    ```env
    # Base URL for local dev
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # API Keys (Optional - System falls back to mock data if missing)
    # Lazada
    LAZADA_APP_KEY=your_lazada_app_key
    LAZADA_APP_SECRET=your_lazada_app_secret
    LAZADA_USER_TOKEN=your_lazada_access_token

    # Involve Asia (Shopee)
    INVOLVE_API_KEY=your_involve_key
    INVOLVE_API_SECRET=your_involve_secret
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Deployment on Vercel

1.  Push your code to a Git repository (GitHub/GitLab).
2.  Import the project into Vercel.
3.  Add the Environment Variables in the Vercel Dashboard (Settings > Environment Variables).
4.  Deploy!

**Public URL**: You will get a URL like `https://gogocash-acp.vercel.app`.

---

## ChatGPT Configuration (GPTs)

To connect a custom GPT to this backend:

1.  Acess the **GPT Builder** or **Actions** configuration.
2.  **Import Schema**:
    *   Click "Import from URL".
    *   Enter your deployed URL ending in `/openapi.yaml` (e.g., `https://gogocash-acp.vercel.app/openapi.yaml`).
    *   *Note*: This project automatically serves the latest schema at that path.
3.  **Authentication**:
    *   Select **API Key** -> **Bearer**.
    *   (The agent handles token generation internally via the `linkWallet` endpoint, but GPT requires a placeholder setup).
4.  **Instructions**:
    *   Copy the `System Prompt` (found in `agent_instructions.md` if available, or generate one based on the API capabilities).
    *   **Crucial Rule**: Ensure the GPT is instructed to *always display images* using markdown `![Alt](url)`.

---

## Project Structure

*   `src/ACP/`: **Core Logic**. Contains all the "Agentic" protocols.
    *   `/api`: Business logic for API endpoints.
    *   `/scripts`: Verification scripts (`verify-all.js`, `probe-involve.js`).
    *   `lazada.ts`: Lazada API Client.
    *   `mock-db.ts`: Session management.
*   `app/api/`: **Next.js Routes**. Minimal shims that map HTTP requests to `src/ACP` logic.
*   `public/openapi.yaml`: The interface definition for AI agents.

## Verification

To test if everything is working (Locally):

```bash
# Runs a full simulation of the Agent's flow
node src/ACP/scripts/verify-all.js
```
