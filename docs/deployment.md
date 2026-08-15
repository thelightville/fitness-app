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

This builds the app, starts PostgreSQL, runs migrations/seeds, and registers metadata with the hosting API.

### CT117 Notes

- The app binds to `HOST_PORT` (default `8054`) on `172.16.16.117`.
- Outbound email uses the internal SMTP gateway at `172.16.16.125:587` (no auth required).
- Cloudflare DNS CNAME and PVE tunnel routes must point `fitness.myapps.com.ng` to `http://172.16.16.117:8054`.
- The deploy script saves `.hosting-meta.json` for the provisioning API.

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

## Backup

Back up the PostgreSQL database regularly:

```bash
docker compose exec db pg_dump -U fitness_user fitness_db > fitness_db_backup.sql
```
