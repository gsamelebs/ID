#!/usr/bin/env sh
set -eu

BASE_URL=${BASE_URL:-http://127.0.0.1}

curl --fail --silent --show-error "$BASE_URL/"
curl --fail --silent --show-error "$BASE_URL/health"
curl --fail --silent --show-error "$BASE_URL/version"
