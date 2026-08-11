# Design Document

## 1. System Overview

FormFlow is a 3-tier application with a clear separation of concerns:

- **Frontend tier**: the user interface and presentation logic
- **Backend tier**: the REST API, validation, business rules, and database communication
- **Database tier**: persistent storage for form records

The implementation uses Docker containers and Docker Compose so the system can be run locally or deployed to a Linux VM in the same way.

## 2. Tier Boundaries

### Frontend

The frontend is responsible for:

- rendering the application UI
- presenting the create form workflow
- listing forms returned by the API
- deleting forms
- showing success/error states
- showing health and version status

The frontend must not talk directly to PostgreSQL.

### Backend

The backend is responsible for:

- API routing
- request validation
- database reads and writes
- health checks
- version reporting

The backend owns the data model and is the only service that communicates with PostgreSQL.

### Database

The database stores:

- form id
- form name
- form description
- creation timestamp

The database is isolated in its own container and is not published to the public internet.

### Why the tiers are separate

The separation keeps the architecture easy to understand and operate:

- UI changes do not require database changes
- API changes do not require UI changes
- the database can be secured independently
- scaling and rollback are simpler because each tier is independently deployable

## 3. Versioning Strategy

Docker images are tagged with immutable identifiers, ideally the Git commit SHA.

Example:

- `yourname/formflow-frontend:abc1234`
- `yourname/formflow-backend:abc1234`

### Why `latest` is not used

`latest` hides what code is actually deployed and makes rollback ambiguous. A commit-based tag answers the question:

> What exact version is running in production?

### How the deployed version is identified

The backend exposes `GET /version`, returning the deployed version string. The frontend also displays the version so it can be verified visually during the demo.

### How rollback works

Rollback is performed by redeploying the last known-good image tags. Because every deployment is versioned, the exact previous frontend and backend image versions can be pulled and restarted without rebuilding from source.

## 4. Secrets Strategy

Sensitive values are stored in GitHub Secrets for CI/CD and in a local `.env` file for development.

### Secrets used by this project

- `DOCKERHUB_USERNAME` — Docker Hub account name used to tag and push images
- `DOCKERHUB_TOKEN` — Docker Hub access token used by GitHub Actions
- `VM_HOST` — public IP or DNS name of the Linux VM
- `VM_USERNAME` — SSH username on the VM
- `VM_SSH_KEY` — private SSH key used for automated deployment
- `DATABASE_PASSWORD` — database password used by Docker Compose and the VM runtime
- `VITE_API_URL` — API base path for the frontend build

Non-secret environment values that still need to be set:

- `DATABASE_NAME` — database name used by the application and init script
- `DATABASE_USER` — database user used by the application and init script

### Who can access them

- GitHub Actions uses the repository secrets during build and deploy
- the VM runtime receives the database password through the deployment environment file
- developers should only use local placeholders in `.env.example`

### Security rule

No secrets are hard-coded in Dockerfiles or committed to the repository.

## 5. Container and Network Design

- only the frontend publishes a host port
- the backend and database stay on the private Compose network
- the frontend proxies backend requests so users only need to access one public endpoint
- the database uses a named Docker volume for persistence

## 6. Deployment Design

The production VM runs Docker Compose and pulls image versions from Docker Hub. The SSH deployment user must be able to run Docker commands on the VM, typically by being a member of the `docker` group. GitHub Actions connects via SSH, logs the VM in to Docker Hub, updates the deployment environment, restarts the stack, and verifies the application with HTTP checks.

This keeps the deployment reproducible and avoids manual file copying.
