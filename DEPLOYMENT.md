# Deploying ShopElite: GitHub, Supabase, Vercel

Order matters: **prepare the project, GitHub, Supabase (with your local data), Vercel, test.**
Commands are for Windows Command Prompt, run from the project folder.

---

## 0. Prepare the project

1. Extract the zip into the project folder (overwrite when asked).
2. **Delete `drizzle.config.json`**. It contains your local database password and is replaced by `drizzle.config.ts`.
3. Run:

```bat
npm install
npm install -D tsx
npm pkg set scripts.db:push="drizzle-kit push"
npm pkg set name=shopelite
npx tsc --noEmit
```

`npm install` also repairs `package-lock.json` (it was out of sync, and builds need it in sync). The last command should print nothing.

---

## 1. GitHub

1. Create an empty repository at https://github.com/new. Choose **Private**, with no README and no .gitignore.
2. In the project folder:

```bat
git init
git add .
git ls-files | findstr /i "\.env drizzle.config"
```

3. **That last command must print only `.env.example` and `drizzle.config.ts`.** If `.env` or `drizzle.config.json` appears, stop: run `git rm --cached .env` (or delete the json file) and check again.
4. Commit and push (use your own URL):

```bat
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shopelite.git
git push -u origin main
```

---

## 2. Supabase (database, with your local data)

1. https://supabase.com, then **New project**.
   - Region: **Paris (eu-west-3)** matches `vercel.json` (`cdg1`).
   - Generate a database password and **save it**. Letters and numbers only avoids encoding problems.
2. Click **Connect** at the top of the project and copy two connection strings, replacing `[YOUR-PASSWORD]` in both:
   - **Transaction pooler** (port **6543**): used by Vercel (the live website).
   - **Session pooler** (port **5432**): used from your PC to load the data.
   Vercel cannot use the "Direct connection" (IPv6 only), so use the poolers.

### 2a. Copy your local database to Supabase (keeps all your data)

Find your Postgres tools folder, usually `C:\Program Files\PostgreSQL\<version>\bin`. Run these there, or with the full path to each program:

```bat
pg_dump -n public --no-owner --no-privileges -Fc -f ecom.dump "postgresql://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/ecom_app"
pg_restore --no-owner --no-privileges --clean --if-exists -d "PASTE_THE_SESSION_POOLER_URL_HERE" ecom.dump
```

- `pg_dump` must be the **same version as, or newer than, Supabase's Postgres** (see Project Settings). On a version error, install a newer PostgreSQL client, or use pgAdmin: right-click your database, **Backup** (format Custom, schema `public`), then **Restore** onto the Supabase connection.
- A few warnings about roles or extensions are normal. Real failures say `error:` for a table.
- Delete `ecom.dump` afterwards. It contains all your data.

**Then run these in the Supabase SQL Editor:**

1. **Your restored admin account still has the weak password from your local database.** Create a new hash on your PC:

```bat
node -e "require('bcryptjs').hash(process.argv[1],12).then(console.log)" "YourNewStrongPassword"
```

Then run (paste the printed hash between the quotes):

```sql
UPDATE users SET password_hash = 'PASTE_HASH_HERE' WHERE email = 'admin@shopelite.com';
```

2. **Remove old login sessions** copied from your PC:

```sql
DELETE FROM sessions;
```

3. **Lock the database API.** Supabase exposes tables over a public REST API, and tables created outside Supabase have no protection. Your app is not affected, because it connects directly:

```sql
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
```

Also delete test customers, test orders and test coupons you don't want on the live shop.

### 2b. Alternative: start fresh with demo data

Do this **instead of 2a**, from your PC. Setting a variable in the terminal overrides `.env` for that window only:

```bat
set DATABASE_URL=PASTE_THE_SESSION_POOLER_URL_HERE
npx drizzle-kit push
set ADMIN_EMAIL=you@example.com
set ADMIN_PASSWORD=choose-a-strong-password
npm run db:seed
```

Close the terminal afterwards. Then run the Row Level Security script from 2a.

---

## 3. Vercel

1. https://vercel.com, then **Add New, Project**, and import your GitHub repository. Framework: Next.js (auto-detected).
2. Before clicking **Deploy**, open **Environment Variables** and add:

| Variable | Value | Needed |
|---|---|---|
| `DATABASE_URL` | Supabase **Transaction pooler** URL (port 6543) | **Yes** |
| `CLOUDINARY_CLOUD_NAME` | from your Cloudinary dashboard | Yes |
| `CLOUDINARY_API_KEY` | from Cloudinary | Yes |
| `CLOUDINARY_API_SECRET` | from Cloudinary | Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | same as `CLOUDINARY_CLOUD_NAME` | Yes |
| `SMTP_HOST` | `smtp.gmail.com` | For emails |
| `SMTP_PORT` | `587` | For emails |
| `SMTP_USER` | your Gmail address | For emails |
| `SMTP_PASS` | Gmail app password (16 lowercase letters) | For emails |
| `EMAIL_FROM` | same address as `SMTP_USER` | For emails |
| `NEXT_PUBLIC_APP_NAME` | `ShopElite` | Optional |
| `NEXT_PUBLIC_APP_URL` | **leave out**; set only for a custom domain | Optional |

Everything else in your old `.env` (Stripe, NextAuth, Google/GitHub, Redis, JWT, analytics) is not used by the code.

3. Click **Deploy**. The build needs `DATABASE_URL` to exist.
4. Open the `https://....vercel.app` address you are given.

**Changing a variable later requires a redeploy** (Deployments, the three dots, Redeploy).

---

## 4. Email links: localhost and Vercel

Links in emails (verify email, reset password, order emails) use the right address automatically:

- **`npm run dev` on your PC**: `.env` has `NEXT_PUBLIC_APP_URL=http://localhost:3000`, so links open `localhost:3000`.
- **Deployed on Vercel**: the variable is not set, so links use your Vercel address (for a preview deployment, that deployment's own address).
- **Custom domain**: set `NEXT_PUBLIC_APP_URL=https://www.yourdomain.com` in Vercel (Production only) and redeploy.
- If you paste your whole local `.env` into Vercel by mistake, a `localhost` value is **ignored on Vercel**, so emails still link to the right site.

Keep your local `.env` pointing at your **local** database and Vercel at Supabase, so local testing never touches live data.

---

## 5. After the first deploy

1. Sign in at `/auth/login` with the admin email and the **new** password.
2. Register a test customer, open the verification email, and click the link. It must open the Vercel site.
3. Test "Forgot password?".
4. Upload a product image in the admin (tests Cloudinary).
5. Place a test cash-on-delivery order, cancel it in the admin, and check the stock.
6. Create and use a coupon.
7. Check that product images from your local data display. If some are missing, their host is not allowed: add it to `images.remotePatterns` in `next.config.ts`.

---

## Before real customers

- **Vercel Hobby (free) is for personal, non-commercial projects.** A real store needs the Pro plan.
- **Supabase free projects pause after about a week of inactivity**, which takes the shop offline until you resume it. Use a paid plan for a live store.
- **Gmail** is limited to roughly 500 emails per day. For a real store use Brevo, Resend or similar with your own domain.
- The **rate limiter is in memory**, so on Vercel each server instance counts separately. It blocks casual abuse but is not a strict global limit.
- Rotate any secret that was ever pasted into a chat or shared in an archive (Cloudinary secret, Gmail app password, database password).

---

## Troubleshooting

| Problem | Cause / fix |
|---|---|
| Build fails: `DATABASE_URL is required` | Add `DATABASE_URL` in Vercel, then redeploy. |
| `password authentication failed` | Wrong password, or special characters not URL-encoded. The pooler username is `postgres.PROJECTREF`, not just `postgres`. |
| `ENOTFOUND` / `ENETUNREACH` on `db.xxx.supabase.co` | That is the IPv6-only direct connection. Use the pooler URLs. |
| `pg_dump: error: aborting because of server version mismatch` | Your local `pg_dump` is older than Supabase's Postgres. Use a newer client or pgAdmin. |
| `drizzle-kit push` or the restore hangs on port 6543 | Use the **Session pooler** (5432) from your PC. |
| Emails link to the wrong place | Clear `NEXT_PUBLIC_APP_URL` in Vercel (or set your real domain) and redeploy. |
| Emails not arriving | Check the SMTP variables in Vercel, then Vercel, Logs, for `Invalid login`. |
| Images missing | Host not allowed: add it to `images.remotePatterns` in `next.config.ts`. |
| Site is slow | Supabase region and `vercel.json` region should be close to each other. |
