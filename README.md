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
- **Progress tracking:** log and visualize client measurements (weight, body fat, waist, chest, arms) over time
- **Dashboard analytics:** attendance trends, no-show rates, trainer utilization, workout breakdown
- **Native mobile app:** React Native CLI iOS/Android client for sign-in, dashboards, appointment actions, and gym check-in
- **Admin management:** full CRUD for clients, trainers, and gym locations
- **Dark mode:** system-aware theme toggle
- **Audit logs:** track who changed what and when

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- NextAuth v5
- Tailwind CSS
- Recharts
- React Native CLI mobile app under `mobile/`

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
| Admin | `admin@fitness.myapps.com.ng` | `Thelightville123.` |
| Trainer | `trainer@fitness.myapps.com.ng` | `TrainerPass123!` |
| Client | `client@fitness.myapps.com.ng` | `ClientPass123!` |

### Admin access

1. Go to `/login`
2. Sign in with the Admin email and password above
3. The Admin dashboard is at `/dashboard/admin`

Admins can:

- View analytics and reports
- Manage clients (`/dashboard/admin/clients`): add, edit, deactivate
- Track client progress (`/dashboard/admin/clients/:id/measurements`): record weight, body fat, waist, chest, arms, and notes
- Manage trainers (`/dashboard/admin/trainers`): add, edit, deactivate, set bio/specialties
- Manage gym locations (`/dashboard/admin/gyms`): add, edit, remove, set check-in radius
- Manage administrators (`/dashboard/admin/admins`): create admins, reset passwords, deactivate accounts
- Manage all appointments

All logged-in users can change their own password from `/dashboard/settings`.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Mobile Roadmap](docs/mobile-roadmap.md)
- [Mobile App](mobile/README.md)
- [Google Play Store Assets](mobile/store-assets/play/README.md)
- Public web graphics: original free fitness assets live in `public/images/` and are used by the homepage hero and training-flow sections.
- Public review pages: `/privacy`, `/support`, and `/account-deletion`
- [Contributing](CONTRIBUTING.md)

### Dark mode

Click the sun/moon icon in the dashboard navigation to switch between light, dark, and system themes.

## Credits

Developed by Waju.

## License

MIT

