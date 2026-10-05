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
- Backend: **starting from zero**.
- macOS, Node >= 22, comfortable with Git.

## Language rules
- **Everything in the repo is in English**: code, comments, docs, commit messages, seed field names, branch names.
- Chat discussion with Claude is in **Vietnamese**; technical terms stay in English.
- User-facing store content (product names, UI labels for Vietnamese stores) may be Vietnamese — that is data/branding, not code.

## How Claude teaches (important)
- Learning happens in claude.ai chat, **not Claude Code**. The learner types and runs every command and writes the code.
- Every step comes with the command/code **and the reason behind it**. Explain "why" before "how".
- Small steps. Wait for the learner to paste output or errors before moving on. Never dump a whole lesson at once.
- Relate new concepts to frontend knowledge the learner already has (e.g. Nest middleware vs Next middleware, DTOs vs props types).
- Each lesson has a **"Done when"** criterion. Commit to Git once it passes, then move to the next lesson.
- Progress from basics to advanced. Security and performance mostly live in Tier 3; mention briefly if they come up earlier.
- Be concise and practical.
- Do not add features beyond the current scope. Propose them and wait for approval.

## Tech stack
| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces (add Turborepo once `apps/web` exists) |
| Backend | NestJS 12 + TypeScript, **ESM** (`"type": "module"`) |
| Database | MongoDB Atlas M0 (free) + Mongoose |
| Validation | Zod (`packages/shared`) + `nestjs-zod` |
| API docs | `@nestjs/swagger` |
| Logging | pino |
| Testing | Vitest + supertest + mongodb-memory-server |
| Lint / format | oxlint + Prettier (Nest CLI defaults) |
| Notifications | Telegram Bot API (one shared bot, one `chatId` per store). Zalo later |
| Frontend (later) | Next.js App Router, Zustand cart, SSG/ISR catalog |
| Deploy | API: Render free · Web: Vercel/Netlify/Cloudflare · DB: Atlas M0 |

Render free tier note: the service sleeps after 15 minutes without traffic and cold-starts in 30–60s. The web app calls `/health` when the customer enters checkout to wake the API early.

## Repository structure
```
kld-commerce-kit/
├─ apps/
│  ├─ api/              # NestJS — deployed once, shared by all stores
│  └─ web/              # Next.js storefront template (later)
│     └─ brand/         # the ONLY folder a store branch may modify
├─ packages/
│  └─ shared/           # Zod schemas + types shared by api and web
└─ seed/
   └─ stores/<slug>.json
```

## Branch strategy
- `main`: all logic, the API, and the storefront template.
- `store/<slug>` (e.g. `store/chu-bay`): only changes `apps/web/brand/` (`brand.config.ts`, `theme.css`, `assets/`).
- Bug fixes and features go to `main` first, then `main` is merged into each `store/*` branch.

## Data model (MongoDB)
- **stores**: `slug`, `name`, `active`, plus grouped sub-documents (all optional unless noted):
  - `contact`: `phone` (required), `address?`, `mapUrl?`, `mapQrImage?`
  - `branding`: `logo?`
  - `payment`: `qrImage?`
  - `notifications`: `telegramChatId?`
  - New store settings go into the matching group (or a new group) as optional fields.
- **categories**: `storeId`, `name`, `slug`, `sortOrder`
- **products**: `storeId`, `categoryId`, `name`, `slug`, `price`, `image`, `description?`, `isAvailable`, `sortOrder`
- **order_requests**: `storeId`, `code`, `phone`, `name?`, `fulfillment` (`'dine_in' | 'takeaway'`), `table?`, `note?`, `items[{ productId, name, price, qty }]`, `total`, `idempotencyKey` (unique index), `notified`, `createdAt`

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

**Checkout v1:**
- Required: phone number.
- Optional: name, dine-in or takeaway, table number, note.
- The store calls back to confirm or request a deposit.
- Payment: show the store's static QR image.

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
- [ ] Lesson 15: Production — build, deploy to Render, production env, health checks, GitHub Actions CI.

### Phase 1B — Frontend
Next.js storefront consuming the deployed API, add Turborepo, `brand/` folder, create `store/chu-bay`, go live for the store.

### Phase 2
Second store (to prove the kit is reusable) → Admin (JWT, product CRUD, order list, image upload) → Telegram confirm button, Zalo, QR with embedded amount.

### Phase 3
Full `orders` collection with status, variants, inventory, shipping, online payment, customer accounts.

## Progress
- **Current lesson:** Lesson 12 (Tier 2 complete)
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
  - Order request: client sends only `productId` + `qty` (no prices); phone normalized then validated as a VN number; all inputs bounded (max items, qty, note length); `idempotencyKey` is a client-generated UUID.
