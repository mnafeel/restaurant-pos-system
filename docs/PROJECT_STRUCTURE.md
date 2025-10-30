# Project Structure (Target, Non-Breaking)

This describes the clean, modular, folder-wise structure we will move towards. All existing logic stays intact; we add structure and migrate progressively without breaking working features.

```
restaurant-billing-system/
├─ client/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ routes/              # Route registration (thin)
│  │  │  ├─ providers/           # Context providers (Auth, Theme, Currency)
│  │  │  ├─ config/              # env, constants, base URLs
│  │  │  └─ store/               # lightweight global state (if needed)
│  │  ├─ features/
│  │  │  ├─ auth/                # login, me
│  │  │  ├─ shops/               # shop info (GET/PUT /api/shops/:id)
│  │  │  ├─ settings/            # toggles (POST /api/settings/bulk)
│  │  │  ├─ orders/
│  │  │  ├─ kitchen/
│  │  │  ├─ bills/
│  │  │  ├─ menu/
│  │  │  └─ reports/
│  │  ├─ shared/
│  │  │  ├─ api/                 # axios instance & interceptors
│  │  │  ├─ components/          # Button, Modal, Input, Table, Spinner
│  │  │  ├─ hooks/               # useEvent, useDebounce, useFetch
│  │  │  ├─ utils/               # formatCurrency, date, validators
│  │  │  └─ styles/              # global styles
│  │  ├─ App.js
│  │  └─ index.js
│  └─ ...
├─ server/
│  ├─ src/
│  │  ├─ config/                 # db, env
│  │  ├─ middleware/             # auth, errors, rate limits, cors
│  │  ├─ modules/
│  │  │  ├─ auth/    { routes, service, repo }
│  │  │  ├─ shops/   { routes, service, repo }
│  │  │  ├─ settings/{ routes, service, repo }
│  │  │  ├─ categories, menu, orders, bills, taxes
│  │  ├─ db/
│  │  │  ├─ migrations/          # safe SQL (sqlite/pg)
│  │  │  └─ init.js              # run migrations on start
│  │  ├─ app.js                  # express init
│  │  └─ index.js                # start server
│  └─ ...
└─ docs/                         # architecture, guides
```

## Principles

- Keep working code intact. Migrate file-by-file.
- Separate concerns: routes (HTTP), services (business), repo (SQL).
- Shops table holds identity (name/address/phone/email/currency).
- Settings holds feature flags (KDS, GST toggle, printer, etc.).
- Use a single axios instance (shared/api/axios.js) with absolute base URL.

## Migration Steps (Safe & Incremental)

1. Add shared/api/axios.js and start using it in new code. Gradually swap old imports.
2. Move Settings Shop Info UI into features/shops/pages, keep imports stable via temporary re-exports if needed.
3. Move toggles to features/settings/services; keep API unchanged.
4. Create server modules folders; move routes → services → repos one module at a time.
5. Add db/migrations and run on start. Include Postgres-safe `IF NOT EXISTS` guards.

## Naming & Coding Conventions

- Files: kebab-case for files, PascalCase for components, camelCase for functions.
- Exports: one component/function per file where practical.
- Services only call repos; they must be stateless and reusable.

## Non-Deletion Policy

No auto-deletions. When consolidating, mark old files as legacy and keep them until all references are replaced and verified in production.
