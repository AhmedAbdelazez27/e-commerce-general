# E-Commerce Store

Angular 21 storefront for a retail shop. The app talks to an external **.NET API** (JWT + `Data` envelope). UI uses **Bootstrap 5** and bilingual **AR/EN** (ngx-translate + split SCSS themes).

This repo was bootstrapped from the Fujairah portal patterns (interceptors, guards, feature folders) but **does not** include charity-portal pages or branding.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Angular 21 (standalone components, lazy routes) |
| UI | Bootstrap 5, Font Awesome, ngx-toastr |
| Dropdowns (ready to use) | `@ng-select/ng-select` |
| i18n | `@ngx-translate/core` — `src/app/i18n/en.json`, `ar.json` |
| Tests | Vitest (`ng test`) |
| API | External .NET REST (not in this repository) |

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+ (project pins `npm@10.8.2` in `packageManager`)
- **.NET API** for full flows (optional locally: catalog uses **demo products** if the API is down)

---

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

Default dev API base URL: `http://localhost:58104` (see [Environments](#environments)).

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | `ng serve --configuration develop` |
| `npm run start:stage` | Serve with stage environment |
| `npm run start:prod` | Serve with production environment |
| `npm run build:develop` | Dev build → `dist/CO.Ecommerce.Store` |
| `npm run build:stage` | Stage build |
| `npm run build` / `npm run build:production` | Production build |
| `npm run watch` | Watch build (develop) |
| `npm test` | Unit tests |

---

## Environments

Angular project name: **`CO.Ecommerce.Store`**.

| CLI configuration | Replaces `environment.ts` with | `apiBaseUrl` (current) |
|-------------------|--------------------------------|-------------------------|
| **develop** (default for `npm start`) | `environment.development.ts` | `http://localhost:58104` |
| **stage** | `environment.stage.ts` | `https://api.example.com` — update before use |
| **production** | `environment.production.ts` | `https://api.example.com` — update before use |

Shared shape: [`src/environments/environment.model.ts`](src/environments/environment.model.ts) (`apiBaseUrl`, `appName`, `defaultLang`, `production`, `name`).

Injected in app via `APP_ENVIRONMENT` token ([`src/app/core/tokens/app-environment.token.ts`](src/app/core/tokens/app-environment.token.ts)).

---

## Project structure

```
src/
  main.ts
  styles.scss                 → @use styles/index.style
  styles/
    index.style.scss          imports en + ar themes
    en.style.scss             LTR / English overrides
    ar.style.scss             RTL / Arabic overrides
  environments/
  app/
    app.config.ts             HTTP interceptors, i18n, toastr
    app.routes.ts
    core/
      constants/api-endpoints.ts
      guards/                 auth, guest
      interceptors/           loading, api base URL, auth, errors
      services/               auth token, cart, language, loader, profile
      utils/                  api-envelope
      storefront-config/      theme colors from JSON
      components/global-loader/
    layout/app-shell/         simple nav + router-outlet
    features/
      auth/                   login, register (placeholder)
      home/
      catalog/                /shop, /shop/:id
      cart/
      checkout/               auth required
      account/                orders (auth required)
    i18n/                     en.json, ar.json, bundled loader
public/
  config/storefront.config.json   theme colors
```

### Feature convention

Each feature typically has:

- `*.routes.ts` — lazy routes  
- `pages/` — standalone page components  
- `services/*-api.service.ts` — HTTP calls  
- `models/*.model.ts` — DTOs (PascalCase fields matching .NET)

---

## Routes

| Path | Access | Feature |
|------|--------|---------|
| `/auth/login` | Guest only | Login |
| `/auth/register` | Guest only | Register (placeholder) |
| `/login` | Redirect | → `/auth/login` |
| `/home` | Public | Home |
| `/brands` | Public | Brand directory |
| `/brands/:slug` | Public | Brand detail (title only) |
| `/shop` | Public | Product list |
| `/shop/:id` | Public | Product detail |
| `/cart` | Public | Cart (guest cart in `localStorage`) |
| `/checkout` | **Login required** | Checkout |
| `/account/orders` | **Login required** | Order history |

Shell layout wraps all routes except `/auth/*`.

---

## Global styles

Loaded in [`angular.json`](angular.json):

- Bootstrap CSS + bundle JS  
- Font Awesome  
- ngx-toastr  
- ng-select default theme  

App SCSS entry: `src/styles.scss` → `src/styles/index.style.scss` → **`en.style.scss`** + **`ar.style.scss`**.

`LanguageService` sets `lang`, `dir`, and `theme-en` / `theme-ar` on `<html>` for RTL/LTR.

---

## Backend API (expected)

Central catalog: [`src/app/core/constants/api-endpoints.ts`](src/app/core/constants/api-endpoints.ts).

| Area | Endpoints (relative to `apiBaseUrl`) |
|------|--------------------------------------|
| Auth | `POST /Customers/Login`, `Logout`, `Register` |
| Catalog | `GET /Products/GetList`, `GetById`, `GET /Categories/GetTree` |
| Cart | `GET /Cart/Get`, `POST /Cart/AddItem`, `UpdateItem`, `RemoveItem` |
| Checkout | `POST /Orders/PlaceOrder` |
| Account | `GET /Orders/GetMyOrders`, `GET /Customers/GetProfile` |

Responses should expose payload under **`Data`** (or `data`). Helpers: [`src/app/core/utils/api-envelope.util.ts`](src/app/core/utils/api-envelope.util.ts).

After login, default redirect: `/account/orders` (`ApiEndpoints.postLoginUrl`).

---

## Local development notes

- **Catalog:** If the API is unreachable, [`CatalogApiService`](src/app/features/catalog/services/catalog-api.service.ts) returns a minimal **demo product list** (for future shop UI; pages currently show titles only).
- **Cart:** Logged-in users use the API; guests persist cart items in **`localStorage`** (`guest_cart` key) via [`CartService`](src/app/core/services/cart.service.ts).
- **Register:** UI only; wire to `POST /Customers/Register` when the backend is ready.

---

## Related repository

Charity benefactors portal (reference only, not modified by this project):

`F:\git repos\CO.FujairahSystem.Portal`

Use it as a reference for .NET envelope and interceptor patterns, not for store UI or routes.

---

## Theme colors (config)

Only **colors and related CSS tokens** are loaded from config — no dynamic navigation, home sections, or catalog UI.

File: [`public/config/storefront.config.json`](public/config/storefront.config.json)

On startup, [`StorefrontConfigService`](src/app/core/storefront-config/storefront-config.service.ts) loads this file, merges `theme` with [`default-storefront-config.ts`](src/app/core/storefront-config/default-storefront-config.ts), and sets CSS variables on `:root` (`--store-primary`, `--store-secondary`, `--store-accent`, `--store-success`, `--store-danger`, `--store-warning`, `--store-background`, `--store-font-family`, `--store-radius`). Bootstrap primary/secondary/success/danger/warning are aligned with the same values. Overrides live in [`src/styles/en.style.scss`](src/styles/en.style.scss).

Example:

```json
{
  "theme": {
    "primaryColor": "#121212",
    "secondaryColor": "#666666",
    "accentColor": "#c41e3a",
    "successColor": "#198754",
    "dangerColor": "#dc3545",
    "warningColor": "#ffc107",
    "backgroundColor": "#ffffff",
    "fontFamily": "Manrope, system-ui, sans-serif",
    "borderRadius": "4px"
  }
}
```

After editing JSON, refresh the browser. No rebuild is required unless you change TypeScript defaults.

### Page titles (current UI)

Each route shows a single `h1` from `PAGE.*` keys in i18n.

| Route | Page title key |
|-------|----------------|
| `/home` | `PAGE.HOME` |
| `/shop` | `PAGE.SHOP` |
| `/shop/:id` | `PAGE.PRODUCT_DETAIL` |
| `/cart` | `PAGE.CART` |
| `/checkout` | `PAGE.CHECKOUT` |
| `/account/orders` | `PAGE.ORDERS` |
| `/brands` | `PAGE.BRANDS` |
| `/brands/:slug` | `PAGE.BRAND_DETAIL` |
| `/auth/login` | `PAGE.LOGIN` |
| `/auth/register` | `PAGE.REGISTER` |

---

## License / ownership

Private project (`package.json`: `"private": true`). Update `apiBaseUrl` and endpoint paths before deploying to stage or production.
