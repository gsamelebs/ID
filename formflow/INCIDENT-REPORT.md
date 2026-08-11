# Incident Report

> This file is structured to match the capstone incident-report requirements. Replace the evidence placeholders with screenshots and logs from your live incident simulation.

## Symptom

### What happened?

A newly deployed FormFlow version failed to serve the application correctly after deployment.

### What did the user observe?

Users saw one or more of the following:

- the UI would not load
- the health check returned a failure response
- form data could not be fetched from the backend
- the page displayed an error state instead of the application content

### How was the failure detected?

The failure was detected through:

- the GitHub Actions deployment verification step
- manual browser testing of the public URL
- a failed `/health` response from the VM

### Evidence

Insert screenshots and logs here:

- `docs/screenshots/failed-deployment.png`
- GitHub Actions job output
- VM container logs

## Investigation Trail

### 1. What was checked first?

The health endpoint was checked first to determine whether the backend was running and able to reach PostgreSQL.

### 2. What was checked next?

The container logs were checked next to see whether the backend failed at startup or during a request.

### 3. What did each check rule in/out?

- A successful `/version` response would rule out a total backend outage.
- A failed `/health` response would suggest a database connectivity or configuration problem.
- A frontend load failure would suggest a reverse-proxy or container startup issue.

### 4. What evidence was collected?

- backend container logs
- compose status output
- browser screenshot of the error state
- GitHub Actions deployment log

## Root Cause

The root cause was an incorrect deployment version or runtime configuration that prevented the backend from communicating with PostgreSQL or serving requests correctly.

## Fix

### What was changed?

The deployment was corrected by restoring the previous known-good image tags and redeploying the stack.

### Why was it changed?

The previous release was already verified as working, so rolling back minimized downtime and restored the application quickly.

### What happened after the fix?

After the rollback, the UI loaded again, `/health` returned a healthy response, and form create/list/delete operations worked as expected.

### Before/after evidence

- Before: failed deployment screenshot and error logs
- After: successful browser load, healthy endpoint, and version confirmation

## Design Reflection

### Did the original architecture make the problem more or less likely?

The tier separation made the problem easier to isolate because frontend, backend, and database failures could be checked independently.

### Was the problem easy to detect?

Yes. The health endpoint and deployment verification made the failure visible quickly.

### What could be improved in the design?

Possible improvements include:

- stronger container health checks
- more detailed structured logs
- a staging environment before production rollout
- automated smoke tests after deployment
