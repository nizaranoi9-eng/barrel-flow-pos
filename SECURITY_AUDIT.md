# Security Audit

Date: 2026-05-31

## Executive Summary

The current app is a frontend-heavy demo/POS application. Most `/api/*` calls are
handled by `src/lib/mock-fetch.ts` in the browser and persisted in `localStorage`.
There is one live server route: `src/app/api/orders/[id]/receipt/route.ts`.

This means the biggest production risk is architectural: authentication,
authorization, rate limiting, and data protection cannot be trusted while they
run in the browser. The application is useful as a demo, but it needs real
server-side API routes and database-backed authorization before handling real
customers, orders, employees, or payments.

## Fixes Applied

- Added global HTTP security headers in `next.config.ts`.
- Added `src/middleware.ts` with API rate limiting, auth endpoint backoff, and
  same-origin checks for mutating API requests.
- Added mock API rate limiting/backoff for the browser-based demo API.
- Gated the browser-local mock API behind `NEXT_PUBLIC_ENABLE_MOCK_API`; it is
  disabled in production unless explicitly enabled.
- Stopped returning demo credential hints in auth errors.
- Sanitized user objects returned from mock auth/session/employee/order APIs so
  `password` and `employeePin` are not exposed in responses.
- Escaped dynamic receipt HTML in the POS print flow.
- Removed tracked `.env` from Git and added `.env.example`.

## Vulnerabilities

### Critical: Client-side authentication and authorization

The active auth/session model is implemented in browser code and `localStorage`.
Users can edit `localStorage`, alter the mocked fetch handler, or forge the
base64 authorization payload produced by `src/lib/api-client.ts`.

Fix:
- Move all `/api/*` behavior to server route handlers.
- Use signed, HttpOnly, Secure, SameSite cookies or server-side sessions.
- Enforce role checks server-side for admin, cashier, manager override, and
  destructive actions.
- Treat client state only as UI state, never as authorization.

Status: Partially mitigated for the demo by removing sensitive values from
responses. Production fix still required.

### High: Demo passwords and PINs must not ship in frontend code

`src/lib/mock-fetch.ts` ships to the browser when mock/demo mode is bundled,
so seeded passwords or PINs would be public.

Fix:
- Keep demo credentials out of source-controlled frontend code.
- Store password hashes server-side using a modern password hashing function.
- Never store employee PINs in plaintext. Hash them server-side.
- Do not expose passwords or PINs through API responses.

Status: Seeded demo password/PIN values have been removed from active source,
and auth/session/employee responses strip password/PIN fields.

### High: Sensitive business and customer data stored in localStorage

Orders, customer phone numbers, customer email addresses, employee records, and
session-like data are persisted in browser `localStorage`.

Fix:
- Store real customer/order/employee data only on a secured backend.
- Minimize client persistence.
- If offline mode is required, encrypt offline data using a key not hardcoded in
  the frontend and add an explicit retention/deletion policy.

Status: Not production safe; architectural fix required.

### High: IDOR on mock resources

The mock endpoints accept direct object IDs for orders, products, customers,
employees, documents, and settings. There is no trusted server-side ownership or
role enforcement because everything is in the browser.

Fix:
- On real server APIs, check authenticated `storeId`, user role, and resource
  ownership on every read/write/delete.
- Use authorization helpers per route and never trust IDs from the client.

Status: Not production safe; architectural fix required.

### Medium: XSS risk in generated receipt HTML

The POS print flow wrote customer/product/store values into a popup document via
template literals. User-controlled data could become HTML.

Fix:
- Escape all dynamic strings before writing HTML.
- Prefer React-rendered markup or DOM text nodes over `document.write`.

Status: POS print flow escaped. Continue reviewing any future `document.write`
or `dangerouslySetInnerHTML` use.

### Medium: CSRF controls were missing

Real server endpoints would have accepted mutating requests without checking
origin or CSRF tokens.

Fix:
- Added same-origin checks in middleware for mutating `/api/*` requests.
- For production, add per-session CSRF tokens if cookie-authenticated write APIs
  are introduced.

Status: Origin check added. Token-based CSRF should be added with real sessions.

### Medium: API rate limiting and auth backoff were missing

There was no brute-force protection for login, PIN login, manager override, OTP,
or destructive API actions.

Fix:
- Added IP-based API limits in middleware.
- Added user-aware limits when a bearer payload is present.
- Added exponential backoff for auth POST endpoints.
- Added demo/mock route limits in `mock-fetch.ts`.

Status: Implemented in-memory limits suitable for a single server instance.
Production should use Redis or another shared store.

### Medium: OTP flow uses static demo OTP

The mock OTP verification accepts `123456`.

Fix:
- Generate OTPs server-side, store only short-lived hashed OTPs, and enforce
  attempt limits.
- Never return OTP values in API responses.

Status: API no longer returns the OTP value, but the static demo verifier
remains and is not production safe.

### Low: Security headers were missing

The app did not configure CSP, frame protection, MIME sniffing protection, HSTS,
or referrer policy.

Fix:
- Added CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS,
  `Referrer-Policy`, and `Permissions-Policy`.

Status: Implemented. CSP allows inline styles because the current app uses
runtime style injection.

## SQL Injection

No active SQL/database layer is present in the cleaned project. The previous
Prisma/database files were removed. Current risk is low because there are no SQL
queries. If a backend database is reintroduced, use parameterized queries or ORM
query builders only.

## Secrets and Environment Check

Findings:
- `.gitignore` ignores `.env*`.
- `.env` was tracked previously and has now been removed from Git.
- `.env.example` was added for safe local setup guidance.
- No private API keys or third-party secret tokens were found in active source
  files.
- Firebase web app config is public client configuration and should be provided
  through deployment environment variables, not hardcoded fallback literals.
- Seeded demo credentials/PINs have been removed from active frontend source.

Fix before production:
- Rotate any OAuth client secret, Supabase token, or other credential that was
  ever committed, saved on disk, or shared in chat if it was sensitive.
- Keep demo credentials out of frontend bundles.
- Keep real secrets only in deployment secret storage.

## GDPR and Privacy Review

Data collected or stored by the current app:
- Admin/cashier name and email
- Employee PINs in the demo database
- Customer name, phone, email, address
- Order history and purchase details
- Store phone/address/settings

Current gaps:
- No privacy policy.
- No cookie/localStorage consent flow.
- No data deletion/export workflow for customers.
- No retention policy.
- PII is stored in browser `localStorage`.
- Receipt/PDF generation may expose customer contact details.
- No audit log policy or PII log redaction policy.

Fix:
- Add a privacy policy and consent notice.
- Add customer data delete/export workflows.
- Move PII to a secure backend.
- Minimize customer fields at checkout.
- Add retention rules and PII-safe logging.
- Document lawful basis and processor/subprocessor handling before production.

## Production Hardening Checklist

- Keep `NEXT_PUBLIC_ENABLE_MOCK_API=false` for production.
- Replace mock browser APIs with server route handlers or a real API backend.
- Add real password hashing and session management.
- Add resource-level authorization for every API route.
- Replace in-memory rate limiting with Redis-backed limits.
- Remove demo credentials and static OTP.
- Add CSRF tokens if using cookie-authenticated write requests.
- Add privacy policy, data export, and data deletion.
- Run dependency audit and remediate high-severity issues.
- Add security tests for auth, IDOR, CSRF, and rate limits.
