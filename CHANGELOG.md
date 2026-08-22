# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Restored reliable production sign-in by running Prisma with the binary query engine and a CT117-compatible app container runtime.
- Restored public page freshness for `/`, `/login`, and `/register` by forcing dynamic rendering and no-store headers.
- Improved dashboard dark-mode contrast so appointment details, navigation, cards, labels, and supporting text remain readable.
- Updated CT117 Docker Compose runtime networking so the app uses the internal Postgres service and remains published on port `8054`.
- Updated trainer dashboards and appointment actions so assigned appointments remain visible and pending appointments can be cancelled by either party.

### Added

- Native React Native CLI mobile app under `mobile/` with login, secure session storage, dashboard, appointment actions, and GPS check-in.
- Mobile API surface under `/api/mobile/*` with hashed revocable mobile sessions, refresh rotation, rate-limited auth, role-scoped appointment/dashboard access, progress data, and workout logging.
- Android release builds now require non-committed upload signing inputs instead of falling back to `debug.keystore`.
- Native iOS/Android mobile product roadmap and remote MacBook build plan.
- Client progress tracking: admins and trainers can record client measurements (weight, body fat, waist, chest, arms) with notes and date.
- Admin client measurements page at `/dashboard/admin/clients/[id]/measurements` with history table and weight trend chart.
- Client-facing progress page at `/dashboard/measurements` with latest stats, trend chart, and full measurement history.
- Admin management page at `/dashboard/admin/admins`: create admins, reset passwords, deactivate accounts (self-deactivation blocked).
- Account settings page at `/dashboard/settings` for all users to change their own password.
- New API routes:
  - `GET /api/clients/[id]/measurements`
  - `POST /api/clients/[id]/measurements`
  - `DELETE /api/clients/[id]/measurements/[measurementId]`
  - `GET /api/me/measurements`
  - `PATCH /api/me`
  - `GET /api/admin/users/[id]`
  - `GET /api/admin/admins`
  - `POST /api/admin/admins`
  - `PATCH /api/admin/admins`
  - `DELETE /api/admin/admins`
- "Progress" link in the dashboard navigation for clients.
- "Settings" link in the dashboard navigation for all users.
- "Admins" link in the admin sub-navigation.
- "View progress" action in the admin clients list.

## [0.1.0] - 2026-08-12

### Added

- Initial release of Fitness PT Tracker with appointment scheduling, check-in, workout logging, reminders, admin management, and dark mode.
