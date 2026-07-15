#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

for environment_file in backend/.env frontend/.env; do
  if [[ ! -f "$environment_file" ]]; then
    echo "$environment_file is missing. Copy its .env.example and configure it first." >&2
    exit 1
  fi
done

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Deployment stopped: tracked files have uncommitted changes." >&2
  exit 1
fi

git pull --ff-only
docker compose up -d --force-recreate --remove-orphans --wait --wait-timeout "${DEPLOY_WAIT_SECONDS:-300}"
docker compose ps

echo "Deployment complete. Frontend: :6002, backend: :6001"
echo "Logs: docker compose logs -f messaging-backend messaging-frontend"
