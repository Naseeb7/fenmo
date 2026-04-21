# Expense Tracker

A production-style full-stack expense tracker built as an SDE technical assessment with correctness under unreliable network conditions as the primary goal. The system emphasizes retry-safe writes, deterministic financial data handling using integer paise storage, backend-driven dashboard summaries, and a modular service-oriented architecture rather than feature breadth.

## Live Demo and Repository

- Live Demo: `https://fenmo-sigma.vercel.app/`
- Repository: `https://github.com/Naseeb7/fenmo`

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

## Database Indexing Strategy

The following indexes are defined to support correctness and query performance:

- `idempotencyKey` (unique index) ensures retry-safe writes
- `category` index supports filtering
- `date` index supports sorting
- `createdAt` index supports alternative sort modes
- `amount` index supports amount-based ordering

These indexes align with expected query patterns used by list and dashboard endpoints.

## Idempotency Strategy

`POST /api/expenses` generates a deterministic SHA-256 idempotency key from:

- `amount`
- `category`
- `description`
- `date`

The key is derived from normalized request data and enforced by a unique MongoDB index. If a request is retried with the same payload, the API returns the existing expense instead of creating a duplicate row. This is particularly important under unreliable network conditions where clients may retry writes automatically.

## Reliability Under Retry Conditions

The system is designed to behave predictably under unreliable network conditions where clients may retry requests automatically.

This is achieved through:

- deterministic SHA-256 idempotency keys
- MongoDB unique index enforcement
- duplicate-key retry fallback logic
- normalized request payload hashing

Together these ensure duplicate submissions resolve to the original record instead of inserting multiple entries.

## API Contract

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

Response shape:

```json
{
  "success": true,
  "data": {
    "_id": "mongo-id",
    "amount": 12550,
    "category": "food",
    "description": "Lunch",
    "date": "2026-04-21T00:00:00.000Z",
    "createdAt": "2026-04-21T10:00:00.000Z",
    "updatedAt": "2026-04-21T10:00:00.000Z"
  }
}
```

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

Example:

```http
GET /api/expenses?category=food&sort=amount_desc
```

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "_id": "mongo-id",
      "amount": 12550,
      "category": "food",
      "description": "Lunch",
      "date": "2026-04-21T00:00:00.000Z",
      "createdAt": "2026-04-21T10:00:00.000Z",
      "updatedAt": "2026-04-21T10:00:00.000Z"
    }
  ]
}
```

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

Response shape:

```json
{
  "success": true,
  "data": {
    "totalAmount": 523500,
    "expenseCount": 18,
    "highestExpense": {
      "_id": "mongo-id",
      "amount": 120000,
      "category": "rent",
      "description": "Monthly rent",
      "date": "2026-04-01T00:00:00.000Z",
      "createdAt": "2026-04-01T09:00:00.000Z",
      "updatedAt": "2026-04-01T09:00:00.000Z"
    },
    "topCategories": [{ "category": "rent", "totalAmount": 120000 }],
    "categoryTotals": [
      { "category": "rent", "totalAmount": 120000 },
      { "category": "food", "totalAmount": 45500 }
    ]
  }
}
```

## Dashboard Summary Endpoint

Summary cards and category totals are computed on the backend instead of being derived entirely on the client. This improves scalability and correctness because aggregation logic lives next to the database, avoids duplicating business rules in the UI, and keeps the dashboard contract explicit as the system grows.

## Architecture Decisions

### Server component root page

`app/page.tsx` remains a server component and delegates interactive state to the dashboard client component. This keeps the App Router boundary clean.

### Client dashboard container

`ExpenseDashboard` owns client-side state for expenses, filters, sorting, loading, and refresh behavior. This keeps interaction logic centralized.

### Paise instead of floats

Money is stored as integer paise so arithmetic stays deterministic. This avoids rounding drift and floating-point bugs in totals, sorting, and future reporting logic.

### Deterministic idempotency keys

Retry safety is built on deterministic keys generated from normalized business fields. This allows the backend to safely return the original record under repeated writes instead of creating duplicates.

### Backend-driven dashboard summaries

Dashboard summary cards and category totals come from a backend aggregation endpoint instead of being derived entirely in the client. This keeps business logic close to the database and scales better as summary requirements grow.

### Sanitized Mongo responses

Mongo-specific internal fields such as `__v` and internal retry-only fields such as `idempotencyKey` are excluded from API responses. This keeps the contract cleaner and avoids leaking storage details into UI code.

### Stable refresh strategy

The dashboard avoids tearing down visible table content during refreshes. Existing results remain visible while background updates complete, which reduces layout shift and makes the UI feel more stable.

### AbortController usage

Expense list fetching uses `AbortController` so in-flight requests can be cancelled when filter or sort state changes, reducing stale-response issues.

## Tradeoffs Due to Time Constraints

The following were intentionally excluded to prioritize correctness and reliability:

- no authentication
- no pagination
- no rate limiting
- no caching layer
- no optimistic updates
- minimal styling focus

These were intentionally left out so the implementation could focus on retry-safe writes, deterministic money handling, API correctness, and backend reliability under unstable network conditions.

## How to Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from `.env.example` and set the required variable:

```bash
MONGODB_URI=
```

3. Start the development server:

```bash
npm run dev
```

## Environment Variables

The application requires the following environment variables:

| Variable    | Description               |
| ----------- | ------------------------- |
| MONGODB_URI | MongoDB connection string |

Environment variables are validated at startup to ensure required configuration exists before the application runs.

## Testing Strategy

Due to time constraints, automated tests were not included.

If extended further, the following flows would be prioritized:

- idempotent POST retry behavior
- duplicate-key race handling
- validation failures
- filtering and sorting correctness
- dashboard aggregation accuracy

## Future Improvements

- pagination
- authentication and user isolation
- multi-currency support
- recurring expenses
- analytics charts
- offline-first sync

## Conclusion

This project is intentionally narrow in scope and strong in correctness. It prioritizes retry-safe writes, safe financial data handling, and predictable backend behavior over feature breadth, which aligns more closely with real-world finance workflows than a demo-focused implementation.
