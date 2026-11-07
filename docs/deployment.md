# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- SMTP credentials for email reminders
- Domain `fitness.myapps.com.ng` pointed to your server

## Local Development

```bash
cp .env.example .env
# Update DATABASE_URL and SMTP_* values
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000 and log in with seed credentials:

- Admin: `admin@fitness.myapps.com.ng` / `AdminPass123!`
- Trainer: `trainer@fitness.myapps.com.ng` / `TrainerPass123!`
- Client: `client@fitness.myapps.com.ng` / `ClientPass123!`

## Docker Production

```bash
docker compose up -d --build
```

This starts the Next.js app and PostgreSQL. The first time, run migrations:

```bash
docker compose exec app npx prisma migrate deploy
```

## CT117 Docker Hosting Platform

For deployment on Thelightville's CT117 Docker host:

1. Ensure the site directory exists:
   ```bash
   mkdir -p /opt/docker-sites/fitness.myapps.com.ng
   cd /opt/docker-sites/fitness.myapps.com.ng
   git clone https://github.com/thelightville/fitness-app.git .
   ```

2. Copy and configure the production environment:
   ```bash
   cp .env.ct117.example .env
   # Edit .env and set strong passwords/secrets
   ```

3. Run the deploy script:
   ```bash
   ./scripts/deploy-ct117.sh
   ```

This builds the app, starts PostgreSQL, runs migrations, and registers metadata with the hosting API.

### CT117 Notes

- The app binds to `HOST_PORT` (default `8054`) on `172.16.16.117`.
- Outbound email uses the internal SMTP gateway at `172.16.16.125:587` (no auth required).
- Cloudflare DNS CNAME and PVE tunnel routes point `fitness.myapps.com.ng` to `http://172.16.16.117:8054`.
- The deploy script saves `.hosting-meta.json` for the provisioning API.
- A cron job in `/etc/cron.d/fitness-reminders` calls `/api/cron/reminders` every 5 minutes.

### CT117 Deployment Status

| Component | Status |
|-----------|--------|
| App container | Healthy on `0.0.0.0:8054` |
| Database | Healthy, migrations applied |
| Public URL | https://fitness.myapps.com.ng |
| DNS CNAME | `fitness.myapps.com.ng` â†’ Cloudflare tunnel |
| Tunnel route | `fitness.myapps.com.ng` â†’ `http://172.16.16.117:8054` |
| Reminder cron | Every 5 minutes |
| Hosting meta | `/opt/docker-sites/fitness.myapps.com.ng/.hosting-meta.json` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Public app URL |
| `NEXTAUTH_SECRET` | Random secret for JWT/session signing |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | From address for emails |
| `APP_URL` | Public app URL |
| `APP_NAME` | App display name |

## Reverse Proxy

Place the app behind a reverse proxy (e.g., Nginx, Kariya, or Cloudflare) with HTTPS for `fitness.myapps.com.ng`.

## One-studio pilot candidate

The pilot uses the existing web API and Android client. Build from a clean checkout using the Node image pinned in `Dockerfile.pilot`:

```bash
revision=$(git rev-parse HEAD)
docker build -f Dockerfile.pilot --build-arg FITNESS_BUILD_REVISION="$revision" -t "fitness-pilot:$revision" .
```

The pilot workflow runs the production web image against PostgreSQL using synthetic accounts. It also builds a test-signed Android APK with package ID `ng.myapps.fitness.pilot` and records its commit and checksum. The APK can be installed alongside the Play app. It is separate from Play distribution, uses the app's existing API origin, and must only be used for the pilot after the corresponding backend is available. Play builds require the existing upload key and a separately verified version code.

Before activating an upgraded deployment, confirm the production migration ledger, take a backup and rehearse restoring it on a disposable database. Retain the prior image and configuration. Run `npm run db:deploy` from the reviewed revision with the deployment database connection. The migration preserves existing records and leaves all previously created trainers unapproved. In **Manage Trainers**, explicitly approve each verified pilot trainer and select their assigned clients. Existing appointment history does not create an assignment. Verify the active demo accounts and remove or rotate any documented defaults before inviting participants.

The November dashboard, measurements and appointment-save patches are now built from source. The original source and review evidence for those changes remains in the Fitness and hosting pull requests. Retain the preceding immutable static assets during cutover until already-open tabs are exercised. Rollback to the old image can restore the original access flaw, so use a verified secured release or pause service if rollback would otherwise reintroduce it.

## Backup

Back up the PostgreSQL database regularly:

```bash
docker compose exec db pg_dump -U fitness_user fitness_db > fitness_db_backup.sql
```
