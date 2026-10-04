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
- **order_requests**: `storeSlug`, `code`, `phone`, `name?`, `fulfillment` (`'dine_in' | 'takeaway'`), `table?`, `note?`, `items[{ productId, name, price, qty }]`, `total`, `idempotencyKey` (unique index), `notified`, `createdAt`

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
- [ ] Lesson 2: NestJS anatomy (module/controller/service, DI, request lifecycle), build `/health`. *Done when: `/health` returns OK and the three layers can be explained.*
- [ ] Lesson 3: Config + env (`@nestjs/config`, Zod env validation, `.env.example`). *Done when: a missing env var fails the app at startup.*
- [ ] Lesson 4: MongoDB Atlas + Mongoose, schemas for stores/categories/products, indexes. *Done when: the app connects to Atlas.*
- [ ] Lesson 5: Seed script from `seed/stores/chu-bay.json`. *Done when: running it twice creates no duplicates.*
- [ ] Lesson 6: Catalog API (`GET /stores/:slug`, `GET /stores/:slug/catalog`). *Done when: a `.http` file returns the correct menu.*
- [ ] Lesson 7: Swagger. *Done when: endpoints can be called from `/docs`.*

**Tier 2: Business logic**
- [ ] Lesson 8: `packages/shared` + Zod + `nestjs-zod`. *Done when: an invalid body returns a clear 400.*
- [ ] Lesson 9: Order creation (server-side pricing, code generation, save to `order_requests`, idempotency). *Done when: total is correct even if the client sends wrong prices.*
- [ ] Lesson 10: Telegram notifier (`Notifier` interface). *Done when: the group receives a message; orders still save if Telegram fails.*
- [ ] Lesson 11: Exception filter, consistent response format, pino logging.

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
- **Current lesson:** Lesson 2
- **Decisions log:**
  - Node 24 LTS (`.nvmrc`, `engines`), pnpm pinned via Corepack (`packageManager`).
  - API scaffolded with Nest CLI: ESM + Vitest (instead of CJS + Jest), oxlint instead of ESLint.
  - Workspace packages use the `@kld/` scope (`@kld/api`, later `@kld/shared`, `@kld/web`).
  - Removed `@nestjs/mau` and the `deploy` script — deploying to Render, not Mau.
  - Declined `@nestjs/observe` — logging handled in-house with pino (Lesson 11).
  - ESM + CJS packages (e.g. mongoose): types via `import type`; values via named import, or default import if Node can't detect the named export.
  - Store fields grouped into `contact` / `branding` / `payment` / `notifications` sub-documents (`_id: false`) for extensibility.
  - Seed JSON references categories by slug; image fields store file names only.
