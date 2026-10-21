# Didaskalia

*διδασκαλία — teaching.* A Bible quiz app for the website and Android, with accounts, a leaderboard, groups, daily streaks, verse memorization and an admin dashboard.

- **Everyone must sign in** (email + password) before they can play.
- **You get a dashboard** (menu → *Admin dashboard*) showing installs, registered people, who is online and active, and rounds played.
- Built with React + Vite + Tailwind, wrapped for Android with Capacitor, backed by Supabase (free tier is fine).

```
src/App.tsx            sign-in gate (nobody gets past it without an account)
src/auth/              sign in, create account, forgot/reset password
src/Game.tsx           the app shell: top bar + three-line menu
src/components/Drawer.tsx   the menu: every feature in one place
src/screens/           Home, Play, Library, Progress, Achievements, Leaderboard, Settings, Help, Admin …
src/engine.ts          all game state and actions
src/lib/               backend (accounts), account, groups, host (admin), storage, logic
src/brand.ts           app name, version and contact email: edit here
supabase/setup.sql     the whole database, one file
```

---

## 1. Set up the database and accounts (Supabase) — 10 minutes

1. Go to <https://supabase.com>, create a free account and a **New project**. Choose a region close to your players (for Nigeria, Europe/Frankfurt or London is usually fastest). Save the database password.
2. In the project: **SQL Editor → New query**. Open `supabase/setup.sql`, paste **everything**, press **Run**. (It is safe to run again whenever you update the app.)
3. **Authentication → Providers → Email**: make sure Email is enabled.
   - *Confirm email* **ON** = every address is verified by a link (more trustworthy numbers, but some people never click it).
   - *Confirm email* **OFF** = people get in straight away (easiest to start with).
4. **Authentication → URL Configuration → Site URL**: set this to the address of your website once you have it (step 3 below), e.g. `https://yourname.github.io/didaskalia/`. Password-reset emails send people there.
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key. You need both below. (Never use the `service_role` key in the app.)
6. Open the app, **create your own account**, then make yourself the admin: SQL Editor → run

   ```sql
   insert into public.host_admins (user_id)
     select id from auth.users where email = 'YOU@EXAMPLE.COM'
   on conflict do nothing;
   ```

   (use the email you registered with). Sign out and in again: **Admin dashboard** now appears in the menu.

> Already used the old version? Running `setup.sql` upgrades it. The old "host key" is replaced by the admin-by-email step above. The old anonymous players are not registered users, so everyone creates a real account once.

## 2. Run it on your computer

```bash
npm install
cp .env.example .env        # then paste your two Supabase values into .env
npm run dev                 # opens http://localhost:5173
npm test                    # 125 automated checks
```

Without the two Supabase values the app shows a "isn’t connected yet" page (by design: no account, no entry).

## 3. Put the website online (GitHub Pages, free)

1. Create a GitHub repository and push this folder to its `main` branch.
2. Repo → **Settings → Secrets and variables → Actions → New repository secret**. Add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
3. Repo → **Settings → Pages → Source: GitHub Actions**.
4. Push any change (or **Actions → Deploy website → Run workflow**). A minute later the site is live at `https://<you>.github.io/<repo>/`.
5. Copy that address into Supabase **Site URL** (step 1.4).
6. *Custom domain (optional):* in **Settings → Pages → Custom domain** enter your domain, add the DNS record GitHub shows, then add a repo **variable** `SITE_URL` = `https://yourdomain.com` (Settings → Secrets and variables → Actions → Variables).

Phones can "Install" the website from the Settings page or the browser menu. Those installs are counted as *Web app (installed)*.

## 4. Build the Android app

**Test build (APK) — no Android Studio needed:** push to `main`; **Actions → Build Android APK**; download the `didaskalia-apk` artifact, unzip, copy `app-debug.apk` to a phone and install it.

The app id is `com.didaskalia.app`. **Choose it now:** it can never change after your first Google Play upload.

## 5. Publish on Google Play

1. **Developer account:** <https://play.google.com/console> (one-time US$25 fee). Verify your identity. Note: new personal accounts must usually run a **closed test with about 12 testers for 14 days** before production, so start early and check Google's current rules in the Console.
2. **Create your signing key (once, keep it safe forever):**
   ```bash
   keytool -genkey -v -keystore didaskalia.jks -alias didaskalia -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 didaskalia.jks > didaskalia.jks.base64.txt      # macOS: base64 -i didaskalia.jks
   ```
   **Back up `didaskalia.jks` and its passwords** in at least two places. Do not commit them to GitHub.
3. Add four more **repository secrets**: `ANDROID_KEYSTORE_BASE64` (contents of the .txt file), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`didaskalia`), `ANDROID_KEY_PASSWORD`.
4. **Actions → Release to Play Store (signed AAB) → Run workflow.** Download the `didaskalia-aab` artifact: it contains `app-release.aab`. Each run automatically uses a higher version number, as Google requires.
5. In Play Console: **Create app** → *Didaskalia*, free, app. Then complete the required forms:
   - **Privacy policy URL:** `https://<your-site>/privacy.html` (included; open `public/privacy.html` and check the email and date).
   - **Account deletion:** the URL `https://<your-site>/account-deletion.html`. The in-app button is *Menu → Settings → Delete account*.
   - **Data safety:** you collect *email address*, *name* (display name) and *app activity* (points/progress). Data is encrypted in transit; users can request deletion; nothing is sold or shared.
   - **App access:** tell Google reviewers the app needs login and give them a test account (create one yourself in the app).
   - **Content rating** questionnaire, **target audience** (13+/general), store listing text, icon (`public/icon-512.png`), screenshots (take them from your phone) and a 1024×500 feature graphic.
6. **Testing → Closed testing:** create a track, upload the `.aab`, add your testers' emails, send them the opt-in link. After the testing period, apply for **Production**.
7. **Updating the app later:** increase nothing by hand; just run the release workflow again and upload the new `.aab` to the track.

## 6. Reading your dashboard

| Number | What it really counts |
|---|---|
| **Total installs** | Devices that have *opened* the app at least once (a random device ID, no personal data). Split into Android app / Web app (installed) / Website visitors. Google Play Console shows the store's own download numbers too; they will differ a little. |
| **Registered** | Accounts created. |
| **Online now** | People active in the last 5 minutes. |
| **Active today / 7 days / 30 days** | Different people who opened the app in that period. |
| **Rounds** | Games started (and which modes are most popular). |
| **Newest members** | Display name, join date, platform, last seen. Emails stay inside Supabase (**Authentication → Users**). |

You can also post a **message to everyone** (shows on every home page) from the dashboard.

## 7. Things to change before you launch

- `src/brand.ts` — `SUPPORT_EMAIL` (currently a placeholder `support@excellenteaser.com`; use an address you really read). Also update the email and date in `public/privacy.html` and `public/account-deletion.html`.
- `src/config.ts` — fallback website address for shared links (or set `VITE_SITE_URL`).
- Add your own questions in `src/questionsMore.ts` (each needs a unique verse reference), or let teachers add theirs in *Menu → My questions*.

## Good to know

- Passwords are handled entirely by Supabase Auth (hashed). The app never stores them.
- The database tables are locked; the app can only call the functions in `setup.sql`, and each function checks who is calling.
- Anyone can send fake "install" pings (the public key is public). Treat the install number as a good estimate, not an audit.
- Progress is saved on the device **and** in the account, so signing in on a new phone restores it.
- Free Supabase projects pause after a week of no use. Open the dashboard to wake it, or upgrade when you have real traffic.
