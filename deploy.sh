#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing. Copy backend/.env.example and add the VPS secrets first." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Deployment stopped: tracked files have uncommitted changes." >&2
  exit 1
fi

git reset --hard
git checkout 
docker compose up -d --wait --wait-timeout "${DEPLOY_WAIT_SECONDS:-300}"
docker compose ps

echo "Deployment complete. Check logs with: docker compose logs -f messaging-app"

#!/bin/bash





