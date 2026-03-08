# GoGoCash — Agentic Commerce Protocol

An affiliate cashback platform that lets users earn rewards from online purchases through tracked affiliate links, with Web3 wallet integration and multi-chain withdrawal support.

---

## System Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   GoGoCash App      │     │   GoGoCash API       │     │  GoGoCash Admin     │
│   (Consumer Web)    │────→│   (Backend)          │←────│  (Dashboard)        │
│                     │     │                      │     │                     │
│   Next.js 16        │     │   NestJS 11          │     │   Next.js 15        │
│   React 19          │     │   MongoDB            │     │   React 19          │
│   Firebase Auth     │     │   Firebase Admin      │     │   NextAuth          │
│   Crossmint Web3    │     │   Crossmint SDK       │     │   ApexCharts        │
│   TanStack Query    │     │   Involve Asia API    │     │   MUI DataGrid      │
│   next-intl (i18n)  │     │   ethers.js           │     │   Tailwind CSS 4    │
│                     │     │   Telegram Bot         │     │                     │
│   Port: 3000        │     │   Port: 8080          │     │   Port: 3000        │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
        │                           │                           │
        │                           │                           │
        ▼                           ▼                           ▼
   app.gogocash.co          api.gogocash.co              admin dashboard
```

### External Services

| Service | Purpose |
|---------|---------|
| **MongoDB Atlas** | Primary database (users, offers, conversions, withdrawals) |
| **Firebase** | Google/Twitter/Phone authentication |
| **Crossmint** | Web3 smart wallet creation & management |
| **Involve Asia** | Affiliate network (merchant offers, deeplinks, conversion tracking) |
| **Google Drive** | File storage (withdrawal slips, offer images) |
| **Telegram Bot** | Alternative login/registration channel |
| **Blockchain RPCs** | Multi-chain withdrawal signing (Polygon, BSC, Sonic, Celo) |

---

## Repository Structure

```
.
├── App Development/
│   └── GoGoCash Production/
│       ├── gogocash_app-feature-login-firebase/    # Consumer web app
│       ├── gogocash_api-feature-login-firebase/    # Backend API
│       └── gogocash_admin-main/                     # Admin dashboard
```

| Project | Directory | Tech Stack | README |
|---------|-----------|------------|--------|
| **Consumer App** | `gogocash_app-feature-login-firebase/` | Next.js 16, Firebase, Crossmint, i18n | [App README](App%20Development/GoGoCash%20Production/gogocash_app-feature-login-firebase/README.md) |
| **Backend API** | `gogocash_api-feature-login-firebase/` | NestJS 11, MongoDB, Involve Asia | [API README](App%20Development/GoGoCash%20Production/gogocash_api-feature-login-firebase/README.md) |
| **Admin Dashboard** | `gogocash_admin-main/` | Next.js 15, ApexCharts, MUI | [Admin README](App%20Development/GoGoCash%20Production/gogocash_admin-main/README.md) |

---

## Core Business Flows

### 1. User Signup & Authentication

```
User → Firebase/Crossmint/Telegram → API verifies → JWT issued → Session
```

Supports: Google, Twitter, phone, Web3 wallet, Telegram bot, AI-assisted email login.

### 2. Affiliate Cashback Tracking

```
User clicks offer → Involve Asia deeplink (tracked) → Merchant purchase
    → Cron syncs conversions → User sees cashback balance
```

### 3. Withdrawal

```
User requests withdrawal → EIP-712 signature → Multi-chain smart contract
    → Admin reviews → Approve/reject → Slip uploaded to Google Drive
```

### 4. Points & Quests

```
Signup bonus + Referral points + Purchase points + Quest ranking system
```

---

## Quick Start (All Services)

### Prerequisites
- Node.js 20+
- Yarn
- MongoDB (local or Atlas)
- Firebase project
- Involve Asia publisher account

### 1. Backend API

```bash
cd "App Development/GoGoCash Production/gogocash_api-feature-login-firebase"
yarn install
cp .env.example .env    # Configure environment variables
yarn start:dev          # → http://localhost:8080
```

### 2. Consumer App

```bash
cd "App Development/GoGoCash Production/gogocash_app-feature-login-firebase"
yarn install
cp .env.example .env    # Configure environment variables
yarn dev                # → http://localhost:3000
```

### 3. Admin Dashboard

```bash
cd "App Development/GoGoCash Production/gogocash_admin-main"
yarn install
cp .env.example .env    # Configure environment variables
yarn dev                # → http://localhost:3001
```

---

## Deployment

| Service | Platform | Method |
|---------|----------|--------|
| **App** | Docker / Cloud | `docker build && docker run` |
| **API** | Docker / Cloud | `docker build && docker run` |
| **Admin** | Google Cloud Run / GKE / App Engine | `gcloud builds submit --config=cloudbuild.yaml` |

Each sub-project has its own `Dockerfile` and deployment configs. See individual READMEs for details.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend (App)** | Next.js 16, React 19, Tailwind CSS 4, MUI 7, next-intl |
| **Frontend (Admin)** | Next.js 15, React 19, Tailwind CSS 4, ApexCharts, MUI |
| **Backend** | NestJS 11, TypeScript, Mongoose |
| **Database** | MongoDB (Atlas) |
| **Auth** | Firebase, Crossmint, NextAuth, JWT |
| **Affiliate** | Involve Asia (deeplinks, conversions) |
| **Blockchain** | ethers.js, EIP-712, Polygon/BSC/Sonic/Celo |
| **Storage** | Google Drive API |
| **Bot** | Telegram (nestjs-telegraf) |
| **Analytics** | Google Analytics 4, Meta Pixel, GTM |
| **i18n** | next-intl (Thai, English, Japanese) |
| **CI/CD** | Cloud Build, Docker |

---

## License

See [LICENSE](LICENSE) for details.
