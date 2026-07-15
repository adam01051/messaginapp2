#!/usr/bin/env bash
set -Eeuo pipefail

max_attempts="${MIGRATION_MAX_ATTEMPTS:-3}"
attempt=1

until npm run prisma:migrate:deploy; do
  if (( attempt >= max_attempts )); then
    echo "Prisma migration deployment failed after ${attempt} attempts." >&2
    exit 1
  fi

  attempt=$((attempt + 1))
  echo "Migration deployment failed; retrying (${attempt}/${max_attempts})..." >&2
  sleep 5
done

exec npm start
