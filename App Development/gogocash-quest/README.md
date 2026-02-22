# GoGoCash Quest - Architecture Guide

This document explains the current code architecture in depth, so new and existing developers can onboard quickly and extend the project safely.

## 1) Project Purpose and Current State

`gogocash-quest` is a Next.js (App Router) + React + TypeScript + Tailwind CSS project.

Current state:
- The app is scaffolded and intentionally minimal.
- The root route (`/`) renders a placeholder UI.
- The foundation (routing, global styles, linting, TypeScript, and build pipeline) is in place for fast feature implementation.

## 2) Technology Stack

- Framework: Next.js (App Router)
- UI library: React
- Language: TypeScript
- Styling: Tailwind CSS + global CSS
- CSS tooling: PostCSS + Autoprefixer
- Linting: ESLint with `next/core-web-vitals`

## 3) Repository Structure (Current)

```text
gogocash-quest/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json
├── next-env.d.ts
├── public/
└── src/
    └── app/
        ├── globals.css
        ├── layout.tsx
        └── page.tsx
```

## 4) Architecture by Layer

### 4.1 Runtime and Routing Layer (App Router)

Folder: `src/app/`

This project uses the Next.js App Router model.

- `layout.tsx` defines the root HTML shell for all pages.
- `page.tsx` defines the route component for `/`.
- `metadata` in `layout.tsx` configures document-level metadata (`title`, `description`).

Why this matters:
- Every new route you add under `src/app` automatically follows this architecture.
- Shared layout concerns (providers, global wrappers, shell UI) belong in `layout.tsx`.

### 4.2 Presentation Layer (UI + Styling)

Files:
- `src/app/page.tsx`
- `src/app/globals.css`
- `tailwind.config.ts`
- `postcss.config.mjs`

Styling pipeline:
1. Tailwind utility classes are used directly in JSX (e.g., spacing, typography, layout classes).
2. Tailwind directives in `globals.css` (`@tailwind base/components/utilities`) compile generated CSS.
3. PostCSS runs Tailwind and Autoprefixer.
4. Browser receives final CSS output.

Global style baseline:
- `globals.css` sets `box-sizing: border-box` globally.
- `body` sets default margins, minimum height, and base colors.
- `:root { color-scheme: light; }` signals light color scheme preference.

### 4.3 Build and Compilation Layer

Files:
- `package.json`
- `next.config.mjs`
- `tsconfig.json`

Responsibilities:
- `package.json`: dependency graph + npm scripts for local/dev/prod workflows.
- `next.config.mjs`: Next.js runtime/build behavior (`reactStrictMode: true` is enabled).
- `tsconfig.json`: TypeScript compiler behavior and module path alias (`@/* -> ./src/*`).

Key compiler choices in `tsconfig.json`:
- `strict: true`: catches common type errors early.
- `noEmit: true`: TypeScript checks types; Next handles actual build output.
- `moduleResolution: "bundler"`: aligns with modern bundler behavior in Next.js.
- `incremental: true`: improves repeated type-check performance.

### 4.4 Quality and Guardrails Layer

File:
- `.eslintrc.json`

Lint preset:
- `next/core-web-vitals`

Why this matters:
- Enforces framework best practices.
- Catches anti-patterns that can hurt performance or accessibility.

## 5) File-by-File Deep Explanation

### `package.json`

Main responsibilities:
- Declares project identity (`name`, `version`, `private`).
- Defines scripts:
  - `dev`: local development server
  - `build`: production build
  - `start`: serve production build
  - `lint`: lint checks
- Declares dependencies and devDependencies.

Important observation:
- Most versions are set to `"latest"`. This speeds setup but increases upgrade unpredictability over time.

Recommendation:
- Pin stable versions when the project starts shipping to avoid accidental breaking changes.

### `next.config.mjs`

Current behavior:
- `reactStrictMode: true`

Impact:
- In development, React runs extra checks that reveal unsafe side effects.
- Helps surface bugs early, especially around effects and mutation-heavy logic.

### `tsconfig.json`

Core behavior:
- Strict typing is enabled.
- JS files are allowed (`allowJs: true`) for incremental migration if needed.
- Path alias lets imports use `@/...` instead of long relative paths.

Practical usage:
- Prefer `import x from "@/..."` for maintainable imports as codebase grows.

### `tailwind.config.ts`

Core behavior:
- Scans these folders for class usage:
  - `src/pages/**`
  - `src/components/**`
  - `src/app/**`
- Theme is currently default with empty `extend`.

Practical guidance:
- Add tokens to `theme.extend` (colors, spacing, font sizes) to standardize design language.

### `postcss.config.mjs`

Core behavior:
- Registers `tailwindcss` and `autoprefixer`.

Impact:
- Tailwind classes compile correctly.
- Vendor prefixes are added where needed for browser compatibility.

### `.eslintrc.json`

Core behavior:
- Extends `next/core-web-vitals`.

Impact:
- Protects against common mistakes in React/Next code.

### `next-env.d.ts`

Core behavior:
- Auto-generated by Next.js for TypeScript integration.

Rule:
- Do not manually edit this file.

### `src/app/globals.css`

Core behavior:
- Imports Tailwind layers.
- Defines base global CSS reset/style primitives.

Impact:
- All routes share these baseline styles.

### `src/app/layout.tsx`

Core behavior:
- Defines root HTML and body wrapper.
- Exports `metadata` for the app.
- Imports global CSS once for the entire app tree.

Best place for:
- App-wide providers (theme, auth, state, i18n).
- Global layout shell (header/sidebar/footer).
- Global analytics wrappers.

### `src/app/page.tsx`

Core behavior:
- Server component for the `/` route (default in App Router unless `"use client"` is added).
- Renders a basic placeholder UI.

Future usage:
- Replace with dashboard/landing content.
- Split UI into reusable components as complexity grows.

## 6) Runtime Flow (Request -> Render)

For route `/`:

1. Browser requests `/`.
2. Next maps `/` to `src/app/page.tsx`.
3. Next wraps page output with `src/app/layout.tsx`.
4. Metadata from `layout.tsx` is applied to the document head.
5. Global styles from `globals.css` and Tailwind output are applied.
6. Final HTML/CSS is returned to the browser.

## 7) How to Extend Architecture Fast (Development Playbook)

### Add a New Route

Create a folder and `page.tsx` under `src/app`:

```text
src/app/settings/page.tsx
```

This automatically creates route `/settings`.

### Add Route-Specific Layout

Add `layout.tsx` inside a route segment:

```text
src/app/settings/layout.tsx
```

This layout wraps only the `settings` subtree.

### Add Reusable UI Components

Recommended structure:

```text
src/components/
  ui/
  shared/
```

Import with alias:

```ts
import Card from "@/components/ui/Card";
```

### Add Client Interactivity

If a component needs hooks/events/browser APIs, place `"use client"` at top of that file:

```tsx
"use client";
```

Keep most route/page files server-first, and isolate client-only logic to leaf components for better performance.

### Add API Endpoints

Use route handlers:

```text
src/app/api/health/route.ts
```

Then implement `GET`, `POST`, etc.

### Add Shared Domain Logic

Recommended structure as app grows:

```text
src/
  features/
    <domain>/
      components/
      services/
      types/
      hooks/
  lib/
    utils/
    constants/
    api/
```

This keeps business logic grouped by domain instead of by file type only.

## 8) Development Workflow

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

Run production server:

```bash
npm run start
```

## 9) Suggested Next Architecture Improvements

To speed development and reduce future rework:

1. Pin package versions in `package.json` (replace `latest` with explicit versions).
2. Add a `src/components` and `src/features` structure before feature volume increases.
3. Add environment variable documentation (`.env.example` + README section).
4. Add testing stack early (unit + component + e2e).
5. Add CI checks (`lint`, `build`, tests) before team scaling.

## 10) Quick Onboarding Checklist

1. Install dependencies with `npm install`.
2. Start app with `npm run dev`.
3. Read `src/app/layout.tsx` first (global shell) and `src/app/page.tsx` second (main route).
4. Follow server-first component design and use `"use client"` only where needed.
5. Keep shared UI under `src/components` and business logic under `src/features`.

---

If you maintain this README as routes/features are added, it will stay a reliable architecture map and significantly reduce onboarding and implementation time.
