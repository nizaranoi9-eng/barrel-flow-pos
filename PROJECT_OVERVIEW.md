# Retail Packaging Engine - Project Overview

This repository contains the cleaned and organized Retail Packaging Engine app.
The project is now focused around the active Next.js retail/POS interface and its
supporting mock data, PDF, layout, and utility files.

## Current Project Structure

```text
.
+-- src/
|   +-- app/
|   |   +-- globals.css
|   |   +-- layout.tsx
|   |   +-- page.tsx
|   |   +-- orders/[id]/receipt/page.tsx
|   |   +-- products/[id]/print/page.tsx
|   +-- components/
|   |   +-- layout/MainLayout.tsx
|   |   +-- views/
|   |   |   +-- AuthView.tsx
|   |   |   +-- CustomersView.tsx
|   |   |   +-- DashboardView.tsx
|   |   |   +-- POSView.tsx
|   |   |   +-- ProductsView.tsx
|   |   |   +-- PromotionsView.tsx
|   |   |   +-- ReportsView.tsx
|   |   |   +-- SettingsView.tsx
|   |   |   +-- TransactionsView.tsx
|   |   +-- ui/
|   |   +-- InvoiceDialog.tsx
|   |   +-- MockFetchProvider.tsx
|   +-- hooks/
|   +-- lib/
|       +-- api.ts
|       +-- api-client.ts
|       +-- mock-fetch.ts
|       +-- pdf-utils.ts
|       +-- sms.ts
|       +-- store.ts
|       +-- types.ts
|       +-- utils.ts
+-- public/
+-- upload/
+-- download/
+-- examples/
+-- mini-services/
+-- package.json
+-- package-lock.json
+-- next.config.ts
+-- tailwind.config.ts
+-- tsconfig.json
+-- start-server.sh
+-- run-server.sh
```

## What Was Removed

The deleted files from the previous project state have been removed from the
current working tree and from the pushed `main` branch. The cleanup removed
legacy and unused areas including:

- Old Prisma database files: `prisma/`, `db/custom.db`
- Old API route tree that depended on server/database utilities
- Legacy skill bundles under `skills/`
- Old server utility files such as `src/lib/db.ts` and `src/lib/utils-server.ts`
- Temporary test file `test-sms.ts`

The active project now uses the mock fetch/provider flow and frontend state in
`src/lib/mock-fetch.ts`, `src/components/MockFetchProvider.tsx`, and
`src/lib/store.ts`.

## Key Changes

- Added `package-lock.json` so npm installs are reproducible.
- Updated dev startup to use webpack mode because Turbopack stalled during the
  first compile on this machine.
- Added receipt and product print pages under `src/app/orders` and
  `src/app/products`.
- Added `PromotionsView.tsx` and retained the active POS/customer/product/report
  dashboard views.
- Kept generated folders such as `node_modules` and `.next` out of Git.

## Run Locally

```bash
npm install
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

The helper scripts also run the same working dev mode:

```bash
./start-server.sh
./run-server.sh
```

## Verification Notes

- The app starts successfully with `npm run dev`.
- `http://localhost:3000` returns `HTTP/1.1 200 OK`.
- `npm run lint` currently reports pre-existing React lint rule issues in
  several components. These are not startup blockers, but should be cleaned up
  before treating lint as a release gate.

## GitHub

Current pushed repository:

```text
https://github.com/damienemg-source/Retail-Packaging-Engine
```

Current main cleanup commit:

```text
d63ae90 Organize retail packaging project
```
