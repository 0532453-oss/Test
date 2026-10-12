# FlexDesk Deployment Guide

This guide covers deploying FlexDesk to production using Railway (backend) and Vercel (frontend).

## Prerequisites

- GitHub account with repository access
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- External service accounts (optional):
  - Stripe (payments)
  - SendGrid (email)
  - Twilio (SMS)
  - Google Cloud (Maps API)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│  Vercel         │     │  Railway        │
│  ─────────────  │     │  ────────────── │
│  - Admin App    │────▶│  - NestJS API   │
│  - Preview App  │     │  - PostgreSQL   │
│  - Website      │     │                 │
└─────────────────┘     └─────────────────┘
```

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project

1. Go to [Railway](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your FlexDesk repository

### 1.2 Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create `DATABASE_URL`

### 1.3 Configure Backend Service

1. Click on the GitHub service
2. Go to **Settings** tab:
   - **Root Directory**: `packages/flexdesk-server`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start:prod`

3. Go to **Variables** tab and add:

```env
# Required
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate-a-secure-random-string>
NODE_ENV=production
PORT=3001

# CORS - Add your Vercel domains
CORS_ORIGIN=https://your-admin-app.vercel.app,https://your-website.vercel.app

# Public URL
PUBLIC_APP_URL=https://your-admin-app.vercel.app

# Billing defaults
DEFAULT_JOB_HOURLY_RATE=100
DEFAULT_TAX_RATE=0.1
DEFAULT_INVOICE_DUE_DATE_DAYS=30

# External Services (add when ready)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@flexdesk.com
SENDGRID_FROM_NAME=FlexDesk
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1234567890
GOOGLE_MAPS_API_KEY=AIzaxxx
```

### 1.4 Run Database Migrations

1. In Railway, go to your backend service
2. Click "Settings" → "Deploy" → Enable "Deploy on push"
3. Open the **Shell** tab and run:

```bash
npx prisma migrate deploy
```

### 1.5 Verify Deployment

Your API should be live at: `https://your-app.up.railway.app`

Test the health endpoint:
```bash
curl https://your-app.up.railway.app/api/v1/health
```

## Step 2: Deploy Frontend to Vercel

### 2.1 Deploy Admin App

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your FlexDesk repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `packages/flexdesk-admin`
5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
   ```
6. Click "Deploy"

### 2.2 Deploy Preview App

1. Click "Add New" → "Project"
2. Import the same repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `packages/flexdesk-preview-v2`
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
   ```
5. Click "Deploy"

### 2.3 Deploy Website (Optional)

1. Click "Add New" → "Project"
2. Import the same repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `packages/flexdesk-website`
4. Add Environment Variables (optional):
   ```
   NEXT_PUBLIC_ALGOLIA_APP_ID=your-algolia-app-id
   NEXT_PUBLIC_ALGOLIA_API_KEY=your-algolia-api-key
   ```
5. Click "Deploy"

## Step 3: Update CORS Origins

After deploying frontend apps, update the Railway backend:

1. Go to Railway → Your backend service → Variables
2. Update `CORS_ORIGIN` with your Vercel domains:
   ```
   CORS_ORIGIN=https://your-admin-app.vercel.app,https://your-website.vercel.app
   ```

## Step 4: Set Up Custom Domains (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `app.flexdesk.com`)
3. Update DNS records as instructed

### Railway
1. Go to Service Settings → Networking
2. Add custom domain (current: `your-app.up.railway.app`)
3. Update DNS records as instructed

## Step 5: Configure External Services

### Stripe Setup
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard → Developers → API Keys
3. Set up webhook endpoint: `https://your-app.up.railway.app/api/v1/webhooks/stripe`
4. Add webhook signing secret to Railway

### SendGrid Setup
1. Create SendGrid account at https://sendgrid.com
2. Create API Key with Mail Send permissions
3. Verify sender domain
4. Add API key to Railway

### Twilio Setup
1. Create Twilio account at https://twilio.com
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add credentials to Railway

### Google Maps Setup
1. Go to Google Cloud Console
2. Enable Maps JavaScript API
3. Create API Key with restrictions
4. Add to Railway and Vercel

## Local Development with Docker

For local development with the same setup as production:

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
cd packages/flexdesk-server
pnpm run db:migrate

# Start development servers
pnpm run dev:server   # Backend on :3001
pnpm run dev:admin    # Admin on :3000
pnpm run dev:preview  # Preview on :5173
```

## Troubleshooting

### Build Fails on Railway
- Check that root directory is set to `packages/flexdesk-server`
- Verify Node.js version >= 20
- Check build logs for missing dependencies

### CORS Errors
- Verify `CORS_ORIGIN` includes your frontend domains
- Include protocol: `https://` not just domain

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check Railway PostgreSQL service is running
- Run `npx prisma migrate deploy` if tables missing

### Frontend Can't Connect to API
- Verify `NEXT_PUBLIC_API_URL` or `VITE_API_URL` is set
- Check API health endpoint is responding
- Verify CORS is configured for your domain

### Git Submodule Warning on Vercel
- If you see "Warning: Failed to fetch one or more git submodules" during Vercel builds, this is safe to ignore
- The "twenty" submodule is not used in frontend builds and is excluded from compilation
- The warning occurs during git clone but does not affect the build process
- To remove the warning, you can remove the submodule from `.gitmodules` if it's not needed for local development

## Cost Estimates

### Railway (Backend)
- Hobby: $5/month (enough for starting)
- Pro: $20/month (better for production)
- PostgreSQL: ~$5-15/month based on storage

### Vercel (Frontend)
- Hobby: Free (3 projects)
- Pro: $20/month (unlimited projects)

### External Services
- Stripe: 2.9% + $0.30 per transaction
- SendGrid: Free up to 100 emails/day
- Twilio: ~$0.0079/SMS
- Google Maps: 10k free loads/month

**Total starting cost: ~$5-10/month**
