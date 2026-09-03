#!/bin/sh
set -eu

case "${1:-}" in
  "") ;;
  migrate) exec node .output/migrate.mjs ;;
  *) exec "$@" ;;
esac

if [ "${MIGRATE_ON_BOOT:-true}" != "false" ]; then
  node .output/migrate.mjs
fi

exec node .output/server/index.mjs
