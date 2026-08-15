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
