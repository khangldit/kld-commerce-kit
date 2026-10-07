# CLAUDE.md — kld-commerce-kit

## Project
**kld-commerce-kit**: a reusable e-commerce kit for small stores.
Flow: product listing by category → cart → place order → save to DB + push to Telegram → the store owner calls the customer to confirm.

- First store: **Quán Ăn Chú Bảy** (a Vietnamese grill-and-beer eatery, ~16 categories, ~80 items; combos are treated as regular items).
- Goals:
  1. Learn fullstack Node/NestJS + MongoDB from scratch.
  2. Ship a product the store actually uses.
  3. Build a portfolio project for the CV.

## Learner
- Frontend developer: Next.js, React, HTML/CSS, SEO. Handles all UI work.
- Backend: **starting from zero**. Has deployed .NET apps on Windows Server before (publish folder + Windows Service/IIS); first time deploying a Node API to a PaaS.
- macOS, Node >= 22, comfortable with Git.

## Language rules
- **Everything in the repo is in English**: code, comments, docs, commit messages, seed field names, branch names.
- Chat discussion with Claude is in **Vietnamese**; technical terms stay in English.
- User-facing store content (product names, UI labels for Vietnamese stores) may be Vietnamese — that is data/branding, not code.

## How Claude teaches (important)
- Learning happens in claude.ai chat, **not Claude Code**. The learner types and runs every command and writes the code.
- Every step comes with the command/code **and the reason behind it**. Explain "why" before "how".
- Small steps. Wait for the learner to paste output or errors before moving on. Never dump a whole lesson at once.
- Relate new concepts to frontend knowledge the learner already has (e.g. Nest middleware vs Next middleware, DTOs vs props types). For deployment, relate to the learner's .NET / Windows Server experience.
- Each lesson has a **"Done when"** criterion. Commit to Git once it passes, then move to the next lesson.
- Progress from basics to advanced. Security and performance mostly live in Tier 3; mention briefly if they come up earlier.
- Be concise and practical.
- Do not add features beyond the current scope. Propose them and wait for approval.

## Tech stack
| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | NestJS 12 + TypeScript, **ESM** (`"type": "module"`) |
| Database | MongoDB Atlas M0 (free) + Mongoose |
| Validation | Zod (`packages/shared`) + `nestjs-zod` |
| API docs | `@nestjs/swagger` |
| Logging | pino |
| Testing | Vitest + supertest + mongodb-memory-server |
| Lint / format | oxlint + Prettier (Nest CLI defaults) |
| Notifications | Telegram Bot API (one shared bot, one `chatId` per store). Zalo later |
| Frontend | Next.js 16 App Router (`cacheComponents`), Zustand cart, Tailwind |
| Deploy (all free) | API: Render free (Singapore) · Storefronts + landing: Cloudflare Pages (Next.js static export) · DB: Atlas M0 |

Render free tier note: the service sleeps after 15 minutes without traffic and cold-starts in 30–60s. **No keep-alive pinging** (Render staff treat it as abuse of the free tier). Instead the storefront warms up `/health` on home load and again when the cart/order page opens, and order submission uses a 60s timeout with a "connecting to the store…" state and retry with the same `idempotencyKey`.

## Repository structure
```
kld-commerce-kit/
├─ apps/
│  ├─ api/              # NestJS — deployed once, shared by all stores
│  ├─ web/              # Chú Bảy storefront (renamed to store-chu-bay / store-template when store #2 arrives)
│  │  └─ brands/<slug>/ # per-store branding (config, theme, assets)
│  ├─ store-<slug>/     # (later) custom-UI storefronts, one app per store
│  └─ landing/          # (later) Cà Chua Studio landing page
├─ packages/
│  ├─ shared/           # Zod schemas + types shared by api and web (framework-agnostic)
│  └─ storefront/       # (later) headless storefront logic: api client, cart, hooks (React, no UI)
└─ seed/
   └─ stores/<slug>.json
```

## Branch & multi-store strategy
- **Headless storefronts:** most stores get their OWN UI. Shared logic is extracted into `packages/storefront` (React-only, no UI): API client (timeout/retry/idempotency), cart store, hooks (`useCart`, `useCheckout`, `useWarmup`, `useTableMode`, `useMenuFilter`), utils (accent-insensitive search, note composition, JSON-LD). Each custom UI = its own app `apps/store-<slug>` importing those hooks. Stores that accept an existing UI share `apps/store-template` with `STORE_SLUG` + `brands/<slug>/` theming (rules below).
- Timing: Chú Bảy ships from `apps/web` now; keep logic (`src/lib`, `src/hooks`, `src/stores`) separate from UI components. Extract `packages/storefront` and rename apps when the second store arrives (rule: share code only once a second consumer exists).
- Pricing implication: template UI (theme only) = cheap/Basic; custom UI = priced separately.
- Single branch `main`. No per-store branches, no forks.
- The template storefront picks its store through one function, `getStoreSlug()` (reads `STORE_SLUG` env now; can switch to hostname-based multi-tenancy later without touching other code).
- Per-store branding lives in `brands/<slug>/` (config, theme CSS variables, logo, images, optional component overrides). Store data lives in `seed/stores/<slug>.json`.
- Store-specific features are toggled by store config in the DB, never by forking code.
- Adding a template-UI store: seed JSON → `pnpm seed <slug>` → `brands/<slug>/` → new Cloudflare Pages project with `STORE_SLUG` + domain → add domain to `CORS_ORIGINS`. No code changes.

## Service packages & build modes
| Package | Runs on | Ordering | Build |
|---|---|---|---|
| Basic (one-time, handed over) | Customer's own hosting account, static site, no backend | Cart → message sent via Zalo / phone call | `ORDER_MODE=messenger`, static export, menu baked from JSON |
| Care (yearly) | Our platform (shared API, Telegram, stored orders) | `POST /orders` | `ORDER_MODE=api` |
| Pro (admin, inventory) | Our platform | Same as Care + admin features | `ORDER_MODE=api` |
- Basic: we store no data and run nothing after handover; the customer owns domain + hosting and registers the site with Bộ Công Thương.
- Care/Pro: we operate the platform and hold customers' personal data — needs a proper contract/terms (legal review before the first paying customer). Domains always registered in the customer's name.
- Quán Ăn Chú Bảy = Care package (`ORDER_MODE=api`).
- Hosting (decided: all free for now): see **Deployment**. Upgrade the API to a paid Render instance once a Care customer pays. Vercel Hobby is NOT used (non-commercial only — and a landing page advertising paid services also counts as commercial).

## Repository plan
- Now: one private monorepo (`apps/api`, `apps/web`, `packages/shared`; `apps/landing`, `packages/storefront` later).
- Later (trigger: second customer, or API contract stable for a few weeks): freeze API as `v1`, publish `@kld/shared`, split into a public platform repo (API, landing, shared) and a private clients repo (storefronts + customer brands).

## Deployment (all free for now)

### API → Render (Web Service, runtime Node, region Singapore)
- Root directory: repo root (pnpm workspace needs the root lockfile).
- Build command: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm install --frozen-lockfile && corepack pnpm --filter @kld/shared build && corepack pnpm --filter @kld/api build`
  - Not `corepack enable`: it writes shims into `/usr/bin`, which is read-only on Render (`EROFS`). `corepack pnpm …` runs the pinned pnpm version without installing shims.
- Start command: `cd apps/api && NODE_ENV=production node dist/main.js`
  - `NODE_ENV` is set at **runtime only**. If it were a Render env var it would also apply to the build, pnpm would skip devDependencies, and `nest build` (`@nestjs/cli`, `typescript`) would fail.
- Env vars: `NODE_VERSION=24`, `MONGODB_URI`, `TELEGRAM_BOT_TOKEN`, `CORS_ORIGINS`, `ENABLE_SWAGGER=false`. `PORT` is injected by Render. Recommended: a separate production database (e.g. `kld-commerce-prod`), seeded once from the local machine.
- Health check path: `/health`. Build filters: `apps/api/**`, `packages/shared/**`, `pnpm-lock.yaml`.
- Auto-deploy on push to `main`; rollback from the dashboard.
- Before real customers (Lesson 12 essentials): CORS whitelist, rate limit on `POST /orders` (with `trust proxy` — requests arrive through Render's proxy), helmet, body size limit, Swagger off.

### Storefronts / landing → Cloudflare Pages
- Next.js static export (`output: 'export'`, `images.unoptimized`; no ISR, middleware or route handlers). URL: `<project>.pages.dev`, custom domains attachable per project.
- One Pages project per app/store. Build watch paths per project (`apps/<app>/**`, `packages/**`) so unrelated pushes don't burn the free build quota (500 builds/month, 1 concurrent build).
- The build wakes the API (`/health` with retries) before fetching store + catalog.
- Menu updates: re-seed production → trigger the project's Cloudflare deploy hook.
- Every `*.pages.dev` / custom domain must be in the API's `CORS_ORIGINS`.
- To verify at deploy time: static-export compatibility of `cacheComponents` + `'use cache'` (revalidation has no effect in a static export).

### Deploy steps
- D1: run the production build locally (`node dist/main.js` with `NODE_ENV=production`) — like publishing and test-running before copying to a server.
- D2: push to GitHub, create the Render Web Service.
- D3: env vars, first deploy, read the logs.
- D4: verify through the real URL (`/health`, catalog, a test order + Telegram).
- D5: Lesson 12 essentials, push → automatic redeploy (CD).
- Then: storefront → Cloudflare Pages, end-to-end order test, table QR codes.

## Data model (MongoDB)
- **stores**: `slug`, `name`, `active`, plus grouped sub-documents (all optional unless noted):
  - `contact`: `phone` (required), `address?`, `mapUrl?`, `mapQrImage?`, `openingHours?` (display text), `zalo?`, `facebook?`
  - `branding`: `logo?`, `tagline?`, `coverImage?`
  - `payment`: `qrImage?`
  - `notifications`: `telegramChatId?`
  - New store settings go into the matching group (or a new group) as optional fields.
- **categories**: `storeId`, `name`, `slug`, `sortOrder`
- **products**: `storeId`, `categoryId`, `name`, `slug`, `price` (lowest price; 0 for market price), `priceMax?` (price range), `isMarketPrice` ("Thời giá"), `image`, `description?`, `isAvailable`, `isFeatured`, `sortOrder`
- **order_requests**: `storeId`, `code`, `phone`, `name?`, `fulfillment` (`'dine_in' | 'delivery'`), `scheduledAt?`, `partySize?`, `address?` (delivery only), `note?`, `items[{ productId, name, price, qty }]`, `total`, `idempotencyKey` (unique index), `notified`, `createdAt`

### Conventions
- Money is stored as integer VND. Never floats.
- Order `items` snapshot `name` and `price` at order time.
- `order_requests` only receives and stores orders — **no status field**. A full order system (status, shipping, admin) will use a new `orders` collection later.
- The menu is authored in a seed JSON file. The seed script upserts it into Mongo and is safe to run repeatedly.
- Product images are static assets on the web side; the JSON stores file names only.

## API v1
| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Health check + warm-up |
| GET | `/stores/:slug` | Store info |
| GET | `/stores/:slug/catalog` | Categories + products |
| POST | `/stores/:slug/orders` | Create an order request |

**Order creation flow:**
1. Validate the request with Zod.
2. Look up prices in the DB; the server computes `total` and never trusts client prices.
3. Generate an order `code`.
4. Insert into `order_requests`.
5. Push a Telegram notification.
6. On success, set `notified = true`.

If Telegram fails, the order is still saved and the customer still gets a success response.

**Order request contract (Phase 1B version):** discriminated union on `fulfillment`:
- `dine_in`: `scheduledAt?` (ISO with offset; absent = now, i.e. already at the table), `partySize?` (required when `scheduledAt` is set = reservation), `phone?` (optional only when there is no `scheduledAt`; required for reservations).
- `delivery` ("Đặt giao tại nhà"): `address` (required), `scheduledAt?` (delivery time; absent = as soon as possible). Delivery fee is confirmed by phone, not computed.
- Server checks `scheduledAt` is in the future and within ~30 days (Asia/Ho_Chi_Minh). Opening hours are display-only (not enforced) in v1.
- No `table` field. Table context travels inside `note` (see below).

**Checkout v1:**
- Required: phone number — except table mode (dine-in "now" from a table QR), where only the note is shown. Optional: name, note.
- Dine-in: "Now" or pick date/time + party size. Delivery: "As soon as possible" or pick date/time; address required.
- Success view: order code, server total, "the store will call to confirm and explain any deposit".
- Payment is NOT part of the checkout flow. The store's payment QR (bank info) lives in the store info area (footer / "Payment info" popup).
- Submission: 60s timeout (covers an API cold start), button disabled while pending, "connecting to the store…" message after ~3s, retry reuses the same `idempotencyKey` (a timed-out request may still have been saved — the retry returns that order instead of duplicating it).

**Table QR (frontend-only feature):**
- Table QR codes link to the storefront with a short param, e.g. `?t=Ban-02-Sanh-01`.
- When `t` is present → table mode: fulfillment locked to dine-in "now", delivery / date-time / party-size UI hidden, label shown as a read-only chip; small "Not at the table?" link exits table mode.
- Table mode comes from the URL only (no browser storage): every internal link carries `t` along; opening the site without `t` = remote order. Label sanitized and capped (~60 chars). "Not at the table?" removes `t` from the URL.
- Frontend composes the note: `[<label>] <customer note>` (no "Note:" prefix — Telegram already shows 📝). Customer note max length = 500 − prefix length.

## Out of scope (for now)
Admin, auth, variants/options, inventory, shipping, online payment, customer accounts, Zalo, QR with embedded amount, order status.

## Roadmap

### Phase 1A — Backend
**Tier 1: Fundamentals**
- [x] Lesson 1: Environment (Node, pnpm), init repo + pnpm workspace, scaffold `apps/api` with Nest CLI. *Done when: the API dev server runs.*
- [x] Lesson 2: NestJS anatomy (module/controller/service, DI, request lifecycle), build `/health`. *Done when: `/health` returns OK and the three layers can be explained.*
- [x] Lesson 3: Config + env (`@nestjs/config`, Zod env validation, `.env.example`). *Done when: a missing env var fails the app at startup.*
- [x] Lesson 4: MongoDB Atlas + Mongoose, schemas for stores/categories/products, indexes. *Done when: the app connects to Atlas.*
- [x] Lesson 5: Seed script from `seed/stores/chu-bay.json`. *Done when: running it twice creates no duplicates.*
- [x] Lesson 6: Catalog API (`GET /stores/:slug`, `GET /stores/:slug/catalog`). *Done when: a `.http` file returns the correct menu.*
- [x] Lesson 7: Swagger. *Done when: endpoints can be called from `/docs`.*

**Tier 2: Business logic**
- [x] Lesson 8: `packages/shared` + Zod + `nestjs-zod`. *Done when: an invalid body returns a clear 400.*
- [x] Lesson 9: Order creation (server-side pricing, code generation, save to `order_requests`, idempotency). *Done when: total is correct even if the client sends wrong prices.*
- [x] Lesson 10: Telegram notifier (`Notifier` interface). *Done when: the group receives a message; orders still save if Telegram fails.*
- [x] Lesson 11: Exception filter, consistent response format, pino logging.

**Tier 3: Advanced**
- [ ] Lesson 12: Security — helmet, CORS whitelist, rate limiting, body size limit, NoSQL injection prevention, escaping Telegram content, hiding stack traces, secret management.
- [ ] Lesson 13: Performance — indexes + `explain()`, `lean()`/projection, catalog caching, compression, connection pooling, cold starts.
- [ ] Lesson 14: Testing — unit tests (pricing, code generation) + e2e tests (supertest + mongodb-memory-server).
- [ ] Lesson 15: Production — build, deploy to Render, production env, health checks, GitHub Actions CI. (In progress — see **Deployment**.)

### Delivery order (decided: ship first, get customers, then iterate)
1. Phase 1B — storefront for Chú Bảy (`apps/web`, `ORDER_MODE=api`, `brands/chu-bay`), add Turborepo. ✅
2. Lesson 12 essentials + Lesson 15 (deploy) — required before real customers. ← current
3. Go live for Chú Bảy.
4. Lessons 13 (performance) + 14 (testing).
5. `ORDER_MODE=messenger` static build for the Basic package.
6. `apps/landing` — packages, portfolio, live demos (Cloudflare Pages).
7. Second store → extract `packages/storefront`, rename storefront apps.
8. API `v1`, publish `@kld/shared`, split repos.

### Phase 1B — Frontend
Two routes: `/` (store hero ~20–30% + menu) and `/order` (order form + success view).
- Header: logo + store name + cart button. Footer: store info (address, map, hours, contacts, payment info) + platform credit "Website by Cà Chua Studio 🍅 · Liên hệ làm web" linking to the studio's Zalo contact.
- Platform credit lives in ONE place (`apps/web/src/config/platform.ts`), not in `brands/<slug>/` — it is the same for every store. Credit link: `target="_blank" rel="noopener nofollow"`.
- Menu: sticky category tab row that FILTERS the grid client-side: `[⭐ Featured] [All] [<categories>...]`.
  - Default tab = Featured (products with `isFeatured`); hidden when the store has none → default All.
  - "All" shows every category as a section with a full-width section title (category name + item count), in category `sortOrder`.
  - Search ignores the active tab and searches the whole menu (accent-insensitive).
  - Selected tab in the URL (`?c=<slug>`), read on the client via `useSearchParams` inside `<Suspense>` (never `searchParams` in `page.tsx`, to keep SSG). All items are server-rendered; filtering only hides/shows.
  - Naming: "Featured / Món nổi bật", not "Best seller" (no sales data yet; a data-driven best-seller tab can come later from `order_requests`).
- Product card (horizontal): fixed square image on the left (brand placeholder when no image, so the grid stays aligned); right side: name (2-line clamp), optional 1-line description, bottom row with price (left) and "Add" button (right) that turns into a `[- n +]` stepper.
- Grid columns: <640px 1 col · 640–1023px 2 cols · ≥1024px 2 cols + right panel · ≥1440px 3 cols + right panel.
- Backend addition for 1B.1: `products.isFeatured` (boolean, default false).
- Selected-items panel: sticky right column on ≥1024px; on mobile a bottom bar that opens the same panel as a bottom sheet. CTA "Order" → `/order`.
- Styling: Tailwind, brand colors via CSS variables from `brands/<slug>/theme.css`.
- Server Components by default; client components only for interactive islands (cart, steppers, tabs, search, form).
- Catalog fetched at build time (static export on Cloudflare Pages) — menu changes need a rebuild via deploy hook. Cart (Zustand + `localStorage`, keyed by store) keeps name/price snapshots for display; server total is authoritative.
- `idempotencyKey` created when checkout starts, kept until success; errors handled by `code` (`PRODUCTS_UNAVAILABLE`, `VALIDATION_FAILED`).
- Warm up `/health` (fire-and-forget, errors ignored) on home load and when the cart/order page opens. SEO: metadata from store + JSON-LD `Restaurant`/`Menu`.
- Step 1B.1 is a backend update: new store fields + new order contract.

### Phase 2
Second store (proves the kit is reusable; triggers `packages/storefront` extraction) → Admin (JWT, product CRUD, order list, `notified: false` view, image upload) → Telegram confirm button, Zalo, QR with embedded amount.

### Phase 3
Full `orders` collection with status, variants, inventory, shipping, online payment, customer accounts.

## Progress
- **Current step:** Deployment — API to Render, step **D1** (run the production build locally). Then Lesson 12 essentials, then the storefront to Cloudflare Pages.
- **Decisions log:**
  - Node 24 LTS (`.nvmrc`, `engines`), pnpm pinned via Corepack (`packageManager`).
  - API scaffolded with Nest CLI: ESM + Vitest (instead of CJS + Jest), oxlint instead of ESLint.
  - Workspace packages use the `@kld/` scope (`@kld/api`, later `@kld/shared`, `@kld/web`).
  - Removed `@nestjs/mau` and the `deploy` script — deploying to Render, not Mau.
  - Declined `@nestjs/observe` — logging handled in-house with pino (Lesson 11).
  - ESM + CJS packages (e.g. mongoose): types via `import type`; values via named import, or default import if Node can't detect the named export.
  - Store fields grouped into `contact` / `branding` / `payment` / `notifications` sub-documents (`_id: false`) for extensibility.
  - Seed JSON references categories by slug; image fields store file names only.
  - `CoreModule` (config + DB connection) is shared by every entry point: `main.ts` (HTTP) and `seed.ts` (CLI).
  - Seed: Zod-validated before connecting; upsert by `{ storeId, slug }`; products bulk-written; products missing from the file are hidden (`isAvailable: false`), never deleted. Run with `pnpm seed <store-slug>`.
  - Public responses go through explicit mappers (`toPublicStore`, `toPublicProduct`) — allowlist, never return raw DB documents.
  - Swagger is behind `ENABLE_SWAGGER` (`z.stringbool()`, default off). Served at `/docs`.
  - `@kld/shared` is a compiled package (`tsc` → `dist`, `build` cleans `dist` first). Inside the package, import sibling files directly (`./stores.js`), never via `index.ts` or `@kld/shared` (circular imports). Only framework-agnostic code goes in shared.
  - Validation: global `nestjs-zod` pipe with `strictSchemaDeclaration: true` — every `@Body`/`@Param`/`@Query` must use a Zod DTO. Responses use `@ZodResponse` + `ZodSerializerInterceptor` (strips unknown keys, documents schema).
  - `order_requests` stores `storeId` (not slug — slugs can change). Append-only: `createdAt` only, no `updatedAt`.
  - Order code = `YYMMDD-NNN` per store per day (Asia/Ho_Chi_Minh date), from an atomic `$inc` on `counters` (`_id: order:<storeId>:<YYMMDD>`). Gaps in numbering are acceptable.
  - Order creation: idempotency check first, unique index as the real guarantee (catch E11000 → return existing order); duplicate lines merged; products must match `storeId` + `isAvailable`; unavailable products → 422 with `unavailableProductIds`; prices always from DB. Never log phone numbers.
  - Notifications: `OrderNotifier` abstract class is the DI token (interfaces don't exist at runtime); `TelegramOrderNotifier` via `useClass`. Plain `fetch` + `AbortSignal.timeout(5000)`, HTML parse mode with every user value escaped. `TELEGRAM_BOT_TOKEN` optional except in production (`.refine`). Telegram `chatId` stored as a string in `store.notifications`.
  - Notification is awaited after the order is saved, never throws (logged instead); `notified: true` only on delivery. Replayed/raced idempotent requests don't re-notify.
  - Every entry point (`main.ts`, `seed.ts`, test setup) imports `reflect-metadata` on its first line.
  - Logging: `nestjs-pino` in `CoreModule` (pretty in dev, JSON in prod), `bufferLogs` + `app.useLogger`. Request id from `x-request-id` (≤100 chars) or a UUID, echoed in the response header. Serializers allowlist `id/method/url/statusCode`; no bodies or headers logged; `/health` not auto-logged.
  - Errors: one format `{ statusCode, code, message, details?, requestId? }` (`apiErrorSchema` in shared; frontend switches on `code`). Throw `AppException(status, code, message, details?)` for business errors. `AllExceptionsFilter` (`APP_FILTER`) maps Zod/HTTP/unknown errors; 5xx return a generic message and are logged with stack; 4xx are not logged as errors.
  - Business brand: **Cà Chua Studio** (customer-facing name for the web service; `kld-commerce-kit` stays as the repo/project name). Temporary contact = owner's personal Zalo; to be replaced by a business number / Zalo OA later.
  - Table numbers are not modelled: table QR → `?t=<label>` → frontend table mode + `[label]` prefix in the note.
  - Order request: client sends only `productId` + `qty` (no prices); phone normalized then validated as a VN number; all inputs bounded (max items, qty, note length); `idempotencyKey` is a client-generated UUID.
  - Fulfillment `takeaway` replaced by `delivery` ("Đặt giao tại nhà", address required). Both dine-in and delivery can pick a date + time slot.
  - Storefront: Next.js 16 with `cacheComponents`; store + catalog fetched with `'use cache'` (5-minute revalidate), validated with the shared Zod schemas. Cart = Zustand persisted per store (`kld:cart:<slug>`), idempotency key in `sessionStorage`; table mode is URL-only (`?t=`).
  - Store info gained `contact.openingHours/zalo/facebook`, `branding.tagline/coverImage`, `payment.bankName/accountNumber/accountName`; products gained `isFeatured`.
  - API CORS whitelist via `CORS_ORIGINS` (comma-separated, default `http://localhost:3001`).
  - Real Chú Bảy menu (docs/menu1.html, menu2.html): 17 categories, 83 items. Combos are regular products in a "Combo" category; their description lists each dish + price, one per line.
  - Price ranges ("150–200K") → `price` = low, `priceMax` = high; "Thời giá"/"Theo phần" → `isMarketPrice: true`, `price: 0`. Order items snapshot both; the total is then a minimum ("Tạm tính (từ)") and the store quotes the final price by phone.
  - An item listed in two printed sections (e.g. grilled dishes under both "Món Bò" and "Món Nướng") lives in ONE category only — a product has a single `categoryId`.
  - Product cards with a description open a detail popup (photo, full description, price, add/stepper).
  - Table mode hides everything about calling back: no phone/name fields, no deposit/call-back notes, no "call the store" button on success; Telegram shows "Khách đang ngồi tại quán". `order_requests.phone` is therefore optional.
  - Featured products get a diagonal corner ribbon (text from `brands/<slug>/config.ts` `featuredBadge`; Chú Bảy = "HOT") everywhere except the Featured tab. The tab itself stays named "Món nổi bật".
  - Headless storefront architecture: shared logic → `packages/storefront` (extracted when store #2 arrives); custom UI per store in `apps/store-<slug>`; template UI + theming for stores that accept an existing design. Template vs custom UI priced differently.
  - Hosting is all free for now: API on Render free (no keep-alive pinging; warm-up from the storefront instead), storefronts + landing on Cloudflare Pages as static exports (commercial use allowed; one project per app; build watch paths), DB on Atlas M0. Vercel Hobby rejected (non-commercial terms).
  - Render start command sets `NODE_ENV=production` inline so the build still installs devDependencies.
