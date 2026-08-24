#!/usr/bin/env bash
set -euo pipefail

# Creates an iOS release archive for Fitness PT Tracker on the MacBook build host.
# Apple signing identities, team IDs, and export options stay outside git.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
IOS_DIR="${ROOT_DIR}/ios"
BUILD_DIR="${FITNESS_BUILD_DIR:-${HOME}/Developer/Builds/fitness}"
ARCHIVE_PATH="${FITNESS_IOS_ARCHIVE_PATH:-${BUILD_DIR}/FitnessPTTracker.xcarchive}"
SCHEME="${FITNESS_IOS_SCHEME:-FitnessPTTracker}"
WORKSPACE="${FITNESS_IOS_WORKSPACE:-FitnessPTTracker.xcworkspace}"

mkdir -p "${BUILD_DIR}"
cd "${IOS_DIR}"
pod install

if [[ -n "${FITNESS_IOS_CODE_SIGN_KEYCHAIN:-}" && -n "${FITNESS_IOS_CODE_SIGN_KEYCHAIN_PASSWORD_FILE:-}" ]]; then
  KEYCHAIN_PASSWORD="$(cat "${FITNESS_IOS_CODE_SIGN_KEYCHAIN_PASSWORD_FILE}")"
  security unlock-keychain -p "${KEYCHAIN_PASSWORD}" "${FITNESS_IOS_CODE_SIGN_KEYCHAIN}"
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "${KEYCHAIN_PASSWORD}" "${FITNESS_IOS_CODE_SIGN_KEYCHAIN}" >/dev/null
  unset KEYCHAIN_PASSWORD
fi

# Positional arguments keep the script compatible with macOS Bash 3.x.
set -- xcodebuild archive \
  -workspace "${WORKSPACE}" \
  -scheme "${SCHEME}" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "${ARCHIVE_PATH}"

if [[ -n "${FITNESS_IOS_DEVELOPMENT_TEAM:-}" ]]; then
  set -- "$@" "DEVELOPMENT_TEAM=${FITNESS_IOS_DEVELOPMENT_TEAM}"
fi
if [[ -n "${FITNESS_IOS_CODE_SIGN_STYLE:-}" ]]; then
  set -- "$@" "CODE_SIGN_STYLE=${FITNESS_IOS_CODE_SIGN_STYLE}"
fi
if [[ -n "${FITNESS_IOS_PROVISIONING_PROFILE_SPECIFIER:-}" ]]; then
  set -- "$@" "PROVISIONING_PROFILE_SPECIFIER=${FITNESS_IOS_PROVISIONING_PROFILE_SPECIFIER}"
fi
if [[ -n "${FITNESS_IOS_CODE_SIGN_IDENTITY:-}" ]]; then
  set -- "$@" "CODE_SIGN_IDENTITY=${FITNESS_IOS_CODE_SIGN_IDENTITY}"
fi
if [[ -n "${FITNESS_IOS_CODE_SIGN_KEYCHAIN:-}" ]]; then
  set -- "$@" "OTHER_CODE_SIGN_FLAGS=--keychain ${FITNESS_IOS_CODE_SIGN_KEYCHAIN}"
fi
if [[ "${FITNESS_IOS_ALLOW_PROVISIONING_UPDATES:-0}" == "1" ]]; then
  set -- "$@" -allowProvisioningUpdates
fi

"$@"
du -sh "${ARCHIVE_PATH}"