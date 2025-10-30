# Restaurant POS – Website Manual (Features, Design, and Workflows)

## 1) Overview
- Purpose: Fast, shop-isolated POS for restaurants with KDS, billing, GST, and reports.
- Tech: React (client), Node/Express (server), SQLite/PostgreSQL (DB).
- Scope: Web-only, strict per-shop data isolation, per-user theme.

## 2) Roles & Access
- owner: System-wide oversight; can see all shops.
- admin/manager/cashier/chef: Limited to their `shop_id` (strict isolation).

## 3) Shop Isolation (Strict)
- Applied to: categories, menu items, orders, kitchen, bills, tables, taxes, settings (via `shop_settings`).
- Server guarantees:
  - All GETs filter by `req.user.shop_id`.
  - All mutations (POST/PUT/DELETE) guard with `shop_id` checks.
  - Unique constraints scoped per shop where appropriate (e.g., `tables(shop_id, table_number)`).

## 4) Settings & Theme
- Shop info (name, address, phone, email, currency): saved in `shops` and surfaced via `shop_settings`.
- Feature toggles (e.g., `enable_kds`, `gst_enabled`) are per shop via `shop_settings`.
- Per-user theme: `user_settings` stores `theme_mode`. Client loads on login and saves instantly on change.

## 5) Taxes & GST
- `taxes` table is shop-scoped (`shop_id`).
- Item-wise GST supported: `menu_items.gst_applicable`, `menu_items.gst_rate`.
- Bill calculates GST with CGST/SGST split when GST is enabled.

## 6) Core Features
- Order Taking
  - Create dine-in/takeaway orders, choose items/variants, notes, quantities.
  - KDS integration: `kds_status` set appropriately; emits realtime events.
- Kitchen Display (KDS)
  - Shows only pending/non-served items for the user’s shop.
  - Realtime updates on order/item status.
- Billing
  - Generates bill for an order; supports discounts, service charge, taxes.
  - Strict shop checks for create/void/delete/fetch.
- Tables
  - Per-shop tables with status (Free/Occupied), merge/split.
  - Unique per shop: `(shop_id, table_number)`.
- Categories & Menu
  - Categories and items filtered by shop; safe delete for categories (reassigns items to Uncategorized).
  - Items include availability, stock, low-stock thresholds, variants, and GST fields.
- Reports
  - Admin/manager/cashier see only their shop data; owner may aggregate as designed.
- Users & Shops
  - Owner/admin can manage users; users are assigned `shop_id`.
  - Shop creation auto-initializes shop settings.

## 7) Design & UX
- Theme system with elegant gradients per route.
- Navbar updates instantly after shop info save via `shopUpdated` event.
- Toasts for success/failure; non-blocking bulk settings save fallback.

## 8) Performance
- In-memory caching on server (per-shop cache keys).
- Lean queries with `shop_id` filters and guarded mutations.
- Static assets kept clean (docs moved to `docs/` to keep bundles small).

## 9) API Summary (Key Endpoints)
- Auth
  - GET `/api/auth/me` → current user with `shop_id`.
- User Settings
  - GET `/api/users/me/settings` → per-user key/values (e.g., `theme_mode`).
  - PUT `/api/users/me/settings` → upsert settings.
- Shops & Settings
  - PUT `/api/shops/:shopId` → update shop info (admin/manager).
  - GET `/api/settings` → merged global + `shop_settings`.
  - POST `/api/settings/bulk` → save feature toggles (per shop when applicable).
- Tables
  - GET `/api/tables` (shop-scoped), PUT `/api/tables/:id/status`, DELETE `/api/tables/:id` (guarded).
- Categories & Menu
  - GET/POST/PUT/DELETE `/api/categories` (shop-scoped, safe delete).
  - GET/POST/PUT/DELETE `/api/menu` (shop-scoped, includes GST fields).
- Orders & Kitchen
  - POST `/api/orders`, GET `/api/orders`, GET `/api/orders/pending` (strict shop filter).
  - GET `/api/kitchen/orders` (strict shop filter).
- Billing
  - POST `/api/bills`, GET `/api/bills`, DELETE/VOID guarded by shop.
- Taxes
  - GET/POST/PUT/DELETE `/api/taxes` (shop-scoped).

## 10) Typical Workflows
- New Shop
  1) Owner creates shop.
  2) Admin configures shop info in Settings; navbar updates instantly.
  3) Add categories/menu items (with GST per item if needed).
  4) Define taxes (GST on/off per shop).
  5) Add tables (numbers unique within shop).
- Daily Ops
  1) Take orders; send to kitchen.
  2) Kitchen processes items; status updates flow back.
  3) Generate bills; apply discounts, service, taxes.
  4) Run reports.
- Theme
  1) User changes theme in UI.
  2) Theme persists in `user_settings` and applies immediately.

## 11) Troubleshooting
- “Failed to save settings” while shop info updates: bulk settings save is non-blocking; ensure `shop_settings` exists; retry.
- Missing columns (e.g., `gst_applicable`): restart server to trigger migrations; check DB for added columns.
- Cross-shop leakage: verify endpoints include `WHERE shop_id = ?` and mutations guard by `shop_id`.

## 12) PDF Export
- Quick method: Open this file on GitHub (or IDE preview), Print → Save as PDF.
- CLI (optional): Use `md-to-pdf` locally if desired.
