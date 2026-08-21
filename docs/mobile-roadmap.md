# Fitness PT Tracker Mobile Roadmap

This plan defines the native iOS and Android mobile app for Fitness PT Tracker. The app will not use Expo or EAS. Builds will run on the remote MacBook with Xcode, Gradle, and the standard React Native CLI/native toolchain.

## Product Goal

Deliver a fast, reliable mobile companion for clients and personal trainers to manage the full training session lifecycle from their phones: book, confirm, cancel, check in, log workouts, view progress, and receive reminders.

The mobile app should feel like a focused operational tool, not a marketing wrapper around the website. The web app remains the admin-heavy console; the mobile app prioritizes daily trainer/client workflows.

## Implementation Status

- React Native CLI app has been scaffolded under `mobile/` with bundle/package ID `ng.myapps.fitness`.
- Phase 1 mobile auth is implemented through `/api/mobile/auth/*`, `/api/mobile/me`, and the `MobileSession` database model.
- Phase 2 appointment MVP is implemented for dashboard, appointment list/detail, booking API, confirm/cancel status updates, and role ownership checks.
- Phase 3 check-in and workout logging are implemented; the native MVP includes GPS check-in and trainer workout logging.
- Phase 4 progress is partially implemented for client measurement summary and workout history; push notifications remain future work.
- Remote MacBook Android debug and iOS simulator builds are validated with Xcode 16.2 and the iOS 18.2 simulator runtime.

## Recommended Build Approach

- Framework: React Native CLI with TypeScript, not Expo.
- Build host: remote MacBook for iOS and Android builds.
- Backend: existing Next.js app remains the API/backend and web admin surface.
- Authentication: add mobile-specific API authentication with secure refresh sessions, separate from browser-only NextAuth page flow.
- Release path: Android APK/AAB from Gradle; iOS simulator/TestFlight builds from Xcode or Fastlane on the MacBook.

## User Roles

- Client: book sessions, review schedule, cancel appointments, check in at the gym, view measurements and workout history.
- Trainer: see assigned appointments, confirm/cancel sessions, perform manual check-ins where allowed, log workouts, review client progress.
- Admin: mobile read-only MVP view for operational visibility; full admin management stays in the web console unless there is a clear mobile need.

## MVP Scope

1. Authentication
   - Email credential mobile sign-in.
   - Secure refresh session storage in Keychain/Keystore.
   - Sign out and session expiry handling.

2. Dashboard
   - Role-aware home screen.
   - Upcoming/recent appointment summary.
   - Completion/no-show stats where useful.

3. Appointments
   - List assigned/client appointments.
   - Detail screen with client/trainer, location, status, and time.
   - Book appointment as client.
   - Confirm appointment as trainer.
   - Cancel pending/confirmed/rescheduled appointment as client or trainer.

4. Gym Check-In
   - Native location permission flow.
   - GPS check-in against gym radius.
   - Manual check-in flow for trainers/admin-authorized cases.

5. Workout Logs
   - Trainer workout logging after a session.
   - Client workout history view.

6. Progress
   - Client measurement summary.
   - Simple progress trend chart.
   - Trainer/admin add-measurement flow if authorized.

7. Notifications
   - Phase 1: in-app reminder indicators.
   - Phase 2: push notifications through APNs/FCM after native app identifiers are stable.

## API Work Required

Create `/api/mobile/*` endpoints so the native app does not depend on browser cookies or HTML-oriented auth redirects.

- `POST /api/mobile/auth/login`: validate credentials and issue mobile session pair.
- `POST /api/mobile/auth/refresh`: rotate refresh session and return a new access session.
- `POST /api/mobile/auth/logout`: revoke the current refresh session.
- `GET /api/mobile/me`: current user profile and role.
- `GET /api/mobile/dashboard`: role-scoped dashboard summary.
- `GET /api/mobile/appointments`: role-scoped appointment list.
- `GET /api/mobile/appointments/:id`: appointment detail.
- `POST /api/mobile/appointments`: client booking.
- `PATCH /api/mobile/appointments/:id/status`: confirm/cancel/no-show rules.
- `POST /api/mobile/appointments/:id/checkin`: native GPS check-in.
- `POST /api/mobile/appointments/:id/workout`: trainer workout log.
- `GET /api/mobile/progress`: role-scoped measurement/progress data.

Security requirements:

- Store no credentials in app source.
- Access sessions should be short-lived.
- Refresh sessions should be revocable and stored hashed server-side.
- Enforce the same role ownership checks as the existing web API.
- Rate-limit mobile login and refresh endpoints before production release. Implemented with a process-local fixed-window limiter for the current Docker runtime.

## Native App Architecture

Suggested folders after React Native CLI initialization:

```text
mobile/
  android/
  ios/
  src/
    api/
    auth/
    components/
    features/
      appointments/
      checkin/
      dashboard/
      progress/
      workouts/
    navigation/
    theme/
    types/
```

Core libraries to evaluate during implementation:

- Navigation: React Navigation.
- Secure storage: `react-native-keychain`.
- Data fetching/cache: TanStack Query.
- Forms: React Hook Form and Zod.
- Maps/location: native geolocation or a maintained React Native location package.
- Charts: lightweight native chart library after progress screen requirements are final.

## Remote MacBook Build Plan

Prerequisites on the MacBook:

- Xcode installed and licensed.
- CocoaPods installed.
- Android Studio/SDK installed.
- Java version compatible with the selected React Native version.
- Node.js version pinned with `.nvmrc` or Volta.
- SSH access from the Windows workstation.

Build workflow:

1. Sync or clone the `fitness-app` repository on the MacBook.
2. Check out the mobile feature branch.
3. Install root and mobile dependencies.
4. Run TypeScript and unit checks on Windows or MacBook.
5. Build Android with Gradle from `mobile/android`.
6. Build iOS from `mobile/ios` using `xcodebuild` or Fastlane.
7. Export artifacts to a shared build directory and copy them back to Windows if needed.

Recommended first automation script:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$HOME/Developer/fitness-app/mobile"
npm ci
npm run typecheck
npm run test -- --runInBand || true
cd android
./gradlew assembleDebug
cd ../ios
pod install
xcodebuild -workspace FitnessPTTracker.xcworkspace -scheme FitnessPTTracker -configuration Debug -sdk iphonesimulator build
```

## Delivery Phases

### Phase 0: Planning and Build Foundation

- Finalize product scope and native architecture.
- Confirm remote MacBook build prerequisites.
- Create React Native CLI project.
- Produce Android debug APK and iOS simulator build.
- Recommended model/agent: GPT-5.5 or GPT-5.3-Codex.

### Phase 1: Mobile Auth and Session Layer

- Add mobile auth/session database model or server-side session table.
- Implement mobile login, refresh, logout, and `/me` endpoints.
- Add native secure storage and authenticated API client.
- Recommended model/agent: GPT-5.5.

### Phase 2: Client/Trainer Appointment MVP

- Native dashboard.
- Appointment list/detail.
- Booking, confirm, and cancellation.
- Recommended model/agent: GPT-5.3-Codex or Kimi K2.7 Code.

### Phase 3: Check-In and Workout Logging

- Native location check-in.
- Trainer manual check-in where allowed.
- Workout log creation and history views.
- Recommended model/agent: GPT-5.5.

### Phase 4: Progress and Notifications

- Native progress summaries and trend charts.
- APNs/FCM registration and push reminders.
- Notification preference settings.
- Recommended model/agent: GPT-5.5.

### Phase 5: Release Readiness

- App icons, splash screens, app store metadata.
- Accessibility pass.
- Device testing matrix.
- TestFlight and Play internal testing.
- Recommended model/agent: GPT-5.5.

## Open Decisions

- Whether to keep admin features web-only for the first mobile release.
- Whether push notifications should replace or supplement email reminders.
- Whether payment/subscription features belong in the fitness app later.
- Exact Apple Developer and Google Play account ownership for release.
- Whether Fastlane should manage signing and store upload automation.

## Acceptance Criteria

- Android debug APK builds successfully on the remote MacBook.
- iOS simulator build succeeds on the remote MacBook.
- Client can sign in, book, cancel, check in, and view progress.
- Trainer can sign in, view assigned appointments, confirm/cancel, check in manually, and log workouts.
- Mobile API authorization matches web role ownership rules.
- No credentials or signing assets are committed to Git.