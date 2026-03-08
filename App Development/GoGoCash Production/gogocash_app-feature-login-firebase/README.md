# GoGoCash App (Consumer-Facing Web Application)

> **Production URL**: https://app.gogocash.co  
> **Framework**: Next.js 16 · React 19 · TypeScript 5  
> **Styling**: Tailwind CSS 4 + Material-UI 7  
> **Auth**: Firebase + Crossmint + NextAuth.js  

GoGoCash is a **cashback platform** where users earn rewards on every purchase through affiliate merchant links. This is the consumer-facing web app that handles merchant browsing, cashback tracking, quest/ranking, wallet management, and user profile.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Routing & Pages](#routing--pages)
- [Authentication Flow](#authentication-flow)
- [Provider Hierarchy](#provider-hierarchy)
- [Feature Modules](#feature-modules)
- [API Integration](#api-integration)
- [Analytics System](#analytics-system)
- [Internationalization (i18n)](#internationalization-i18n)
- [Web3 / Crossmint Integration](#web3--crossmint-integration)
- [Styling Guide](#styling-guide)
- [Key Libraries](#key-libraries)
- [Deployment](#deployment)
- [Data Models](#data-models)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                       │
│                    (Server-Side Rendering)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Home   │  │   Shop   │  │  Quest   │  │ Profile  │       │
│  │  Banner  │  │  Detail  │  │ Ranking  │  │  Wallet  │       │
│  │ Trending │  │ Category │  │  Points  │  │ Withdraw │       │
│  │ Popular  │  │  Search  │  │  Referral│  │ Settings │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │             │
│  ┌────▼──────────────▼──────────────▼──────────────▼──────┐     │
│  │              Feature Modules (src/features/)           │     │
│  │         Business logic + Domain components             │     │
│  └────────────────────────┬───────────────────────────────┘     │
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────┐     │
│  │                   Shared Layer                          │     │
│  │  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ │     │
│  │  │  Hooks  │ │ Providers │ │Components│ │   Lib    │ │     │
│  │  │         │ │           │ │ (common) │ │          │ │     │
│  │  │useCross-│ │Analytics  │ │  Button  │ │  Axios   │ │     │
│  │  │mintLogin│ │Crossmint  │ │  Input   │ │ Services │ │     │
│  │  │useFire- │ │Session    │ │  Card    │ │  Auth    │ │     │
│  │  │baseLogin│ │Query      │ │  Layout  │ │Analytics │ │     │
│  │  └─────────┘ └───────────┘ └──────────┘ └──────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────┐     │
│  │                   External Services                     │     │
│  │   GoGoCash API  ·  Firebase  ·  Crossmint  ·  GA4     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Feature-based architecture** — each business domain has its own folder under `src/features/`
- **Server Components by default** — only client components where interactivity needed
- **Multi-provider auth** — Firebase (Google, Twitter) + Crossmint (Web3) unified via NextAuth sessions
- **Analytics-first** — GA4 + Meta Pixel + GTM baked into root provider with automatic page tracking
- **i18n routing** — Thai + English + Japanese with locale-prefixed URLs

---

## Directory Structure

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (metadata, fonts, analytics bootstrap)
│   ├── globals.css                   # Tailwind theme + custom CSS
│   ├── [locale]/                     # i18n dynamic segment
│   │   ├── layout.tsx               # NextIntlClientProvider wrapper
│   │   ├── page.tsx                 # Home page (Banner, Trending, Popular, etc.)
│   │   ├── auth/callback/           # OAuth callback handler
│   │   ├── login/                   # Firebase login page
│   │   ├── register/                # Firebase registration page
│   │   ├── shop/                    # Shop listing & detail pages
│   │   │   ├── page.tsx            # All shops listing
│   │   │   └── [id]/page.tsx       # Individual shop detail
│   │   ├── category/               # Category pages
│   │   ├── quest/                   # Quest & ranking pages
│   │   └── profile/(profile)/      # User profile (nested layout)
│   └── api/auth/[...nextauth]/      # NextAuth API route handler
│
├── features/                         # 🔑 Feature-Based Architecture
│   ├── home/component/              # Home page sections
│   │   ├── Banner.tsx               # Hero carousel banner
│   │   ├── Trending.tsx             # Trending merchants section
│   │   ├── Popular.tsx              # Popular merchants grid
│   │   ├── Special.tsx              # Special offers section
│   │   ├── Extra.tsx                # Extra offers section
│   │   ├── CategoryHome.tsx         # Category grid on home
│   │   └── ModalAfterLogin.tsx      # Post-login marketing modal
│   ├── auth/                        # Authentication feature
│   │   ├── common/                  # Shared auth utilities
│   │   └── component/               # Login/register forms
│   ├── shop/                        # Shop listing & detail
│   ├── quest/                       # Quest system & rankings
│   ├── wallet/component/            # Wallet management UI
│   ├── profile/                     # User profile management
│   │   ├── component/              # Profile UI components
│   │   ├── firebase/               # Firebase profile settings
│   │   └── layout/                 # Profile page layout
│   ├── category/                    # Category browsing
│   ├── referral/                    # Referral system
│   ├── search/                      # Search functionality
│   ├── subscription/                # Subscription management
│   └── transaction/                 # Transaction history
│
├── components/                       # Shared/Reusable Components
│   ├── analytics/
│   │   └── AnalyticsBootstrap.tsx   # GA4 gtag.js injection (server-rendered)
│   ├── common/                      # Generic UI components
│   │   ├── Button.tsx, Input.tsx, OtpInput.tsx
│   │   ├── Step.tsx, Title.tsx, ViewAll.tsx
│   │   ├── CrossmintErrorBoundary.tsx
│   │   └── card/                    # Card components
│   ├── layouts/                     # App layout components
│   │   ├── ClientLayoutWrapper.tsx  # Main layout (Header + Footer)
│   │   ├── Header.tsx, SubHeader.tsx
│   │   ├── Footer.tsx, FooterMobile.tsx
│   │   └── SubProfile.tsx, SubProfileInfo.tsx
│   ├── icons/                       # SVG icon components
│   └── auth/                        # Auth UI components
│
├── providers/                        # React Context Providers
│   ├── ProviderDefault.tsx          # 🔑 Root provider (wraps everything)
│   ├── AnalyticsProvider.tsx        # Page view tracking, user identification
│   ├── CrossmintLoginContext.tsx    # Crossmint auth state context
│   └── CrossmintReadyContext.tsx    # Crossmint SDK readiness state
│
├── hooks/                            # Custom React Hooks
│   ├── useCrossmintLogin.ts         # Crossmint auth + wallet management
│   ├── useFirebaseLogin.ts          # Firebase popup auth flow
│   ├── useSafeCrossmint.ts          # Safe Crossmint SDK access
│   └── useWithdraw*.ts              # Withdrawal operation hooks
│
├── lib/                              # Core Libraries & Services
│   ├── analytics/                   # 📊 Analytics System (GA4 + Meta + GTM)
│   │   ├── config.ts               # Analytics configuration from env vars
│   │   ├── tracker.ts              # Event tracking, consent, identity
│   │   ├── types.ts                # Event types, payload types
│   │   ├── utils.ts                # Hashing, route naming, sanitization
│   │   ├── storage.ts              # LocalStorage/SessionStorage management
│   │   └── index.ts                # Barrel export
│   ├── axios/
│   │   └── client.ts               # Axios instance + auth interceptors
│   ├── query/
│   │   └── queryClient.ts          # TanStack Query configuration
│   ├── services/                    # API service layer
│   │   ├── auth.ts                 # signInCrossmint, signInFirebase, registerFirebase
│   │   ├── offer.ts                # favoriteOffer
│   │   ├── withdraw.ts             # createMethodWithdraw, updateMethodWithdraw
│   │   └── detail.ts               # Offer detail fetcher
│   ├── crossmint/
│   │   └── SettingCrossmint.tsx     # Crossmint SDK provider setup
│   ├── authFirebase.ts             # NextAuth config with Firebase credentials
│   ├── firebaseClient.ts           # Firebase client SDK initialization
│   └── utils.ts                    # cn(), formatAddress, currency conversion
│
├── constants/                        # Static Data & Config
│   ├── Metadata.ts                  # SEO metadata (title, description, OG)
│   ├── Data.ts                      # Footer links, social icons
│   └── abi/                         # Smart contract ABIs
│
├── interfaces/                       # TypeScript Definitions
│   ├── auth.ts                      # User, IResponseLogin, IDataSignIn
│   ├── offer.ts                     # DataOffer, TypeCommissions
│   ├── quest.ts                     # QuestRankResponse
│   ├── withdraw.ts                  # ResponseWithdrawCheck, FeeData
│   ├── country.ts, rate.ts, referral.ts, shop.ts
│   └── userMyCashback.ts
│
├── i18n/                            # Internationalization Config
│   ├── routing.ts                   # defineRouting({ locales, defaultLocale })
│   └── navigation.ts               # createNavigation (Link, redirect, useRouter)
│
├── messages/                        # Translation Files
│   ├── en.json                     # English translations
│   ├── th.json                     # Thai translations
│   └── jp.json                     # Japanese translations
│
└── proxy.ts                         # (Unused duplicate of middleware)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Yarn (recommended) or npm

### Install & Run

```bash
# Install dependencies
yarn install

# Development server (http://localhost:3000)
yarn dev

# Production build
yarn build

# Start production server
yarn start
```

---

## Environment Variables

Create `.env.local` (development) or `.env.production.local` (production):

```bash
# ─── API ───
NEXT_PUBLIC_API_URL=https://api.gogocash.co

# ─── Firebase Authentication ───
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXTAUTH_SECRET=<random-secret-for-jwt-signing>
NEXTAUTH_URL=http://localhost:3000

# ─── Crossmint Web3 ───
NEXT_PUBLIC_CROSSMINT_API_KEY=ck_production_...    # Must start with ck_ or sk_

# ─── Analytics ───
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789
NEXT_PUBLIC_META_USER_SALT=gogocash-meta-v1
NEXT_PUBLIC_ANALYTICS_DEBUG=false

# ─── OAuth (for NextAuth social providers) ───
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Routing & Pages

Uses **Next.js App Router** with **next-intl** for locale-prefixed URLs.

| URL Pattern | Page | Description |
|-------------|------|-------------|
| `/` or `/th` | Home | Banner, Trending, Popular, Categories |
| `/login` | Login | Firebase auth (Google, Twitter) |
| `/register` | Register | New user registration |
| `/shop` | Shop List | Browse all merchants |
| `/shop/[id]` | Shop Detail | Merchant detail with cashback info |
| `/category` | Categories | Browse by category |
| `/quest` | Quest & Ranking | Leaderboard, points system |
| `/profile` | Profile | User settings, wallet, withdrawal |

**Locale Routing**: URLs are prefixed with locale when not default:
- `/en/shop` → English shop page
- `/th/shop` → Thai shop page (default, prefix optional)

**Middleware** (`middleware.ts`): Intercepts requests to inject locale. Excludes `/api`, `/_next`, static files.

---

## Authentication Flow

The app supports **three authentication methods**, all unified through NextAuth.js sessions:

### Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    User clicks "Login"                      │
└────────────┬──────────────────────┬────────────────────────┘
             │                      │
     ┌───────▼───────┐    ┌────────▼────────┐
     │  Firebase      │    │  Crossmint      │
     │  (Google/X)    │    │  (Web3 Wallet)  │
     └───────┬───────┘    └────────┬────────┘
             │                      │
     Firebase popup         SDK login flow
     Get ID token           Get JWT token
             │                      │
     ┌───────▼───────┐    ┌────────▼────────┐
     │ NextAuth       │    │ Backend API     │
     │ signIn()       │    │ /auth/sign-in   │
     │ → POST to API  │    │                 │
     │   /auth/log-in │    │                 │
     └───────┬───────┘    └────────┬────────┘
             │                      │
             └──────┬───────────────┘
                    │
         ┌──────────▼──────────┐
         │   NextAuth Session  │
         │   (JWT with token)  │
         │                     │
         │  access_token       │
         │  user._id           │
         │  user.email         │
         │  user.wallet        │
         │  auth_provider      │
         └─────────────────────┘
                    │
         Axios interceptor reads
         session.access_token and
         adds Bearer header to all
         subsequent API requests
```

### Key Files

| File | Role |
|------|------|
| `src/lib/authFirebase.ts` | NextAuth configuration with Firebase CredentialsProvider |
| `src/lib/firebaseClient.ts` | Firebase client SDK init (Google, Twitter providers) |
| `src/hooks/useFirebaseLogin.ts` | Hook: Firebase popup → NextAuth signIn |
| `src/hooks/useCrossmintLogin.ts` | Hook: Crossmint SDK → Backend API auth |
| `src/lib/services/auth.ts` | API calls: signInFirebase, registerFirebase, signInCrossmint |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route handler |

### Token Expiration

The Axios response interceptor detects expired tokens:
```
"Firebase ID token" error → sign out + redirect
"invalid algorithm" error → sign out + redirect
"jwt expired" error       → sign out + redirect
```

---

## Provider Hierarchy

The app uses a **deeply nested provider stack** in `src/providers/ProviderDefault.tsx`:

```
<html>
  <head>
    <AnalyticsBootstrap />           ← GA4 gtag.js (server-rendered <script>)
  </head>
  <body>
    <NextIntlClientProvider>          ← i18n translations
      <ProviderDefault>              ← Root provider wrapper
        <QueryClientProvider>         ← TanStack React Query (API caching)
          <SessionProvider>           ← NextAuth session state
            <ClientOnly>             ← Prevents SSR hydration mismatches
              <AnalyticsProvider>     ← Page tracking, user identity
                <CrossmintReadyProvider>  ← SDK initialization state
                  <CrossmintErrorBoundary>
                    <SettingCrossmint>     ← Crossmint SDK init
                      <CrossmintLoginContext>  ← User auth state
                        {children}             ← Page content
                        <Toaster />            ← Toast notifications
                      </CrossmintLoginContext>
                    </SettingCrossmint>
                  </CrossmintErrorBoundary>
                </CrossmintReadyProvider>
              </AnalyticsProvider>
            </ClientOnly>
          </SessionProvider>
        </QueryClientProvider>
        <ReactQueryDevtools />         ← Dev only
      </ProviderDefault>
    </NextIntlClientProvider>
  </body>
</html>
```

**Why this order matters:**
1. **QueryClient** must wrap everything that fetches data
2. **SessionProvider** must be above any component that reads auth state
3. **ClientOnly** prevents Crossmint SSR errors (Web3 requires `window`)
4. **AnalyticsProvider** needs session data for user identification
5. **CrossmintReady** signals when SDK is initialized
6. **CrossmintLogin** depends on SDK being ready

---

## Feature Modules

Each feature in `src/features/` contains domain-specific components and logic:

| Feature | Path | Key Components | Description |
|---------|------|----------------|-------------|
| **Home** | `features/home/` | Banner, Trending, Popular, Special, Extra, CategoryHome | Homepage sections |
| **Auth** | `features/auth/` | Login forms, registration flow | Authentication UI |
| **Shop** | `features/shop/` | Shop listing, detail page | Merchant browsing |
| **Quest** | `features/quest/` | Ranking table, point tracking | Gamification system |
| **Wallet** | `features/wallet/` | Wallet view, balance display | Crypto wallet UI |
| **Profile** | `features/profile/` | Settings, favorites, cashback history | User profile management |
| **Category** | `features/category/` | Category grid, filtered listings | Category browsing |
| **Referral** | `features/referral/` | Referral link, invite friends | Referral system |
| **Search** | `features/search/` | Search bar, results | Global search |
| **Subscription** | `features/subscription/` | Subscription plans | Premium features |
| **Transaction** | `features/transaction/` | Transaction history | Financial records |

---

## API Integration

### Architecture

```
Component → useQuery/useMutation → fetcher → Axios Client → Backend API
                                       ↑
                              Auth interceptor
                              (Bearer token)
```

### Axios Client (`src/lib/axios/client.ts`)

```typescript
// Base URL from environment
const client = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// Request interceptor: attach JWT token
client.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.user?.access_token) {
    config.headers.Authorization = `Bearer ${session.user.access_token}`;
  }
  return config;
});

// Response interceptor: handle token expiry
client.interceptors.response.use(null, (error) => {
  // Detect JWT expiry → signOut()
});
```

### Fetcher Functions (for TanStack Query)

```typescript
fetcher(url)              // GET request
fetcherPost(url, config)  // POST request  
fetcherPut(url, config)   // PUT request
```

### Service Layer (`src/lib/services/`)

| Service | Endpoints |
|---------|-----------|
| `auth.ts` | `POST /auth/sign-in`, `POST /auth/log-in`, `POST /auth/register`, `PUT /user/update-country` |
| `offer.ts` | `POST /offer/favorite/{offer_id}` |
| `withdraw.ts` | `POST /withdraw/methods`, `PATCH /withdraw/methods/{_id}` |
| `detail.ts` | `GET /offer/{id}` |

### React Query Configuration (`src/lib/query/queryClient.ts`)

```typescript
defaultOptions: {
  queries: {
    refetchOnWindowFocus: false,   // Don't spam API on tab focus
    refetchOnMount: false,         // Use cached data
    refetchOnReconnect: false,     // Don't refetch on network restore
    staleTime: 0,                  // Data considered stale immediately
  }
}
```

---

## Analytics System

A comprehensive, privacy-aware analytics system tracking user behavior across GA4, Meta Pixel, and GTM.

### Architecture

```
┌─────────────────────────────────────┐
│        AnalyticsBootstrap            │  ← Server-rendered <script> tags
│  (GA4 gtag.js in <head>)            │     for Google verification
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│        AnalyticsProvider             │  ← Client-side tracking provider
│                                      │
│  • Auto page_viewed on route change │
│  • UTM attribution capture          │
│  • User identification (hashed)     │
│  • Session management               │
│  • Consent handling                 │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│           tracker.ts                 │
│                                      │
│  track(event) → dataLayer.push()    │
│  identify(user) → hash PII          │
│  setConsent() → localStorage        │
│  initializeAnalytics() → load GTM   │
└───────────────┬─────────────────────┘
                │
        ┌───────┴──────────┐
        ▼                  ▼
   ┌─────────┐      ┌──────────┐
   │   GTM   │      │  GA4     │
   │  (tags) │      │ (direct) │
   └─────────┘      └──────────┘
```

### Event Types

| Event | When Fired | Key Data |
|-------|-----------|----------|
| `page_viewed` | Route change | pathname, route_name, page_type, locale |
| `login_completed` | After login | auth_provider, method |
| `sign_up_completed` | After registration | auth_provider, method |
| `merchant_detail_viewed` | Shop detail page | merchant_id |
| `merchant_link_clicked` | Click affiliate link | merchant_id, offer_id |
| `cashback_claim_confirmed` | Cashback claimed | amount |
| `quest_started` | Quest begins | quest_id |
| `quest_completed` | Quest finished | quest_id, points |
| `wallet_connected` | Wallet linked | wallet_type |
| `onboarding_step_completed` | Onboarding step | step_number |

### Privacy Features
- **PII Sanitization**: Email, phone, wallet addresses stripped from payloads
- **SHA-256 Hashing**: User identifiers hashed before sending to analytics
- **Consent-Gated**: Marketing tracking only fires after user consent (180-day TTL)
- **Attribution**: First-touch and current-touch UTM parameters stored in sessionStorage

### Configuration

| Env Var | Purpose |
|---------|---------|
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Master switch for all analytics |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement ID (direct gtag.js) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta/Facebook Pixel ID |
| `NEXT_PUBLIC_META_USER_SALT` | Salt for hashing user data |
| `NEXT_PUBLIC_ANALYTICS_DEBUG` | Enable debug logging |

---

## Internationalization (i18n)

### Setup

| File | Purpose |
|------|---------|
| `next-intl.config.ts` | Locale definitions: `['th', 'en']`, default: `'th'` |
| `src/i18n/routing.ts` | Route configuration with `localePrefix: 'as-needed'` |
| `src/i18n/navigation.ts` | Locale-aware `Link`, `useRouter`, `redirect` |
| `middleware.ts` | Intercepts requests to inject locale |
| `src/messages/{en,th,jp}.json` | Translation strings |

### Usage in Components

```typescript
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

function MyComponent() {
  const t = useTranslations('home');
  return <Link href="/shop">{t('viewAll')}</Link>;
}
```

### Adding a New Language

1. Add locale to `next-intl.config.ts` and `src/i18n/routing.ts`
2. Create `src/messages/{lang}.json` with all translation keys
3. The middleware will automatically handle routing

---

## Web3 / Crossmint Integration

Crossmint provides **smart wallet** creation and management:

```
┌──────────────────┐     ┌──────────────────┐
│ CrossmintProvider │────▶│  Smart Wallet     │
│ (SDK Init)        │     │  (EVM-based)      │
└────────┬─────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ CrossmintAuth    │────▶│  Login Methods    │
│ Provider          │     │  email, google,   │
│                   │     │  twitter, web3    │
└────────┬─────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│ useCrossmint     │
│ Login (hook)     │
│                  │
│ • jwt token      │
│ • user data      │
│ • wallet address │
│ • login state    │
└──────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/crossmint/SettingCrossmint.tsx` | SDK provider init, ready signal |
| `src/providers/CrossmintReadyContext.tsx` | Ready state shared via context |
| `src/providers/CrossmintLoginContext.tsx` | Login state shared via context |
| `src/hooks/useCrossmintLogin.ts` | Auth flow + wallet management |
| `src/hooks/useSafeCrossmint.ts` | Safe SDK access (SSR-safe) |
| `src/constants/abi/` | Smart contract ABIs for blockchain interactions |

---

## Styling Guide

### Stack
- **Tailwind CSS 4** — Utility-first CSS (primary)
- **Material-UI 7** — Complex components (DataGrid, icons)
- **Emotion** — CSS-in-JS (MUI dependency)
- **DM Sans** — Primary font via `next/font/google`

### CSS Variables (defined in `globals.css`)
```css
--background    /* Page background */
--foreground    /* Text color */
--text-color    /* Secondary text */
```

### Utility Function
```typescript
import { cn } from '@/lib/utils';

// Merges Tailwind classes with conflict resolution
<div className={cn('p-4 bg-white', isActive && 'bg-blue-500')} />
```

### Responsive Breakpoints
| Breakpoint | Width | Usage |
|-----------|-------|-------|
| `sm` | 640px | Small phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Wide screens |

---

## Key Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `next` | 16.0.1 | React framework with SSR |
| `react` | 19 | UI library |
| `typescript` | 5 | Type safety |
| `tailwindcss` | 4 | Utility-first CSS |
| `@mui/material` | 7.3.5 | Component library |
| `next-auth` | 4.24.13 | Session management |
| `firebase` | 12.6.0 | Client-side authentication |
| `@crossmint/client-sdk-react-ui` | 1.19.2 | Web3 wallet SDK |
| `ethers` | 6.15.0 | Blockchain interactions |
| `@tanstack/react-query` | 5.90.8 | Server state management |
| `axios` | 1.13.2 | HTTP client |
| `next-intl` | 4.5.5 | Internationalization |
| `swiper` | 12.0.3 | Touch carousel |
| `react-hot-toast` | 2.6.0 | Toast notifications |
| `react-error-boundary` | 6.0.0 | Error boundaries |
| `libphonenumber-js` | 1.12.31 | Phone number validation |

---

## Deployment

### Docker Build

```bash
# Build image
docker build -t gogocash-app \
  --build-arg NEXT_PUBLIC_ANALYTICS_ENABLED=true \
  --build-arg NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
  .

# Run container
docker run -p 3000:3000 gogocash-app
```

### Dockerfile Overview
```dockerfile
# Multi-stage build for minimal image size
FROM node:20-alpine AS base      # Base image
FROM base AS deps                # Install node_modules
FROM base AS builder             # Build Next.js app
FROM base AS runner              # Production runtime

# Security: runs as non-root user
USER nextjs
EXPOSE 3000
```

### Important Notes
- `.env*` files are **gitignored** — env vars must be passed as Docker build args or runtime env
- The `NEXT_PUBLIC_GA_MEASUREMENT_ID` must be available at **build time** (baked into client JS)
- `output: 'standalone'` is commented out due to next-intl middleware compatibility

---

## Data Models

### User
```typescript
interface User {
  _id: string;
  email: string;
  username: string;
  address: string;           // Wallet address
  auth_provider: "google" | "twitter" | "firebase" | "telegram";
  mobile?: string;
  birthdate?: string;
  gender?: string;
  region?: string;
  id_telegram?: string;
  country?: string;
}
```

### Offer (Merchant)
```typescript
interface DataOffer {
  _id: string;
  offer_id: number;
  merchant_id: number;
  offer_name: string;
  logo: string;
  banner: string;
  commissions: { [currency: string]: number }[];
  tracking_link: string;
  validation_terms: number;   // Days to validate conversion
  disabled: boolean;
  extra_point?: number;
}
```

### Withdrawal
```typescript
interface ResponseWithdrawCheck {
  totalPayoutUSD: number;
  totalPayoutTHB: number;
  feeAmount: number;
  netAmount: number;
  data: DataWithdrawCheck[];
  fee: FeeData;
}
```

### Quest / Ranking
```typescript
interface QuestRankResponse {
  _id: string;
  user_id: string;
  point: number;
  unique_merchants: number[];
  extra_point_received: number;
  rank?: number;
}
```
