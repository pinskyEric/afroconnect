# AfriConnect Backend — Laravel JSON API

## Frontend inspection and integration

The supplied `pinskyEric/afroconnect` frontend was inspected (README, routes/pages, TypeScript types, mock data/services, service adapter/composition, and integration notes). Its product flows include auth/onboarding, profile and discovery, favorites, friend requests, messaging, matchmaking, notifications, reports/blocks, and a mock admin interface. The backend contract is documented in `docs/API.md` and `openapi.yaml`; the Postman collection is under `postman/`.

The API uses opaque UUIDs and UTC ISO-8601 timestamps. Adapt those to frontend display-local time in the frontend service adapter. Mock `demo` authentication and simulated matches are development-only. The frontend's public/mock admin screen does not grant access to backend admin endpoints.

## Stack and current scope

Laravel JSON REST API with PostgreSQL as durable application storage; Redis for ephemeral coordination; Reverb for authenticated realtime events; private S3-compatible object storage for profile photos; and Docker Compose for local infrastructure. The repository includes auth/profile, discovery/favorite, friend/messaging, matching/call signaling, notifications, safety/reporting, and admin/audit implementation paths, with policies, validation, rate limits, and PHPUnit coverage. A trusted CLI command provisions an existing user as admin and records an audit event. Ephemeral state cleanup is scheduled.

Profile photos are content-validated and re-encoded as WebP before storage; responses use short-lived temporary URLs. A DOB field is used only as an adult-eligibility gate, not as identity or independently verified age. No real user data or real credentials are supplied.

## Local setup

Requirements: compatible PHP/Composer dependencies from `composer.json`, and Docker Compose v2 for the infrastructure stack.

```sh
cp .env.example .env
# Set local-only PostgreSQL, Redis, S3/MinIO and Reverb values.
php artisan key:generate
docker compose config
docker compose up -d
# Create the configured bucket in the MinIO console, then:
php artisan migrate --seed
php artisan route:list
php artisan test
php vendor/bin/pint
```

If using host PHP, install dependencies with `composer install`. Configure services using Compose hostnames from inside containers or reachable host addresses for host processes. Run the web app, queue worker, scheduler, and Reverb as separate processes for local development. See `.env.example`, `docker-compose.yml`, and `docs/IMPLEMENTATION.md` for configuration details. MinIO bucket creation is manual; there is no MinIO init container.

Admin provisioning is only via the trusted CLI command `php artisan africonnect:admin:promote {user-id}`. It prompts for confirmation and writes an audit record.

## Verification status

Latest executed checks: Pint passed (80 files); PHPUnit passed on SQLite (**41 tests, 189 assertions**); Laravel route listing and CLI command registration succeeded. PostgreSQL has not been rerun against the latest changes. Docker Compose/runtime, OpenAPI/Postman smoke tests, and external integrations have not been verified in the current environment (Docker is unavailable; earlier image pulls encountered registry authorization failures). These results do not establish production readiness. Recent review work added generation-based conversation subscription rotation plus a rotation event, broadcast-time privacy guards, consistent call-policy checks, explicit DOB bounds, notification preference behavior, audited account action for actioned reports, and scheduled presence/call expiry. Conversation subscriptions are generation-rotated on block/status changes; clients must refetch the conversation list and resubscribe to the current generation. Still-open items include email-only recovery scope, Redis lifecycle behavior, PostgreSQL/concurrency verification, live Reverb validation, and broader security coverage. Read `docs/QUALITY-CHECKLIST.md` for the detailed findings and remaining gates.

## Calls and media

Laravel authorizes and relays bounded call signaling only; it does not handle audio/video. WebRTC media travels peer-to-peer when possible, otherwise through a separately operated TURN service such as coturn. Use short-lived TURN credentials supplied server-side; never put permanent TURN secrets in the frontend. Deploy signaling over TLS/WSS and configure private-channel authorization and expiry.
