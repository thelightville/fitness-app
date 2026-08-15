#!/bin/bash
# Deploy Fitness PT Tracker to CT117 Docker Hosting Platform
# Usage: ./scripts/deploy-ct117.sh

set -e

DOMAIN="fitness.myapps.com.ng"
SITE_DIR="/opt/docker-sites/${DOMAIN}"
REPO_URL="https://github.com/thelightville/fitness-app.git"
HOST_PORT="${HOST_PORT:-8054}"
HTTPS_PORT="${HTTPS_PORT:-8854}"

echo "[1] Preparing site directory ${SITE_DIR}..."
mkdir -p "${SITE_DIR}"
cd "${SITE_DIR}"

if [ ! -d ".git" ]; then
  echo "[2] Cloning repository..."
  git clone "${REPO_URL}" .
else
  echo "[2] Pulling latest changes..."
  git pull origin main
fi

echo "[3] Ensuring .env exists..."
if [ ! -f ".env" ]; then
  echo "ERROR: .env file not found. Copy .env.ct117.example to .env and configure secrets."
  exit 1
fi

echo "[4] Building and starting containers..."
docker compose -f docker-compose.ct117.yml down || true
docker compose -f docker-compose.ct117.yml up -d --build

echo "[5] Waiting for app healthcheck..."
sleep 15
if docker inspect --format='{{.State.Health.Status}}' fitness-app | grep -q healthy; then
  echo "    App is healthy"
else
  echo "    WARNING: App healthcheck not yet healthy. Check logs with: docker logs fitness-app"
fi

echo "[6] Registering with hosting API..."
API_KEY=$(cat /opt/hosting-api/.api_key 2>/dev/null || echo "")
if [ -n "${API_KEY}" ]; then
  curl -s -X POST -H "X-API-Key: ${API_KEY}" \
    -H "Content-Type: application/json" \
    http://172.16.16.117:9999/api/sites \
    >/dev/null || true
fi

echo "[7] Saving hosting metadata..."
cat > "${SITE_DIR}/.hosting-meta.json" <<EOF
{
  "domain": "${DOMAIN}",
  "plan": "internal",
  "framework": "nodejs",
  "http_port": ${HOST_PORT},
  "https_port": ${HTTPS_PORT},
  "db_name": "${POSTGRES_DB:-fitness_db}",
  "db_user": "${POSTGRES_USER:-fitness_user}",
  "db_pass": null,
  "client_email": null,
  "status": "active",
  "created_at": "$(date '+%Y-%m-%d %H:%M:%S')",
  "registered_from": "manual-deploy"
}
EOF

echo ""
echo "Deployment complete."
echo "App should be accessible on CT117 at http://172.16.16.117:${HOST_PORT}"
echo "Ensure Cloudflare DNS CNAME and PVE tunnel route point to this port."
