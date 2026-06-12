# PGP YL O-Week — Setup Guide

A Next.js 16 PWA for PGP Young Leaders (Co '28) Orientation Week. Adapted from the
ISB Cohort app. This guide covers everything from your accounts down to deploy.

The **code changes are done**. What you still own: a Supabase project, a Firebase
project (for push), a Vercel deploy, and the environment keys that tie them together.

---

## 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Firebase](https://firebase.google.com) project (Cloud Messaging) — only needed for push notifications
- A [Vercel](https://vercel.com) account (or any Next.js host)

## 2. Install & env

```bash
npm install
cp .env.example .env.local   # then fill in the values below
```

Keys in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase → Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — same page (server-only, keep secret)
- `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_SERVICE_ACCOUNT_KEY` — from Firebase (push only)
- `CRON_SECRET` — `openssl rand -hex 32`
- `NEXT_PUBLIC_ADMIN_EMAILS` — optional comma-separated override for admin emails.
- `NEXT_PUBLIC_COHORT_EMAIL_PATTERN` — optional regex override for allowed student emails.
  The built-in default allows emails ending `_PGPYL2028@isb.edu`.
- `NEXT_PUBLIC_MEME_WARS_APPS_SCRIPT_URL` — only if you use the Meme Wars submissions flow

## 3. Supabase database

In the Supabase **SQL editor**, run the migrations in `supabase/migrations/` **in numerical
order** (`001_…` through `035_…`). Migration `003` seeds **Section A** and **Section B**;
`034` adds the 6-digit attendance code and 60-second token window. Migration `035` removes
the student-registry dependency from auth and uses the email rules below.

## 3.1 Simple email login

The default login is Supabase's passwordless email magic link. This is the simplest setup:
no Microsoft Entra app, no client secret, and no OAuth provider configuration.

In Supabase, go to **Authentication → Providers → Email** and keep the Email provider enabled.
Then configure these URLs under **Authentication → URL Configuration**:

- Site URL:
  `https://pgpyl-orientation-app.vercel.app`
- Additional redirect URL:
  `https://pgpyl-orientation-app.vercel.app/auth/callback`
- Local redirect URL for development:
  `http://localhost:3000/auth/callback`

Access is controlled by email:

- Admins:
  `karthik_m@isb.edu`, `aziz_abdul@isb.edu`, `anitha_pothini@isb.edu`,
  `saniya_arora@isb.edu`, `tvs_pradeep@isb.edu`
- Students/users:
  any email ending `_PGPYL2028@isb.edu`

Anyone else can receive an email link, but the app will block them after sign-in because no
profile is created.

### Optional Microsoft login

If you later want the Microsoft button back, the app can use Supabase's **Azure** OAuth
provider. In Supabase, go to **Authentication → Providers → Azure** and enable it with your
Microsoft Entra app's client ID and client secret.

Use these URLs:

- Supabase redirect URL to add in Microsoft Entra:
  `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Site URL in Supabase:
  `https://pgpyl-orientation-app.vercel.app`
- Additional redirect URL in Supabase:
  `https://pgpyl-orientation-app.vercel.app/auth/callback`
- Local redirect URL for development:
  `http://localhost:3000/auth/callback`

If Microsoft sign-in appears to do nothing, check the browser console or Supabase response.
`Unsupported provider: provider is not enabled` means the Azure provider is still disabled
or missing credentials in Supabase.

Then:

1. **Seed the schedule** — run `supabase/seed/oweek_schedule_seed.sql` once. It auto-assigns
   events to your earliest admin and skips if O-Week events already exist.

## 4. Edge functions + QR rotation cron

Deploy the functions in `supabase/functions/`:

```bash
supabase functions deploy rotate-qr-token mark-attendance \
  close-attendance-session cleanup-empty-groups send-group-invite on-event-change
```

Schedule `rotate-qr-token` to run **every minute** (matches the 60-second token window).
In the Supabase SQL editor (pg_cron):

```sql
select cron.schedule(
  'rotate-qr-token',
  '* * * * *',                       -- every 1 minute
  $$
  select net.http_post(
    url     := 'https://<your-project>.supabase.co/functions/v1/rotate-qr-token',
    headers := jsonb_build_object('x-cron-secret', '<your CRON_SECRET>')
  );
  $$
);
```

> Each rotation now also generates a **6-digit code**. Students can scan the QR **or** tap
> "Enter 6-digit code" on the Scan screen and type the code shown on the presenter's screen.

## 5. Run & deploy

```bash
npm run dev      # local: http://localhost:3000
npm run build    # production build
```

Deploy to Vercel and add every variable from `.env.local` in the Vercel project settings.

## 6. Assets to swap (optional but recommended)

- `public/icons/*` and `public/logo-base.png` — replace with PGP YL artwork
- `public/campus-map.pdf` — replace with the current ISB campus map
- Theme colour lives in `src/app/globals.css` (`--color-primary-*`, indigo by default)

---

## What changed vs. the original app

- **Rebranded** to "PGP YL O-Week" (name, manifest, metadata) with a fresh indigo palette.
- **Removed**: Sorting Hat, Groups, Student Bodies, Shutter Island.
- **Sections** reduced from 6 houses to **A & B**.
- **Attendance**: QR rotates every **60s** + a **6-digit fallback code** with manual entry.
- **Events**: campus venues added so each session shows directions / "Open in Google Maps".
- **Resource Guide**: a new O-Week section (registration, facilities, F&B, medical, FAQs) under
  Resources, plus emergency contacts seeded with the real campus numbers.

### Showing sessions per section
The seeded schedule is visible to **everyone**, with section-specific sessions labelled
"(Section A)" / "(Section B)". To restrict a session to one section instead, set its
`visibility` to `'section'` and add an `event_assignments` row pointing to that section's id.
