# Expense Tracker

A minimal full-stack expense tracker built as an SDE technical assessment with production-style correctness as the primary goal. The system is designed around idempotent writes, paise-based money storage, retry-safe API behavior, backend-driven dashboard summaries, and a modular architecture rather than broad feature scope.

## Live Demo and Repository

- Live Demo: `LIVE_URL`
- Repository: `REPO_URL`

## Features

### Backend

- Retry-safe `POST /api/expenses`
- Filtering and sorting in `GET /api/expenses`
- Distinct categories endpoint via `GET /api/expenses/categories`
- Backend summary endpoint via `GET /api/expenses/dashboard`
- Sanitized Mongo responses
- Deterministic idempotency hashing
- Paise-based amount storage

### Frontend

- Server-first `app/page.tsx` architecture
- `ExpenseDashboard` client container
- Reusable `ExpenseForm`
- Category filtering via backend
- Backend-driven summary cards
- Category totals section
- Stable refresh without flicker
- Responsive layout improvements
- Improved empty states

## Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- TailwindCSS

### Backend

- Next.js route handlers
- MongoDB + Mongoose
- Zod validation

### Architecture

- `models / services / validators / utils / types` separation

## Data Model Decisions

### Amount stored as integer paise

Amounts are stored as integer paise instead of floating-point rupees. This avoids floating-point precision errors in financial calculations and keeps totals, comparisons, and sorting reliable.

### Category normalized before hashing

Category values are normalized to lowercase before idempotency hashing. This ensures logically equivalent payloads such as `Food` and `food` do not generate different retry keys.

### Unique idempotency key for retry safety

Each expense uses a deterministic `idempotencyKey` backed by a unique index. This allows duplicate network retries to resolve safely to the original record instead of inserting duplicates.

### Timestamps handled by Mongoose

Creation and update timestamps are managed by Mongoose rather than manually maintained in route handlers. This keeps persistence concerns centralized and reduces timestamp drift or accidental inconsistencies.

## Idempotency Strategy

`POST /api/expenses` generates a deterministic SHA-256 idempotency key from:

- `amount`
- `category`
- `description`
- `date`

The key is derived from normalized request data and enforced by a unique MongoDB index. If a request is retried with the same payload, the API returns the existing expense instead of creating a duplicate row. This is particularly important under unreliable network conditions where clients may retry writes automatically.

## API Endpoints

### `POST /api/expenses`

Creates an expense safely under retry conditions.

Request body:

```json
{
  "amount": 125.5,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-04-21"
}
```

Behavior:

- Validates input with Zod
- Converts rupees to integer paise before storage
- Generates deterministic idempotency key
- Returns existing record on duplicate retry

### `GET /api/expenses`

Returns expense records with optional filtering and sorting.

Supported query params:

- `category`
- `sort`

Supported sort values:

- `date_desc`
- `date_asc`
- `createdAt_desc`
- `createdAt_asc`
- `amount_desc`
- `amount_asc`

### `GET /api/expenses/categories`

Returns distinct categories:

```json
{
  "success": true,
  "data": ["food", "travel", "rent"]
}
```

### `GET /api/expenses/dashboard`

Returns backend-driven dashboard summary data including:

- total spend
- total expense count
- largest expense
- top categories
- category totals

## Dashboard Summary Endpoint

Summary cards and category totals are computed on the backend instead of being derived entirely on the client. This improves scalability and correctness because aggregation logic lives next to the database, avoids duplicating business rules in the UI, and keeps the dashboard contract explicit as the system grows.

## Frontend Architecture Decisions

### Server component root page

`app/page.tsx` remains a server component and delegates interactive state to the dashboard client component. This keeps the App Router boundary clean.

### Client dashboard container

`ExpenseDashboard` owns client-side state for expenses, filters, sorting, loading, and refresh behavior. This keeps interaction logic centralized.

### Debounced filtering

Filtering was initially designed with debounced input-based behavior to avoid unnecessary requests. The current category filter is backend-driven through category options, but the architecture still reflects the same principle: avoid wasteful request patterns.

### AbortController usage

Expense list fetching uses `AbortController` so in-flight requests can be cancelled when filter or sort state changes, reducing stale-response issues.

### Stable refresh strategy

The dashboard avoids dropping visible table content during refreshes. Existing rows remain visible while new data loads, which reduces layout shift and makes the UI feel more stable.

## Tradeoffs Due to Time Constraints

The following were intentionally excluded to prioritize correctness and reliability:

- no authentication
- no pagination
- no caching layer
- no optimistic updates
- minimal styling focus

This assessment intentionally prioritizes safe write behavior, clean API boundaries, and reliable money handling over feature breadth or deeper product polish.

## How to Run Locally

1. Install dependencies:

```bash
npm install
```

2. Set the required environment variable:

```bash
MONGODB_URI=
```

3. Start the development server:

```bash
npm run dev
```

## Future Improvements

- pagination
- authentication and user isolation
- multi-currency support
- recurring expenses
- analytics charts
- offline-first sync

## Conclusion

This project is intentionally narrow in scope and strong in correctness. It prioritizes retry-safe writes, safe financial data handling, and predictable backend behavior over feature breadth, which aligns more closely with real-world finance workflows than a demo-focused implementation.
