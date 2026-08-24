#!/usr/bin/env bash
set -euo pipefail

# Exports a signed iOS archive to an App Store Connect IPA on the MacBook build host.
# Signing credentials and keychain passwords stay in MacBook-local files outside git.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
BUILD_DIR="${FITNESS_BUILD_DIR:-${HOME}/Developer/Builds/fitness}"
ARCHIVE_PATH="${FITNESS_IOS_ARCHIVE_PATH:-${BUILD_DIR}/FitnessPTTracker.xcarchive}"
EXPORT_PATH="${FITNESS_IOS_EXPORT_PATH:-${BUILD_DIR}/ios-export}"
EXPORT_OPTIONS_PLIST="${FITNESS_IOS_EXPORT_OPTIONS_PLIST:-${BUILD_DIR}/FitnessPTTracker-exportOptions.plist}"
EXPORT_METHOD="${FITNESS_IOS_EXPORT_METHOD:-app-store-connect}"
BUNDLE_ID="${FITNESS_IOS_BUNDLE_ID:-ng.myapps.fitness}"

if [[ -z "${FITNESS_IOS_DEVELOPMENT_TEAM:-}" ]]; then
  echo "FITNESS_IOS_DEVELOPMENT_TEAM is required" >&2
  exit 1
fi
if [[ -z "${FITNESS_IOS_PROVISIONING_PROFILE_SPECIFIER:-}" ]]; then
  echo "FITNESS_IOS_PROVISIONING_PROFILE_SPECIFIER is required" >&2
  exit 1
fi

if [[ -n "${FITNESS_IOS_CODE_SIGN_KEYCHAIN:-}" && -n "${FITNESS_IOS_CODE_SIGN_KEYCHAIN_PASSWORD_FILE:-}" ]]; then
  KEYCHAIN_PASSWORD="$(cat "${FITNESS_IOS_CODE_SIGN_KEYCHAIN_PASSWORD_FILE}")"
  security unlock-keychain -p "${KEYCHAIN_PASSWORD}" "${FITNESS_IOS_CODE_SIGN_KEYCHAIN}"
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "${KEYCHAIN_PASSWORD}" "${FITNESS_IOS_CODE_SIGN_KEYCHAIN}" >/dev/null
  unset KEYCHAIN_PASSWORD
fi

rm -rf "${EXPORT_PATH}" "${EXPORT_OPTIONS_PLIST}"
mkdir -p "${EXPORT_PATH}"
plutil -create xml1 "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :method string ${EXPORT_METHOD}" "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :teamID string ${FITNESS_IOS_DEVELOPMENT_TEAM}" "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :signingStyle string manual" "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :signingCertificate string iPhone Distribution" "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :provisioningProfiles dict" "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :provisioningProfiles:${BUNDLE_ID} string ${FITNESS_IOS_PROVISIONING_PROFILE_SPECIFIER}" "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :stripSwiftSymbols bool true" "${EXPORT_OPTIONS_PLIST}"
/usr/libexec/PlistBuddy -c "Add :manageAppVersionAndBuildNumber bool false" "${EXPORT_OPTIONS_PLIST}"

# Positional arguments keep the script compatible with macOS Bash 3.x.
set -- xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}"

if [[ -n "${FITNESS_IOS_CODE_SIGN_KEYCHAIN:-}" ]]; then
  set -- "$@" "OTHER_CODE_SIGN_FLAGS=--keychain ${FITNESS_IOS_CODE_SIGN_KEYCHAIN}"
fi

"$@"
find "${EXPORT_PATH}" -maxdepth 1 -type f -print -exec ls -lh {} \; -exec shasum -a 256 {} \;