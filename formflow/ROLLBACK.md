# Rollback Procedure

This document describes how to restore the previous known-good FormFlow release.

## Prerequisites

You must know the last working image tags for both services, for example:

- `yourname/formflow-frontend:abc1234`
- `yourname/formflow-backend:abc1234`

Keep the previous release tag recorded in the deployment notes or GitHub Actions logs.

## Rollback Steps

1. SSH into the Linux VM.
2. Go to the deployment directory.
3. Set the image references back to the last known-good version.
4. Pull the previous images.
5. Recreate the containers.
6. Verify the health endpoint and the UI.

Example commands:

```bash
cd /opt/formflow

export FRONTEND_IMAGE=yourname/formflow-frontend:abc1234
export BACKEND_IMAGE=yourname/formflow-backend:abc1234

docker compose pull frontend backend
docker compose up -d --remove-orphans
curl -f http://localhost/health
curl -f http://localhost/version
```

If the deployment is managed through a `.env` file, update the file instead of exporting the variables manually.

## Verification

After rollback, confirm that:

- the application loads in a browser
- `GET /health` returns `healthy`
- `GET /version` returns the restored version
- form create/list/delete still work

## Operational Notes

- Do not use `latest` for rollback targets.
- Always keep the previous successful version available.
- If the new release fails, revert the frontend and backend together so the API and UI stay in sync.

## Evidence to Capture

For the capstone, capture screenshots of:

- the failed deployment
- the rollback commands
- the restored application
- the health/version response after rollback
