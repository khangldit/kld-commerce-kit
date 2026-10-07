# @kld/web — storefront

Next.js storefront shared by every store. Which store it serves is decided by `STORE_SLUG` (see `src/config/store.ts`).

## Run

```bash
cp apps/web/.env.example apps/web/.env.local   # once
pnpm dev            # from the repo root: shared (watch) + api + web
pnpm dev:web        # web only (needs the API running)
```

Web: http://localhost:3001 · API: https://kld-commerce-kit.onrender.com. `next build` prerenders the menu, so the API must be reachable at build time.

## Structure

| Path                     | What                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `src/app/`               | Routes: `/` (hero + menu) and `/order` (checkout + success view)                    |
| `src/components/`        | `menu/`, `cart/`, `order/`, `store/` (header, hero, footer, payment popup)          |
| `src/lib/api.ts`         | Server fetches with `'use cache'` (5-minute revalidate), validated by `@kld/shared` |
| `src/stores/`            | Zustand: `cart` (persisted per store) and `ui` (tab, search, sheet, table mode)     |
| `src/config/platform.ts` | Platform credit (same for every store)                                              |
| `brands/<slug>/`         | Per-store theme tokens (`theme.css`) and presentation config (`config.ts`)          |
| `public/brands/<slug>/`  | Store images: logo, QR, cover; product images in `products/`                        |

## Adding a store

1. `seed/stores/<slug>.json` → `pnpm seed <slug>`
2. `brands/<slug>/config.ts` + `theme.css`, register them in `brands/index.ts`
3. Images in `public/brands/<slug>/`
4. New hosting project with `STORE_SLUG=<slug>`; add its origin to the API's `CORS_ORIGINS`
