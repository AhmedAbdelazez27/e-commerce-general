# E-Commerce Store (Angular)

Retail storefront SPA (Angular 21): feature folders, lazy routes, JWT auth, HTTP interceptors, and .NET-style API envelopes (`Data`).

**UI stack (project setup):** Bootstrap 5, Font Awesome, ng-select theme, ngx-toastr. Custom SCSS is minimal (`src/styles/store.scss`) — no portal charity theme.

## Prerequisites

- Node.js 20+
- npm 10+
- .NET API (optional for local dev; catalog falls back to demo products when the API is unreachable)

## Setup

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server with **develop** config → `http://localhost:58104` API |
| `npm run start:stage` | Stage API URL |
| `npm run build:develop` | Development build |
| `npm run build:production` | Production build |
| `npm test` | Unit tests (Vitest) |

## Environment matrix

| Configuration | File | `apiBaseUrl` |
|---------------|------|----------------|
| `develop` (default serve) | `environment.development.ts` | `http://localhost:58104` |
| `stage` | `environment.stage.ts` | Set your stage API |
| `production` | `environment.production.ts` | Set your production API |

Update `src/app/core/constants/api-endpoints.ts` when your .NET controllers expose different paths.

## Project structure

```
src/app/
  core/           guards, interceptors, cart state, API helpers
  layout/         store shell + nav
  features/       auth, home, catalog, cart, checkout, account
src/styles/
  index.style.scss   entry (imports en + ar)
  en.style.scss      LTR / English theme
  ar.style.scss      RTL / Arabic theme
```

**Global styles** (see `angular.json`): Bootstrap CSS/JS, Font Awesome, ng-select default theme, toastr. App SCSS loads via `src/styles.scss` → `index.style.scss`.

## Public vs protected routes

- **Public:** `/home`, `/shop`, `/shop/:id`, `/cart`
- **Login required:** `/checkout`, `/account/*`

## Backend contract (expected)

- Auth: `POST /Customers/Login`, `POST /Customers/Logout`
- Catalog: `GET /Products/GetList`, `GET /Products/GetById`
- Cart: `GET /Cart/Get`, `POST /Cart/AddItem`, etc.
- Orders: `POST /Orders/PlaceOrder`, `GET /Orders/GetMyOrders`

Responses should use the same envelope shape as the Fujairah portal (`Data` property).

## Reference project

The original charity portal remains at `F:\git repos\CO.FujairahSystem.Portal` and is not modified by this repo.
