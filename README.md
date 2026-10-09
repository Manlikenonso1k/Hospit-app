# Hospi Sales

White-label, multi-tenant hospitality operations app for resort teams, built
around **meal-order delay accountability**: every order gets a server-stamped
countdown, and overdue orders escalate to the manager automatically.

Android + iOS, built with **Expo (managed) + React Native + TypeScript**. It is a
client for an additive JSON API on an existing Laravel 12 + Filament backend.

## Features

Full marketing feature list: **[features.md](./features.md)**. Highlights:

- **Server-owned order timers** + traffic-light Order Board (green/amber/red) with
  automatic overdue escalation to the manager.
- **Role-based** (Manager, Waiter, Chef, CEO, Host) — assigned by the business,
  auto-routed home; sign in by email or phone.
- **Manager Nudge** (loud chef alerts) and **Expedite**; **Menu & prices**
  management with product photo upload; **per-business department setup**;
  **in-app staff creation** (manager → waiter/chef/host · CEO → manager/waiter/
  chef/host) and **tables** management.
- **Operations dashboard** (CEO home + manager Ops tab): live gross revenue by
  period, **per-department earnings** (share, tickets, avg prep), an overdue
  alert, and **delay accountability** — which chefs ran late on the cook and which
  waitresses were slow to pick up.
- **Order hand-offs:** a waiter sends an order to another waiter, a chef to
  another chef on the same station — the recipient accepts or declines. A
  **manager can reassign** any order's waitress or chef directly.
- **Waiter Take Order** (photo menu, search, notes, multi-kitchen cart) and
  **My Orders** with "order ready" alerts to pick up and serve.
- **Chef** station queue with **new-order alerts**, **shifts** (see which chef
  made each meal), accept / decline-with-reason / ready.
- **Audible alerts:** new order, manager nudge and "order ready" chime + vibrate
  (not just flash), with an on/off toggle in Settings.
- **Multiple kitchen stations** (Main Kitchen, Grill Kitchen, Barbecue, Ice Cream)
  added as data, not code. White-label, multi-tenant, isolated per business.

## Stack

- Expo SDK 57 · Expo Router (file-based navigation)
- TanStack Query (server state, short polling) · Zustand (client state)
- React Hook Form + Zod · expo-secure-store (Sanctum token in the keychain)
- Expo Notifications (manager push) · expo-web-browser (payments)

## Roles

Role is assigned by the business and delivered by the server in `/api/me` — the
user never picks it. The app routes automatically to the role's home:

| Role     | Home              |
|----------|-------------------|
| Manager  | Order Board       |
| Waitress | Take an order     |
| Chef     | Kitchen queue     |
| CEO      | Revenue dashboard |
| Host     | Tables/beds/cabins|

## Run it locally

See [STARTUP.md](./STARTUP.md) for the full cold-start sequence (Laravel API,
scheduler, Expo). In short:

```bash
npm install --ignore-scripts
# set EXPO_PUBLIC_API_BASE_URL=http://<YOUR-LAN-IP>:8000/api in .env
npx expo start        # scan the QR with Expo Go
```

## Type check

```bash
npm run lint          # tsc --noEmit
```

# Terminal 1 — API                 (Documents\Iceland)
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2 — overdue scheduler    (Documents\Iceland)
php artisan schedule:work

# Terminal 3 — web app              (Documents\iceland app)
npx expo start --web     # then open http://localhost:8081


Open separate browser tabs at http://localhost:8081 — each tab is its own session:

Tab 1 → manager@hospi.test (Order Board)
Tab 2 → chef@hospi.test (Kitchen)
Tab 3 → waiter@hospi.test (Take Order)
Tab 4 → ceo@hospi.test, Tab 5 → host@hospi.test (all password)

## Demo accounts

All demo accounts use the password **`password`**. You can sign in with the email **or** the phone number.

| Role     | Email               | Phone        | Lands on           |
|----------|---------------------|--------------|--------------------|
| Manager  | manager@hospi.test  | 08100000001  | Order Board        |
| Waitress | waiter@hospi.test   | 08100000002  | Take an order      |
| Chef     | chef@hospi.test     | 08100000003  | Kitchen queue (Main Kitchen) |
| Grill Chef | grillchef@hospi.test | 08100000006 | Kitchen queue (Grill Kitchen) |
| CEO      | ceo@hospi.test      | 08100000004  | Revenue dashboard  |
| Host     | host@hospi.test     | 08100000005  | Tables/beds/cabins |