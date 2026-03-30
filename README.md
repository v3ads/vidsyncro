# VidSyncro

> Enterprise dual-video interactive platform. Two realities. One hold.

Built with Next.js 14, Supabase, Mux, NextAuth (Google), Tailwind CSS, and framer-motion.

---

## What It Does

VidSyncro lets you upload two synchronized videos (Reality A and Reality B) and deliver them in a single embed. Viewers hold their mouse or finger to see Reality B, release to return to Reality A. Both videos stay frame-perfect in sync via a passive sync engine and an active seek on switch.

---

## Quick Start

### 1. Clone & Install

```bash
cd vidsyncro
npm install
cp .env.example .env.local
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Authentication → Providers** → enable **Google**
5. Add your Google OAuth credentials (see step 4 below)

### 3. Set Up Mux

1. Create an account at [mux.com](https://mux.com)
2. Go to **Settings → API Access Tokens** → create a token with **Mux Video** write access
3. Copy **Token ID** → `MUX_TOKEN_ID` and **Token Secret** → `MUX_TOKEN_SECRET`
4. Go to **Settings → Video → Environments** → copy the environment key → `NEXT_PUBLIC_MUX_ENV_KEY`
5. Go to **Settings → Webhooks** → create a webhook pointing to:
   `https://vidsyncro.com/api/videos/webhook`
   with event: `video.asset.ready` and `video.asset.errored`
6. Copy the webhook signing secret → `MUX_WEBHOOK_SECRET`

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://vidsyncro.com/api/auth/callback/google` (prod)
5. Copy **Client ID** → `GOOGLE_CLIENT_ID` and **Client Secret** → `GOOGLE_CLIENT_SECRET`

### 5. Configure `.env.local`

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run-openssl-rand-base64-32

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
MUX_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_MUX_ENV_KEY=your-env-key

ADMIN_EMAIL=vipaymanshalaby@gmail.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EMBED_URL=http://localhost:3000
```

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

### 1. Deploy to Vercel

```bash
npx vercel deploy
```

Or connect your GitHub repo at [vercel.com](https://vercel.com).

### 2. Add Environment Variables

In Vercel dashboard → Settings → Environment Variables, add all variables from `.env.local` with production values.

### 3. Configure Custom Domains

1. Add `vidsyncro.com` as your primary domain
2. Add `embed.vidsyncro.com` as an additional domain on the same Vercel project

Both domains must point to your Vercel project. The middleware handles subdomain routing automatically.

### 4. Set Production URLs

Update:
- `NEXTAUTH_URL=https://vidsyncro.com`
- `NEXT_PUBLIC_APP_URL=https://vidsyncro.com`
- `NEXT_PUBLIC_EMBED_URL=https://embed.vidsyncro.com`

### 5. Update OAuth Redirect URIs

In Google Cloud Console, add:
- `https://vidsyncro.com/api/auth/callback/google`

### 6. Update Mux Webhook

Point webhook to `https://vidsyncro.com/api/videos/webhook`

---

## Architecture

```
vidsyncro/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── auth/signin/                # Google sign-in
│   │   ├── dashboard/                  # User dashboard
│   │   │   ├── projects/new/           # Project creation wizard
│   │   │   └── projects/[id]/editor/   # Project editor + live preview
│   │   ├── embed/[id]/                 # Public embed player
│   │   └── api/
│   │       ├── auth/[...nextauth]/     # NextAuth
│   │       ├── projects/               # Project CRUD
│   │       ├── videos/mux-upload/      # Get Mux upload URL
│   │       ├── videos/webhook/         # Mux webhook handler
│   │       └── analytics/             # Analytics events
│   ├── components/
│   │   └── player/VidSyncroPlayer.tsx  # ⭐ The core dual-video player
│   ├── lib/
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── mux.ts                      # Mux client
│   │   ├── supabase.ts                 # Supabase clients
│   │   └── utils.ts                    # Helpers
│   ├── types/index.ts                  # TypeScript types
│   └── middleware.ts                   # Auth + subdomain routing
└── supabase/schema.sql                 # DB schema + RLS
```

---

## Admin Setup

Sign in with `vipaymanshalaby@gmail.com` via Google. The `ADMIN_EMAIL` env var grants the admin plan automatically. The admin profile will have `plan = 'admin'` in the database, granting access to all features with no limits.

To manually set a user as admin in Supabase:
```sql
UPDATE profiles SET plan = 'admin' WHERE email = 'vipaymanshalaby@gmail.com';
```

---

## The Player (`VidSyncroPlayer.tsx`)

The core mechanic:
1. Two `<video>` elements load simultaneously via Mux HLS URLs
2. Both `preload="auto"` — buffered immediately
3. On `mousedown`/`touchstart`: `videoB.currentTime = videoA.currentTime` then show B
4. On `mouseup`/`touchend`: `videoA.currentTime = videoB.currentTime` then show A
5. Passive sync: `setInterval` every 500ms checks `|timeA - timeB|`, re-syncs if > 0.5s
6. CSS transitions handle the visual switch (crossfade, slide, zoom, blur-reveal)

**Supported interaction modes:** hold · toggle · hover  
**Supported transitions:** crossfade · slide-left · slide-right · zoom · blur-reveal  
**Keyboard:** `Space` play/pause, `H` hold/release  
**Mobile:** `touchstart`/`touchend`, haptic feedback via `navigator.vibrate()`  

---

## Plans & Limits

| Plan | Projects | Analytics | Custom Branding | Domain Whitelist |
|------|----------|-----------|-----------------|-----------------|
| Free | 2 | ✗ | ✗ | ✗ |
| Starter ($29) | 20 | ✓ | ✓ | ✗ |
| Pro ($79) | ∞ | ✓ | ✓ | ✓ |
| Enterprise | ∞ | ✓ | ✓ | ✓ |
| Admin | ∞ | ✓ | ✓ | ✓ |

---

## Adding Stripe (Payments)

1. Install: `npm install stripe @stripe/stripe-js`
2. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to env
3. Create products/prices in Stripe dashboard
4. Add `/api/stripe/checkout` and `/api/stripe/webhook` routes
5. On successful payment webhook, update `profiles.plan` in Supabase

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS |
| Animations | framer-motion |
| Auth | NextAuth.js v4 + Google OAuth |
| Database | Supabase (Postgres) |
| File/Video Storage | Mux (direct upload → HLS) |
| State | React useState/useRef (no external store needed) |
| Deploy | Vercel |
| DNS/CDN | Cloudflare |
