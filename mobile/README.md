# Fitness PT Tracker Mobile

Native iOS and Android app for Fitness PT Tracker. This app uses React Native CLI with TypeScript. It does not use Expo or EAS.

## Current Scope

- Email/password mobile sign-in against `https://fitness.myapps.com.ng/api/mobile/auth/login`.
- Secure session persistence with Keychain/Keystore through `react-native-keychain`.
- Role-aware dashboard summary for clients, trainers, and admins.
- Appointment list and detail view.
- Trainer appointment confirmation.
- Client/trainer appointment cancellation before or after confirmation where the backend allows it.
- Native GPS appointment check-in through `@react-native-community/geolocation`.
- Automatic access-session refresh using the mobile refresh session.
- Client progress tab for latest measurements and workout history.
- Trainer workout logging from appointment detail.

## Local Commands

```bash
npm install
npm run typecheck
npm start
npm run android
npm run ios
```

The app requires Node.js `>=22.11.0`.

## Remote MacBook Build

Builds are expected to run on the remote MacBook rather than Expo cloud services.

The installed iOS simulator runtime must match the active Xcode SDK. The validated MacBook build uses Xcode 16.2 with the iOS 18.2 simulator runtime.

```bash
source "$HOME/Developer/scripts/mobile-ci-env.sh"
cd "$HOME/Developer/NativeBuilds/fitness-app/mobile"
npm ci
npm run typecheck
cd android
./gradlew assembleDebug
cd ../ios
pod install
xcodebuild -workspace FitnessPTTracker.xcworkspace -scheme FitnessPTTracker -configuration Debug -sdk iphonesimulator build
```

Adjust the checkout path if the repository is cloned elsewhere on the MacBook.

## Android Release Signing

Release builds must be signed with a non-committed upload keystore. The Gradle release build intentionally fails if the signing inputs are missing, so release artifacts are never produced with `debug.keystore`.

Set these on the build host or pass them as Gradle properties:

```bash
export FITNESS_UPLOAD_STORE_FILE="$HOME/Developer/secrets/fitness-upload.keystore"
export FITNESS_UPLOAD_KEY_ALIAS="fitness-upload"
export FITNESS_UPLOAD_STORE_PASSWORD="<enter locally>"
export FITNESS_UPLOAD_KEY_PASSWORD="<enter locally>"
export FITNESS_ANDROID_VERSION_CODE="1"
export FITNESS_ANDROID_VERSION_NAME="1.0.0-beta.1"

cd "$HOME/Developer/NativeBuilds/fitness-app/mobile/android"
./gradlew bundleRelease
```

Do not commit the keystore file, passwords, or generated release artifacts.

## iOS Release Signing

Archive from the remote MacBook with the Apple Developer account configured in Xcode. Keep provisioning profiles and export options outside git.

```bash
source "$HOME/Developer/scripts/mobile-ci-env.sh"
cd "$HOME/Developer/NativeBuilds/fitness-app/mobile/ios"
pod install
xcodebuild archive -workspace FitnessPTTracker.xcworkspace -scheme FitnessPTTracker -configuration Release -destination "generic/platform=iOS" -archivePath "$HOME/Developer/Builds/FitnessPTTracker.xcarchive"
```

Use Xcode Organizer or a non-committed export options plist to upload the archive to TestFlight.

## Backend Contract

The mobile app calls the dedicated mobile API surface in the Next.js backend:

- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/refresh`
- `POST /api/mobile/auth/logout`
- `GET /api/mobile/me`
- `GET /api/mobile/dashboard`
- `GET /api/mobile/appointments`
- `GET /api/mobile/appointments/:id`
- `POST /api/mobile/appointments`
- `PATCH /api/mobile/appointments/:id/status`
- `POST /api/mobile/appointments/:id/checkin`
- `POST /api/mobile/appointments/:id/workout`
- `GET /api/mobile/progress`

Mobile access sessions are short-lived opaque bearer tokens. Refresh credentials are stored only as hashes in the backend database, and mobile login/refresh endpoints are rate limited in the app process.

## Security Notes

- Do not commit signing certificates, provisioning profiles, keystores, or passwords.
- `npm audit` currently reports React Native Metro advisories caused by `image-size`; the latest published `image-size` version is still in the vulnerable range, and npm's suggested forced fix would downgrade React Native/Metro across incompatible major versions.
- Keep React Native and Metro pinned until an upstream compatible security release is available.