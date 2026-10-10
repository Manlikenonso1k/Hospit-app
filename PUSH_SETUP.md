# Android Push (FCM) Setup — Hospi Sales

Background notifications on the Android build need **Firebase Cloud Messaging
(FCM)** credentials. Without them, Expo accepts the push but Android never
receives it. The app code and server are already wired for push — this is the
one-time credential setup. iOS push is handled automatically by EAS with an
Apple account, so this is Android-only.

Package name (you'll need it below): **`com.icelandbeach.hospisales`**
EAS project: **`codebynonsos-team / nonso`**

---

## 1. Create a Firebase project (your Google account)

1. Go to <https://console.firebase.google.com> → **Add project** (name it e.g.
   "Hospi Sales"). Analytics is optional — you can skip it.

## 2. Add the Android app + download google-services.json

1. In the project: **Project settings** (gear) → **Your apps** → **Add app** →
   **Android**.
2. **Android package name:** `com.icelandbeach.hospisales` (must match exactly).
   Nickname/SHA-1 can be left blank for push.
3. Click **Register app** → **Download `google-services.json`**.
4. Put that file in the **root of the `iceland app` project** (next to
   `package.json` / `app.config.ts`). The config already picks it up
   automatically once it's there.

> `google-services.json` is client config and is fine to commit (it's meant to
> ship inside the app). It is **not** the secret — the service-account key below
> is. If you prefer not to commit it to the public repo, restrict the Android API
> key in Google Cloud Console → Credentials.

## 3. Get the FCM V1 service-account key (the secret)

1. Firebase **Project settings** → **Service accounts** tab.
2. **Generate new private key** → confirm → it downloads a `.json` file.
3. Keep this file private. **Never commit it** (the repo's `.gitignore` already
   blocks `*service-account*.json` / `firebase-adminsdk*.json`). Save it
   somewhere outside the repo, e.g. your Downloads.

## 4. Upload the service-account key to EAS

In the `iceland app` folder, logged into EAS:

```bash
eas credentials
```
Then choose, at each prompt:
- Platform: **Android**
- Profile: **preview** (and repeat for **production** later)
- **Google Service Account** → **Manage your Google Service Account Key for Push
  Notifications (FCM V1)** → **Set up a Google Service Account Key** → point it at
  the `.json` you downloaded in step 3.

(Alternatively, in the Expo dashboard: project **nonso** → **Credentials** →
Android → **FCM V1 service account key** → upload.)

## 5. Rebuild and test

```bash
EAS_BUILD_SKIP_LOCKFILE_CHECK=1 eas build --profile preview --platform android
```
Install the new APK, log in, **allow notifications**, minimize the app, then run
the server test command (`php artisan tinker` push snippet). It should now land
on the phone.

---

## Checklist

- [ ] Firebase project created
- [ ] Android app added with package `com.icelandbeach.hospisales`
- [ ] `google-services.json` placed in the project root
- [ ] Service-account key generated (kept out of git)
- [ ] Service-account key uploaded via `eas credentials` (FCM V1)
- [ ] New APK built, notifications permission granted on the phone
- [ ] Minimized-app push received ✅
