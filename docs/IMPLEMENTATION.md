# Implementation and verification guide

This repository contains an initialized Laravel application (not a Laravel project scaffold to recreate). Keep the existing source; do not run `composer create-project` over it.

## Requirements and configuration

Use the PHP version and extensions declared by `composer.json`/the Dockerfile, Composer 2, and Docker Compose v2 for the containerized setup. Copy `.env.example` to `.env`, set a fresh local `APP_KEY`, then configure PostgreSQL, Redis, Reverb, and private S3-compatible storage for the selected environment. Inside Compose, use service hostnames rather than `localhost`. Do not commit `.env`, production credentials, TURN secrets, or reusable demo passwords.

The app uses private object storage for profile photos and signed temporary URLs. In local MinIO, create the configured bucket through the MinIO console. No init container currently creates it. Laravel authorizes and relays bounded call signaling, never audio/video media.

## Local workflow

```sh
cp .env.example .env
# Set local values, then generate an application key:
php artisan key:generate

docker compose config
docker compose up -d
# Create the MinIO bucket in the console, then:
php artisan migrate --seed
php artisan route:list
php artisan test
php vendor/bin/pint
```

If running PHP on the host rather than in a container, install dependencies with `composer install`, ensure PostgreSQL/Redis/MinIO are reachable, and configure `.env` accordingly. Run the HTTP server, queue worker, scheduler, and Reverb process as separate supervised processes for local development. Exact services and ports are in `docker-compose.yml` and `.env.example`.

## Admin provisioning

Never expose role elevation through registration or a public endpoint. Use the guarded CLI command only from a trusted operator session:

```sh
php artisan africonnect:admin:promote {user-id}
```

Review the confirmation prompt and resulting audit record. Use a fictional/test account for local testing.

## Verification status and limits

The current workspace ran Pint successfully (80 files), `php artisan route:list`, CLI command registration, and SQLite PHPUnit (**41 tests, 189 assertions**). Scheduled pruning ends unaccepted calls after 2 minutes, ends active calls after 4 hours, and clears stale presence; confirm timeout values against product requirements. These are not substitutes for PostgreSQL integration/concurrency tests. The latest Docker/Compose checks could not be run in this environment because the Docker executable is absent; earlier full-stack pulls were also blocked by registry authorization. Re-run Compose, PostgreSQL migrations/tests, OpenAPI validation, Postman smoke tests, and integration checks on a host with the required services. See `docs/QUALITY-CHECKLIST.md` for the current status.

## Contract and frontend mapping

Use `docs/API.md`, `openapi.yaml`, and `postman/AfriConnect.postman_collection.json`. The frontend uses string IDs and display-local time; the backend contract returns opaque UUIDs and UTC timestamps. Keep mapping in the frontend adapter. Mock `demo` auth and mock matchmaking results must never be treated as real production behavior. The existing mock admin UI is not authority: server endpoints require server-side authorization.

## WebRTC and TURN boundary

Laravel handles authenticated call session creation/transitions and bounded participant-only SDP/ICE signaling. It is not an RTP/audio/video relay. WebRTC peers send media directly when possible or through a separately operated TURN service (for example coturn) when NAT traversal requires it. Provision short-lived TURN credentials from a private server-side secret; never embed static TURN credentials in the frontend. Use TLS/WSS, private-channel authorization, payload limits, rate limits, and expiry. Test connectivity and TURN configuration separately in the target deployment.

## Deployment gates

Before production, validate migrations and concurrency against PostgreSQL; run Redis/Reverb/S3 and queue/scheduler integration tests; validate OpenAPI and Postman against a running service; review every endpoint's privacy, ownership, block, throttling, and audit behavior; and perform security/load testing. Configure TLS, exact CORS origins, trusted proxies, managed services with least privilege, backups and restore drills, secret management, monitoring with PII redaction, private bucket lifecycle/retention, and supervised/scaled workers. A birth-date field is only an eligibility gate and does not establish identity or independently verify age.
