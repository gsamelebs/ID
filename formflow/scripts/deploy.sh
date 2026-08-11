#!/usr/bin/env sh
set -eu

DEPLOY_DIR=${DEPLOY_DIR:-$HOME/formflow}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.prod.yml}
ENV_FILE=${ENV_FILE:-.env}

cd "$DEPLOY_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
