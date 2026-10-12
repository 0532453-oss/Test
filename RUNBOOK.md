# FlexDesk Production Runbook

## Common Alerts & Responses

### Server Down (Health Check Failing)

1. Check Railway dashboard for recent deploys or crashes
2. View logs: `railway logs --tail 100`
3. If crash loop: check for missing env vars or DB connection issues
4. If OOM: restart service, consider scaling instance size
5. Manual restart: Railway dashboard → Service → Restart

### Database Connection Errors

1. Check Neon dashboard for service status
2. Verify `DATABASE_URL` env var is correct
3. Check connection limits: `SELECT count(*) FROM pg_stat_activity;`
4. If connection pool exhausted: restart the service (releases connections)
5. Verify `DIRECT_URL` is set for migrations (bypasses connection pooler)

### High Error Rate

1. Check Sentry for error details and stack traces
2. Review recent deploys: `git log --oneline -10`
3. If correlated with a deploy: rollback (see Rollback Procedure below)
4. Check Railway logs for patterns: `railway logs --tail 500 | grep ERROR`

### Stripe Webhook Failures

1. Check Stripe Dashboard → Developers → Webhooks for failed events
2. Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint secret
3. Check server logs for "Webhook signature verification failed"
4. Retry failed events from Stripe Dashboard

---

## Database Operations

### Run Migrations

```bash
# Via Railway CLI
railway run pnpm prisma migrate deploy

# Or SSH into service
railway shell
npx prisma migrate deploy
```

### Connect to Production Database

```bash
# Using connection string from Railway
psql $DATABASE_URL

# Or via Neon dashboard SQL editor
```

### Create a Database Backup

```bash
# Using pg_dump with the production DATABASE_URL
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Neon also provides point-in-time restore via dashboard
```

### Seed Production Data

```bash
railway run pnpm prisma db seed
```

---

## Rollback Procedure

### Rollback Railway Deploy

1. Go to Railway dashboard → Service → Deployments
2. Find the last known good deployment
3. Click "Redeploy" on that deployment
4. Verify health check passes: `curl https://your-api.railway.app/api/v1/health`

### Rollback Vercel Deploy

1. Go to Vercel dashboard → Project → Deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"
4. Verify the frontend loads correctly

### Rollback Database Migration

```bash
# Check current migration status
railway run npx prisma migrate status

# To revert, create a new migration that undoes the changes
# (Prisma does not support automatic rollback)
# Write a manual SQL rollback:
railway run npx prisma db execute --file rollback.sql
```

---

## Scaling Guide

### Vertical Scaling (Railway)

1. Railway dashboard → Service → Settings → Instance
2. Increase memory/CPU allocation
3. Redeploy to apply changes

### Database Scaling (Neon)

1. Neon dashboard → Project → Settings
2. Adjust compute size or enable autoscaling
3. Update `connection_limit` in `DATABASE_URL` if needed

### Current Limits

| Resource | Free Tier | Pro Tier |
|----------|-----------|----------|
| Railway compute | 500 hrs/mo | Unlimited |
| Neon compute | 190 hrs/mo | 300 hrs/mo |
| Neon storage | 512 MB | 10 GB |
| Vercel bandwidth | 100 GB/mo | 1 TB/mo |
| SendGrid emails | 100/day | 50K/mo |

---

## Secret Rotation

### Rotate JWT_SECRET

1. Generate new secret: `openssl rand -base64 64`
2. Update `JWT_SECRET` in Railway env vars
3. **Warning**: This invalidates all existing tokens — users will need to re-login
4. Update `JWT_REFRESH_SECRET` similarly
5. Redeploy the service

### Rotate Stripe Keys

1. Go to Stripe Dashboard → Developers → API Keys
2. Roll the secret key (Stripe provides a grace period for old key)
3. Update `STRIPE_SECRET_KEY` in Railway env vars
4. Update `STRIPE_WEBHOOK_SECRET` if rotating webhook endpoint
5. Redeploy the service
6. Verify webhook events are processing

### Rotate Google OAuth Credentials

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create new OAuth 2.0 Client ID (or regenerate secret)
3. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway env vars
4. Redeploy the service
5. Verify Google login flow works

### Rotate SendGrid API Key

1. Go to SendGrid → Settings → API Keys
2. Create a new API key with same permissions
3. Update `SENDGRID_API_KEY` in Railway env vars
4. Delete the old API key in SendGrid
5. Redeploy and verify emails send correctly

### Rotate Twilio Credentials

1. Go to Twilio Console → Account → API Keys
2. Create new API key or regenerate Auth Token
3. Update `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in Railway env vars
4. Redeploy and verify SMS sends correctly
