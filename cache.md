# Hospi Sales — Project State (context cache)

A compact handoff so a new chat can get up to speed without re-reading the whole
codebase. NOT a prompt cache (that's server-side) — just a summary. Update it as
things change.

_Last updated: 2026-10-05_

## Repos (two, side by side)
- **App** — `C:\Users\Tenstrings Music Ins\Documents\iceland app` → GitHub `Manlikenonso1k/Hospit-app`
  Expo SDK 57 + React Native 0.86 + TypeScript, Expo Router, TanStack Query,
  Zustand, React Hook Form + Zod, expo-secure-store, Inter fonts.
- **Backend** — `C:\Users\Tenstrings Music Ins\Documents\Iceland` → GitHub `Manlikenonso1k/iceland-beach`
  Laravel 12 + Filament 3, Sanctum, spatie/permission. DB locally = SQLite
  (`database/database.sqlite`); prod = MySQL. Live site icelandbeach.com.

## What the app is
White-label, multi-tenant hospitality ops app. PRIORITY 1 = meal-order delay
accountability: server stamps `due_at`, overdue orders escalate to the manager.
Role is assigned server-side (via `/api/me`), never picked by the user.

## Non-negotiables (keep these true)
- Server owns time: `due_at`, `server_time`, `seconds_remaining`, `status_colour`
  on every order payload. Never trust the phone clock.
- Tenant comes from the Sanctum token, never the request. `BelongsToTenant` scope
  on every new model.
- Money is integer kobo end to end.
- Backend changes are ADDITIVE only; keep the test suite green.
- Decline requires a stored reason. Role isolation enforced server-side.
- Live updates = React Query polling (manager/chef 10s, waitress 30s, CEO 60s).

## Status
- **Backend Phase 0 + Phase 2 complete and tested: 61/61 pass** (`php artisan test`).
- **App:** welcome, login (email OR phone), role-based tab shell, Manager Order
  Board (rebuilt to the design spec), waitress Take Order, chef Kitchen queue,
  account/logout; CEO (revenue) + Host screens are stubs.
- Order Board was rebuilt exactly to the design: red banner, summary row, filter
  pills, station picker, status cards with left edge + count-up timer + flashing
  "!", nudge/expedite/view-details actions, 5-tab manager bar (MaterialIcons).

## API surface (additive, in `routes/api.php`)
```
GET  /api/health                      public probe
POST /api/auth/login | logout         Sanctum token (email or phone)
GET  /api/me                          user + roles + tenant + prices
GET  /api/meals?department=
POST /api/orders                      waitress; server stamps due_at
GET  /api/orders?status=&dept=        role-scoped
GET  /api/orders/board                manager; RED→AMBER→GREEN
POST /api/orders/{o}/accept|decline|ready|complete
POST /api/orders/{o}/nudge            manager; stamps last_nudged_at, pages chefs
POST /api/orders/{o}/expedite         manager; stamps expedited_at
GET  /api/notifications/unread-count  header bell
POST /api/notifications/read-all
POST /api/device-tokens               Expo push token
```

## Key app files
- `src/theme.ts` — ALL design tokens + typography (Inter) + status maps. One source.
- `src/lib/clock.ts` — shared 1s ticker + server-time offset + overdue pulse.
- `src/api/client.ts` / `hooks.ts` / `types.ts` — fetch wrapper + React Query hooks.
- `src/store/authStore.ts` — Sanctum token in secure-store.
- `src/components/` — AppHeader, OrderTicketCard, OrderDetailSheet, ui.
- `app/(app)/` — board, order, kitchen, revenue, hosts, account + `_layout` (tabs).

## Run locally
See `STARTUP.md`. Short version (3 terminals, phone on same Wi-Fi):
1. `ipconfig` → put your IPv4 in `.env` as `EXPO_PUBLIC_API_BASE_URL=http://<IP>:8000/api`
2. `Iceland`: `php artisan serve --host=0.0.0.0 --port=8000`
3. `Iceland`: `php artisan schedule:work`  (overdue sweep → RED)
4. `iceland app`: `npx expo start -c`  (scan QR in Expo Go)
Demo logins (password `password`): manager@hospi.test, waiter@hospi.test,
chef@hospi.test, ceo@hospi.test, host@hospi.test.

## Gotchas
- This machine's global `~/.npmrc` has `allow-scripts` → npm installs here must use
  `--ignore-scripts` (project `.npmrc` sets it). `npx expo install` fails; pin
  versions from Expo's `bundledNativeModules.json` and `npm install --ignore-scripts`.
- LAN IP changes with DHCP — re-check `ipconfig` and update `.env`, then restart
  Expo with `-c` (EXPO_PUBLIC_* is baked at bundle start).
- Expo Go has no remote push (SDK 53+); push is skipped there. Order loop works.
- `app.config.ts` is excluded from tsc; it carries `/// <reference types="node" />`.

## Remaining work
- Global Inter pass on non-board screens (login/order/kitchen/account/welcome).
- Backend Phases 3–8: CSV meal import + prep-time editor, Ice Cream, Gate Sales,
  Hosts (services table), Front Desk (Booking::scopeBlocking), CEO dashboard.
- Device testing of the rebuilt board; EAS dev/APK builds.
