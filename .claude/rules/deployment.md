---
paths:
  - "scripts/deploy.sh"
  - ".github/workflows/**"
  - "Dockerfile"
  - "nginx/**"
---

# Deployment

The pipeline is `local → GitHub → VPS`, fully automated on merge
to `main`.

## What gets deployed

`main` push triggers `.github/workflows/deploy.yml`, which:

1. SSHs to `185.230.64.48` as `root` (key auth, no passwords).
2. Runs `./deploy.sh` in the project directory.
3. `deploy.sh` does: `git pull` → `npm ci` → `npm run build` →
   `pm2 restart centfolio`.
4. PocketBase is its own systemd service, never restarted by
   `deploy.sh`. Schema changes are applied manually.

## What never gets deployed

- Anything tested only locally.
- Anything that hasn't passed CI.
- Anything committed directly to `main`.

## Environment

- `.env.local` lives on the VPS at `/opt/centfolio/.env.local`,
  permission `600`, owned by the deploy user.
- `.env.example` is the source of truth for *what variables exist*.
  Update it any time you add a new env var.
- Never echo or log env variable values, even at debug level.

## OAuth redirect URIs

GoCardless requires environment-specific redirect URIs:

- Local: `http://localhost:3000/api/gocardless/callback`
- Production: `https://centfolio.labrium.online/api/gocardless/callback`

Both are registered in GoCardless's dashboard. The app reads from
`process.env.NEXT_PUBLIC_APP_URL` to know which to send.

## Rollback

If a deploy goes bad:

1. `git revert <bad commit>` on `main` → triggers a clean deploy.
2. If urgent and revert is messy, SSH to VPS and `git checkout
   <last-good-sha>` + manual `pm2 restart` to buy time, then fix
   forward properly.

The second path is the *only* sanctioned reason to touch the VPS
directly, and it must be followed by a proper forward fix within
the same day.

## DNS / SSL

- DNS records live in Hostinger's DNS panel.
- SSL cert is managed by Certbot (Let's Encrypt) and auto-renews.
  If renewal fails, Certbot emails the registered address.
- Nginx config at `/etc/nginx/sites-available/centfolio.labrium.online`.
  Any change there is committed to `nginx/centfolio.conf` in this
  repo and applied manually on the VPS.
