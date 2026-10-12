# FlexDesk - Getting Started Guide

Your personal checklist to get FlexDesk running locally and deployed.

---

## Current Status (Verified)

| Component | Build | Tests | Notes |
|-----------|-------|-------|-------|
| **flexdesk-server** | ✅ Pass | 91% (311/344) | Ready for deployment |
| **flexdesk-preview-v2** | ✅ Pass | N/A | New frontend, ready |
| **flexdesk-admin** | ❌ TS Error | N/A | Pre-existing issue in `autocomplete-input.tsx` |

---

## Part 1: Local Development Setup

### Step 1.1: Install Dependencies

```bash
# From monorepo root
cd C:\Users\paulo\Desktop\Repositories\FlexDesk

# Install all dependencies
pnpm install
```

### Step 1.2: Set Up Local Database

**Option A: Use Neon (Recommended - No local install)**
1. Go to https://neon.tech
2. Create free account
3. Create project "flexdesk-dev"
4. Copy connection string

**Option B: Local PostgreSQL**
```bash
# If you have PostgreSQL installed locally
createdb flexdesk_dev
```

### Step 1.3: Configure Environment Variables

```bash
cd packages/flexdesk-server

# Copy example env
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Database (use your Neon URL or local)
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/flexdesk?sslmode=require"

# Auth (generate random secrets)
JWT_SECRET="your-32-char-random-secret-here"
JWT_REFRESH_SECRET="different-32-char-random-secret"

# For local dev, leave these as placeholders
GOOGLE_CLIENT_ID="placeholder"
GOOGLE_CLIENT_SECRET="placeholder"
STRIPE_SECRET_KEY="sk_test_placeholder"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
PUBLIC_APP_URL="http://localhost:5173"
```

### Step 1.4: Run Database Migrations

```bash
cd packages/flexdesk-server

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed database
pnpm prisma db seed
```

### Step 1.5: Start Development Servers

**Terminal 1 - Backend API:**
```bash
cd packages/flexdesk-server
pnpm start:dev

# API runs at http://localhost:3000
# Health check: http://localhost:3000/api/v1/health
```

**Terminal 2 - Frontend (preview-v2):**
```bash
cd packages/flexdesk-preview-v2
pnpm dev

# App runs at http://localhost:5173
```

### Step 1.6: Verify Everything Works

```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Expected: {"status":"ok","timestamp":"..."}
```

Open http://localhost:5173 in browser - you should see the login page.

---

## Part 2: External Services Setup

### Step 2.1: Google OAuth (Required for Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "FlexDesk"
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Name: "FlexDesk"
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/v1/auth/google/callback
     ```
6. Copy Client ID and Client Secret
7. Update `.env`:
   ```bash
   GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
   GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"
   ```

### Step 2.2: Stripe (Required for Billing)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or log in
3. Go to **Developers → API keys**
4. Copy the **test** keys (sk_test_... and pk_test_...)
5. Update `.env`:
   ```bash
   STRIPE_SECRET_KEY="sk_test_xxx"
   ```
6. Set up webhook (for local testing):
   ```bash
   # Install Stripe CLI
   # https://stripe.com/docs/stripe-cli

   # Forward webhooks to local
   stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
   ```
7. Copy webhook signing secret to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_xxx"
   ```

### Step 2.3: SendGrid (Optional - for Emails)

1. Go to [SendGrid](https://sendgrid.com)
2. Create free account (100 emails/day)
3. Go to **Settings → API Keys**
4. Create API key with "Full Access"
5. Go to **Settings → Sender Authentication**
6. Verify your sender email
7. Update `.env`:
   ```bash
   SENDGRID_API_KEY="SG.xxx"
   SENDGRID_FROM_EMAIL="noreply@flexdesk.com"
   ```

### Step 2.4: Twilio (Optional - for SMS)

Skip for now. Add later when you need SMS notifications.

---

## Part 3: Deployment

### Step 3.1: Create Accounts

- [ ] [Neon](https://neon.tech) - Database (free tier)
- [ ] [Railway](https://railway.app) - Backend API ($5/mo)
- [ ] [Vercel](https://vercel.com) - Frontend (free for non-commercial)

### Step 3.2: Deploy Database (Neon)

1. Create production project: "flexdesk-prod"
2. Copy connection string
3. Run migrations:
   ```bash
   DATABASE_URL="your-neon-prod-url" pnpm prisma migrate deploy
   ```

### Step 3.3: Deploy Backend (Railway)

```bash
cd packages/flexdesk-server

# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set DATABASE_URL="your-neon-prod-url"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-secret"
railway variables set GOOGLE_CALLBACK_URL="https://your-app.up.railway.app/api/v1/auth/google/callback"
railway variables set STRIPE_SECRET_KEY="sk_live_xxx"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_xxx"
railway variables set FRONTEND_URL="https://your-admin-app.vercel.app"
railway variables set PUBLIC_APP_URL="https://your-admin-app.vercel.app"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

### Step 3.4: Deploy Frontend (Vercel)

```bash
cd packages/flexdesk-preview-v2

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variable
vercel env add VITE_API_URL production
# Enter: https://your-app.up.railway.app/api/v1

# Deploy to production
vercel --prod
```

### Step 3.5: Update OAuth Callback URLs

After deployment, update Google OAuth:
1. Go to Google Cloud Console
2. Add production redirect URI:
   ```
   https://your-app.up.railway.app/api/v1/auth/google/callback
   ```

### Step 3.6: Update Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint:
   ```
   https://your-app.up.railway.app/api/v1/webhooks/stripe
   ```
3. Select events: `payment_intent.*`, `invoice.*`, `customer.subscription.*`
4. Copy signing secret to Railway env vars

---

## Part 4: Verification Checklist

### Local Development
- [ ] `pnpm install` completes without errors
- [ ] Database migrations run successfully
- [ ] API starts and health check returns OK
- [ ] Frontend loads login page
- [ ] Google OAuth login works
- [ ] Can create a test job

### Production
- [ ] API health check: `curl https://your-app.up.railway.app/api/v1/health`
- [ ] Frontend loads
- [ ] Google OAuth works with production URLs
- [ ] Stripe webhook test succeeds
- [ ] Can complete full flow: Login → Create Job → Generate Invoice

---

## Common Issues & Fixes

### "Cannot find module @prisma/client"
```bash
cd packages/flexdesk-server
pnpm prisma generate
```

### "Database connection failed"
- Check DATABASE_URL is correct
- For Neon: ensure `?sslmode=require` is in the URL
- Check if Neon compute is suspended (free tier auto-suspends)

### "CORS error" in browser
- Ensure FRONTEND_URL in backend .env matches your frontend URL exactly
- Include protocol: `http://localhost:5173` not `localhost:5173`

### "Google OAuth redirect error"
- Verify callback URL in Google Console matches exactly
- Check GOOGLE_CALLBACK_URL in .env

### Railway deployment fails
```bash
# Check build logs
railway logs --build

# Common fix: ensure Dockerfile is correct
# Common fix: check all required env vars are set
```

### Vercel build fails
- Check that `VITE_API_URL` is set
- Ensure no TypeScript errors: `pnpm build` locally first

---

## Quick Reference Commands

```bash
# Start everything locally
cd packages/flexdesk-server && pnpm start:dev &
cd packages/flexdesk-preview-v2 && pnpm dev &

# Run server tests
cd packages/flexdesk-server && pnpm test

# Build server
cd packages/flexdesk-server && pnpm build

# Build frontend
cd packages/flexdesk-preview-v2 && pnpm build

# Deploy backend
cd packages/flexdesk-server && railway up

# Deploy frontend
cd packages/flexdesk-preview-v2 && vercel --prod

# Check API health
curl http://localhost:3000/api/v1/health        # local
curl https://your-app.up.railway.app/api/v1/health # production

# Database commands
pnpm prisma migrate dev      # create new migration
pnpm prisma migrate deploy   # apply migrations
pnpm prisma studio           # visual database browser
pnpm prisma db push          # sync schema without migration
```

---

## Next Steps After Deployment

1. **Set up monitoring**
   - Add Sentry for error tracking
   - Set up uptime monitoring (BetterStack, Checkly)

2. **Configure custom domain**
   - Add domain in Railway settings
   - Add domain in Vercel settings
   - Update DNS records

3. **Enable production Stripe**
   - Switch from `sk_test_` to `sk_live_` keys
   - Update webhook endpoint

4. **Upgrade when ready**
   - Vercel Pro ($20/mo) when commercially launching
   - Neon Pro when approaching 0.5GB storage

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NestJS Docs:** https://docs.nestjs.com
