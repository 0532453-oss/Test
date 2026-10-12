# Security TODO: Git History Cleanup

## Problem

Several `.env` files containing development secrets were committed in bulk commits
during early development. While these files have since been removed from the working
tree (and added to `.gitignore`), the secrets still exist in the git history.

### Commits that introduced secrets

- Initial bulk commits that included `packages/flexdesk-server/.env` and other
  environment files with development-time credentials.
- Use `git log --all --full-history -- "**/.env"` to identify the exact commit SHAs.

## Secrets requiring rotation

After cleaning git history, rotate the following secrets immediately:

- `JWT_SECRET`
- `JOB_TOKEN_SECRET`
- `CUSTOMER_PORTAL_SECRET`
- `DATABASE_URL` (contains database password)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `TWILIO_AUTH_TOKEN`
- Any other credentials that appeared in committed `.env` files

## Recommended cleanup: BFG Repo Cleaner

**Do NOT run these commands without coordinating with all contributors first.**

```bash
# 1. Create a full backup
git clone --mirror git@github.com:YOUR_ORG/FlexDesk.git flexdesk-backup.git

# 2. Run BFG to remove .env files from history
bfg --delete-files .env

# 3. Clean up and garbage collect
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push (requires coordination with all contributors)
git push --force
```

After force-pushing, all contributors must re-clone the repository. Old clones will
still contain the secrets in their local history.

## Important notes

- Treat all secrets that ever appeared in git history as compromised.
- Rotate secrets BEFORE publishing the cleaned history.
- Consider using a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault)
  going forward to avoid hardcoding secrets in environment files.
