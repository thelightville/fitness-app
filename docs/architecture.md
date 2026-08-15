# Fitness App Architecture

## Overview

The Fitness PT Tracker is a Next.js full-stack application using PostgreSQL for persistence. It supports three roles: Client, Personal Trainer, and Admin.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** NextAuth v5 (Auth.js) with credentials provider
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Email:** Nodemailer over SMTP
- **Calendar:** ICS file generation
- **Location:** Browser Geolocation API + haversine distance calculation

## Project Structure

```
src/
  app/              # Next.js app router pages and API routes
  components/       # Shared React components
  lib/              # Utilities, Prisma client, auth config
  types/            # Shared TypeScript types
docs/               # Documentation
prisma/             # Database schema and seed
```

## Data Model

See [prisma/schema.prisma](../prisma/schema.prisma) for the full schema.

Key entities:

- **User** — authentication and role.
- **Client / Trainer** — role-specific profiles.
- **GymLocation** — gym coordinates and check-in radius.
- **TrainerAvailability** — recurring weekly availability.
- **Appointment** — the core booking record with status lifecycle.
- **AppointmentCheckIn** — location-verified check-in evidence.
- **WorkoutLog** — session details logged by the PT.
- **Reminder** — scheduled email/SMS reminders.
- **AuditLog** — record of status changes and sensitive actions.

## Appointment Status Lifecycle

```
PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED
   |          |
   v          v
CANCELLED  RESCHEDULED
   |
   v
NO_SHOW
```

- Client creates appointment -> `PENDING`
- Trainer confirms -> `CONFIRMED`
- Client checks in at gym -> `CHECKED_IN`
- Trainer logs workout -> `COMPLETED`
- Trainer or client cancels -> `CANCELLED`
- Trainer marks missed -> `NO_SHOW`

## Location Check-In

The client browser requests geolocation. The server calculates the haversine distance between the reported coordinates and the configured `GymLocation`. If the distance is within `checkInRadiusMeters`, the check-in is marked `verified`.

PTs and admins can manually override check-in with a reason, which is recorded in the audit log.

## Reminders

A scheduled job queries `Reminder` records where `status = SCHEDULED` and `scheduledFor <= now()`, sends the email, and updates the record. Reminders are created when an appointment is confirmed.

## Calendar Integration

Each appointment detail page offers a downloadable `.ics` file generated with the `ics` library. Two-way calendar sync can be added later using Google Calendar API or Microsoft Graph.

## Deployment

The app is containerized with Docker and can be deployed behind any reverse proxy. See [deployment.md](deployment.md) for details.
