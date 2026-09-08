# Luviio frontend

Production React/Vite storefront for Luviio hardware ecommerce.

## Install

```bash
npm ci
```

## Run

```bash
npm run dev
```

## Verify

```bash
npm run lint
npm test
npm run build
```

## Environment

- `VITE_API_BASE`: public backend base URL, including `/api/v1`.
- `VITE_STRIPE_PK`: Stripe publishable key (`pk_test_` or `pk_live_`).
- `NEXT_PUBLIC_API_URL`: optional deployment API URL consumed by the Vite config.
- `STRIPE_PK`: optional public Stripe publishable key alias.

Never add Stripe secret keys, database credentials, or service-role keys to client environment variables.

## Architecture

- `src/api/client.js`: authenticated HTTP client, retries, refresh, and normalized `ApiError` handling.
- `src/services/`: API-specific service modules.
- `src/context/`: auth, cart, and toast state providers.
- `src/pages/`: route-level storefront, checkout, account, and admin screens.
- `src/components/`: reusable cards, forms, payment, and state components.
- `src/styles/`: design tokens and responsive layout styles.

Checkout supports Stripe card payments and COD when the backend exposes the corresponding order endpoint. Prices and totals always come from the backend response.
