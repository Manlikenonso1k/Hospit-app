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
