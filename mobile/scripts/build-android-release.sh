#!/usr/bin/env bash
set -euo pipefail

# Builds a signed Android App Bundle for Fitness PT Tracker without storing
# signing secrets in the repository.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="${ROOT_DIR}/android"
BUILD_DIR="${FITNESS_BUILD_DIR:-${HOME}/Developer/Builds/fitness}"
SIGNING_ENV="${FITNESS_ANDROID_SIGNING_ENV:-${HOME}/Developer/secrets/fitness-android-signing.env}"
KEYSTORE="${FITNESS_UPLOAD_STORE_FILE:-${HOME}/Developer/secrets/fitness-upload.keystore}"
VERSION_NAME="${FITNESS_ANDROID_VERSION_NAME:-1.0.0-beta.1}"
ARTIFACT="${BUILD_DIR}/fitness-${VERSION_NAME}.aab"

# Creates a local signing environment when explicitly requested by the build host.
create_signing_env() {
  mkdir -p "$(dirname "${SIGNING_ENV}")"
  umask 077
  local store_password
  store_password="$(openssl rand -hex 32)"
  {
    printf 'export FITNESS_UPLOAD_STORE_FILE="%s"\n' "${KEYSTORE}"
    printf 'export FITNESS_UPLOAD_KEY_ALIAS="%s"\n' "fitness-upload"
    printf 'export FITNESS_UPLOAD_STORE_PASSWORD="%s"\n' "${store_password}"
    printf 'export FITNESS_UPLOAD_KEY_PASSWORD="%s"\n' "${store_password}"
    printf 'export FITNESS_ANDROID_VERSION_CODE="%s"\n' "${FITNESS_ANDROID_VERSION_CODE:-1}"
    printf 'export FITNESS_ANDROID_VERSION_NAME="%s"\n' "${VERSION_NAME}"
  } > "${SIGNING_ENV}"
  chmod 600 "${SIGNING_ENV}"
}

# Generates the upload keystore on the build host if it is missing.
create_upload_keystore() {
  mkdir -p "$(dirname "${FITNESS_UPLOAD_STORE_FILE}")"
  keytool -genkeypair \
    -storetype PKCS12 \
    -keystore "${FITNESS_UPLOAD_STORE_FILE}" \
    -alias "${FITNESS_UPLOAD_KEY_ALIAS}" \
    -keyalg RSA \
    -keysize 4096 \
    -validity 10000 \
    -storepass "${FITNESS_UPLOAD_STORE_PASSWORD}" \
    -keypass "${FITNESS_UPLOAD_KEY_PASSWORD}" \
    -dname "CN=Fitness PT Tracker,O=Thelightville,C=NG" >/dev/null
  chmod 600 "${FITNESS_UPLOAD_STORE_FILE}"
}

if [[ ! -f "${SIGNING_ENV}" ]]; then
  if [[ "${FITNESS_INIT_ANDROID_SIGNING:-0}" != "1" ]]; then
    echo "Missing ${SIGNING_ENV}. Set FITNESS_INIT_ANDROID_SIGNING=1 on the build host to create it." >&2
    exit 1
  fi
  create_signing_env
fi

# shellcheck source=/dev/null
. "${SIGNING_ENV}"

if [[ ! -f "${FITNESS_UPLOAD_STORE_FILE}" ]]; then
  create_upload_keystore
fi

mkdir -p "${BUILD_DIR}"
cd "${ANDROID_DIR}"
./gradlew bundleRelease
cp app/build/outputs/bundle/release/app-release.aab "${ARTIFACT}"
ls -lh "${ARTIFACT}"
shasum -a 256 "${ARTIFACT}"
keytool -list -v \
  -keystore "${FITNESS_UPLOAD_STORE_FILE}" \
  -alias "${FITNESS_UPLOAD_KEY_ALIAS}" \
  -storepass "${FITNESS_UPLOAD_STORE_PASSWORD}" 2>/dev/null | grep -E 'Alias name:|SHA256:'