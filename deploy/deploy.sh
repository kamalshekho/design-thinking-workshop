#!/usr/bin/env bash
# Deploys one release on the demo server and rolls back to the previous one if
# the new one does not come up healthy. Runs on the server, from the directory
# that holds docker-compose.yml, deploy/ and .env (see deploy/README.md):
#
#   echo "$TOKEN" | GHCR_USER=<login> dtw/deploy/deploy.sh v1.0.0
#
# A token on stdin is used to log in to ghcr.io for the pull and is logged out
# again afterwards. Without stdin the images must already be pullable.
set -euo pipefail

tag="${1:-}"
if [[ ! $tag =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]]; then
  echo "usage: deploy.sh <release tag such as v1.0.0>, got '$tag'" >&2
  exit 2
fi

cd "$(dirname "$0")/.."

compose() {
  local image_tag="$1"
  shift
  IMAGE_TAG="$image_tag" docker compose --env-file .env \
    -f docker-compose.yml -f deploy/compose.images.yml -f deploy/compose.prod.yml "$@"
}

env_value() {
  grep -E "^$1=" .env | tail -n 1 | cut -d= -f2-
}

# Asks Caddy on this machine for each public page, so the check covers TLS,
# both nginx containers, the backend and the database.
smoke_test() {
  local form dashboard
  form="$(env_value FORM_HOST)"
  dashboard="$(env_value DASHBOARD_HOST)"
  for url in "https://$form/" "https://$form/api/v1/categories" "https://$dashboard/"; do
    local host="${url#https://}"
    host="${host%%/*}"
    if ! curl --fail --silent --show-error --output /dev/null --max-time 20 \
      --retry 6 --retry-delay 5 --retry-all-errors \
      --resolve "$host:443:127.0.0.1" "$url"; then
      echo "smoke test failed: $url" >&2
      return 1
    fi
  done
}

previous="$(cat .deployed-tag 2>/dev/null || true)"

if [ ! -t 0 ]; then
  docker login ghcr.io --username "${GHCR_USER:-deploy}" --password-stdin
  trap 'docker logout ghcr.io >/dev/null' EXIT
fi

compose "$tag" pull --quiet

# Flyway only migrates forward, so a dump taken before the new backend starts is
# the way back for the data. The last ten are kept.
if [ -n "$(compose "$tag" ps --quiet --status running db)" ]; then
  mkdir -p backups
  compose "$tag" exec -T db pg_dump -U volunteer_form volunteer_form </dev/null \
    | gzip >"backups/before-$tag-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
  find backups -name '*.sql.gz' -printf '%T@ %p\n' | sort -rn | tail -n +11 \
    | cut -d' ' -f2- | xargs -r rm --
fi

if compose "$tag" up --detach --wait --wait-timeout 300 --remove-orphans && smoke_test; then
  echo "$tag" >.deployed-tag
  docker image prune --force >/dev/null
  echo "deployed $tag"
  exit 0
fi

echo "$tag did not come up healthy" >&2
compose "$tag" logs --no-color --tail 100 >&2 || true
if [ -n "$previous" ] && [ "$previous" != "$tag" ]; then
  echo "rolling back to $previous" >&2
  compose "$previous" up --detach --wait --wait-timeout 300 --remove-orphans
fi
exit 1
