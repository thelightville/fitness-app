# Fitness PT Tracker Mobile

Expo React Native shell for Fitness PT Tracker on iOS and Android.

## What It Does

The first mobile release loads the production Fitness PT Tracker web app at `https://fitness.myapps.com.ng` inside a native WebView. This keeps login, appointments, cancellation, check-in, workout logs, progress tracking, and admin screens aligned with the live web product while giving us a packaged iOS/Android app.

## Requirements

- Node.js 22.13.x or newer for Expo SDK 57
- Expo account for EAS builds
- Android Studio for local Android emulator runs
- macOS/Xcode for local iOS simulator runs, or EAS for cloud iOS builds

## Development

```bash
cd mobile
npm install
npm run start
```

Run on a target:

```bash
npm run android
npm run ios
```

## Builds

Use EAS for installable mobile builds:

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile production --platform all
```

Google Play distribution requires a Google Play Developer account. App Store/TestFlight distribution requires Apple Developer Program access.

## Native App Details

- App name: Fitness PT Tracker
- iOS bundle identifier: `ng.myapps.fitness`
- Android package: `ng.myapps.fitness`
- URL scheme: `fitnesspt://`
- Allowed in-app hostnames: `fitness.myapps.com.ng`, `www.fitness.myapps.com.ng`
- Location permission is enabled for gym check-in verification.

## Next Native Phase

The next phase should replace selected WebView flows with native screens backed by mobile API endpoints:

- Native mobile sign-in with secure session storage
- Native appointment list/detail/cancel actions
- Native check-in flow using Expo Location
- Push notifications for reminders
- Native progress charts