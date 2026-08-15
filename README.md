# Fitness PT Tracker

Personal Trainer Appointment Tracking app for [fitness.myapps.com.ng](https://fitness.myapps.com.ng).

## What It Does

Fitness PT Tracker helps personal trainers and clients schedule, confirm, attend, and record gym sessions. It keeps both sides aligned with transparent records, reminders, location check-in, workout logging, and analytics.

## Features

- **User roles:** Client, Personal Trainer, Admin
- **Appointment scheduling:** book, confirm, reschedule, cancel, complete
- **Calendar integration:** download `.ics` invites
- **Reminders:** automated email reminders before sessions
- **Location check-in:** verify the client is at the gym via browser geolocation
- **Workout logging:** record workout type, exercises, duration, intensity, and notes
- **Dashboard analytics:** attendance trends, no-show rates, trainer utilization, workout breakdown
- **Audit logs:** track who changed what and when

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- NextAuth v5
- Tailwind CSS
- Recharts

## Quick Start

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Seed accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@fitness.myapps.com.ng` | `AdminPass123!` |
| Trainer | `trainer@fitness.myapps.com.ng` | `TrainerPass123!` |
| Client | `client@fitness.myapps.com.ng` | `ClientPass123!` |

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Contributing](CONTRIBUTING.md)

## Credits

Developed by Waju.

## License

MIT

