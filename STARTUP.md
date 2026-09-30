# Hospi Sales — Cold-Start Sequence

How to bring the whole local stack back up after shutting everything off.

You'll use **three terminals** (two for the backend, one for the app). Your
**phone must be on the same Wi-Fi** as the PC.

Paths:
- Backend (Laravel API): `C:\Users\Tenstrings Music Ins\Documents\Iceland`
- App (Expo): `C:\Users\Tenstrings Music Ins\Documents\iceland app`

---

## 1. Check your PC's LAN IP (do this each time — it can change)

Any terminal:

```powershell
ipconfig
```

Note the **IPv4 Address** of your Wi-Fi adapter, e.g. `192.168.0.42`.

If it differs from last time, update the app's API address — edit
`iceland app\.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://<YOUR-LAN-IP>:8000/api
```

(If the IP is unchanged, skip this.) Use the LAN IP, never `localhost` /
`127.0.0.1` — on the phone those mean the phone itself.

## 2. Terminal A — Laravel API

```bash
cd "C:\Users\Tenstrings Music Ins\Documents\Iceland"
php artisan serve --host=0.0.0.0 --port=8000
```

`--host=0.0.0.0` is what lets the phone reach it. Quick check from the PC:
open `http://127.0.0.1:8000/api/health` → should return `{"status":"ok",...}`.

## 3. Terminal B — the scheduler (so orders flip to RED)

```bash
cd "C:\Users\Tenstrings Music Ins\Documents\Iceland"
php artisan schedule:work
```

Runs the overdue sweep every minute. Without it, PRIORITY 1 (overdue → manager
alert) won't fire.

## 4. Terminal C — the Expo app

```bash
cd "C:\Users\Tenstrings Music Ins\Documents\iceland app"
npx expo start
```

Scan the QR with **Expo Go** on your phone (or press `a` for an Android emulator
if Android Studio is installed).

---

## Log in (demo accounts, password `password`)

| Role     | Email               | Lands on           |
|----------|---------------------|--------------------|
| Manager  | manager@hospi.test  | Order Board        |
| Waitress | waiter@hospi.test   | Take an order      |
| Chef     | chef@hospi.test     | Main-kitchen queue |
| CEO      | ceo@hospi.test      | Revenue (stub)     |
| Host     | host@hospi.test     | Hosts (stub)       |

Login accepts **email OR phone**. Each account routes to its own home
automatically — no role picker.

## Stopping

`Ctrl+C` in each of the three terminals.

---

## Notes

- **Data persists.** The demo tenant, accounts and meals live in the SQLite file
  and survive restarts — no need to re-migrate or re-seed.
  Only if you ever reset the DB (in the Iceland folder):
  ```bash
  php artisan migrate:fresh --seed
  php artisan db:seed --class="Database\Seeders\HospiDemoSeeder"
  ```
- **Expo Go + push.** In Expo Go, push notifications are skipped by design
  (Expo removed remote push from Expo Go in SDK 53). The order → timer → board
  loop still works fully; the overdue alert shows on the manager board. Delivering
  a push to the phone needs a development build later.
- **Menu quick check (from the PC):**
  ```bash
  curl http://127.0.0.1:8000/api/health
  ```

See `..\Iceland\RUN_LOCAL.md` for the full backend/API reference.
