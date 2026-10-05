# Hospi Sales

White-label, multi-tenant hospitality operations app for resort teams, built
around **meal-order delay accountability**: every order gets a server-stamped
countdown, and overdue orders escalate to the manager automatically.

Android + iOS, built with **Expo (managed) + React Native + TypeScript**. It is a
client for an additive JSON API on an existing Laravel 12 + Filament backend.

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