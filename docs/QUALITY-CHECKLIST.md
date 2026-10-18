# Quality checklist — verification record

Reviewed: 2026-10-16. This records implementation and checks actually completed in the current workspace. “Implemented” does not mean production deployment has been independently validated.

## Frontend and contract
- [x] Inspected the supplied frontend README, routes, DTO/types, mock services/data, and integration notes; mapped frontend needs in `README.md` and `docs/API.md`.
- [x] Laravel JSON API routes/controllers, PostgreSQL-oriented schema, OpenAPI 3.1 contract, and Postman collection are present.
- [x] DOB is treated as an adult-eligibility input, not identity verification. Public profiles do not expose DOB.
- [x] Laravel handles call lifecycle/signaling only; media uses WebRTC and separately operated TURN.

## Implemented backend safeguards and features
- [x] Sanctum authentication, registration/profile flows, account status/role, discovery/favorites, friends/messaging, match/call flows, notifications, reports/blocks, and moderator endpoints are represented in the application.
- [x] Models and policies cover conversations, matches, reports, and calls; policy checks are wired into message, match, and admin controller paths.
- [x] Admin promotion is a trusted CLI operation (`africonnect:admin:promote`) with confirmation and audit logging; no public admin signup.
- [x] Photo upload validates image content; profile image processing re-encodes to WebP before private S3-compatible storage and returns a temporary URL. Tests cover invalid upload, private visibility, WebP output, and the 10-minute temporary-URL expiry callback; actual S3 signature validation remains an integration check.
- [x] Real-time notification creation and read-state changes are persisted then dispatched after commit as `ShouldBroadcast` events to the recipient's private `users.{id}` channel (`notification.created`, `notification.read`, `notification.read_all`). Payload contracts, enabled creation dispatch, disabled-preference suppression, and private-channel authorization are covered by tests. Reverb and the Redis queue worker must be running for delivery outside tests.
- [x] Scheduled ephemeral presence/matchmaking cleanup job is registered; Compose has a scheduler service.
- [x] `.env.example` uses local-only placeholders; no real credentials or real-user demo records are included.

## Executed checks
- [x] PHP formatting: `php vendor/bin/pint` — passed, 80 files.
- [x] Full PHPUnit suite on configured SQLite test environment — latest **41 tests, 189 assertions passed**.
- [x] `php artisan route:list --except-vendor --json` — completed successfully.
- [x] Admin CLI command registration — verified with `php artisan list --raw`.
- [x] PHP dependency resolution/autoload setup completed in this workspace.

## Remaining implementation / security findings (reviewed 2026-10-16)
These were found during a source-level review and are not represented as completed just because related classes/routes exist:
- [x] **Realtime channel authorization/revocation:** conversation channels use a generation number returned by conversation list/create APIs. Blocking and moderator status changes rotate the generation; channel auth rejects stale generations, and broadcast-time privacy checks suppress queued events from an old generation even after unblock. Feature tests prove old-generation events stay suppressed and a fresh generation can subscribe. A `conversation.channel_rotated` event on active user channels tells clients to refetch and resubscribe; the old socket need not be force-disconnected because it can no longer receive conversation broadcasts.
- [x] **Call policy coverage:** `CallSessionPolicy` now gates call status changes, signal relay, and ICE configuration. Feature tests cover outsider, blocked-pair, and ended-call denial.
- [x] **Age/date validation:** onboarding now requires a DOB from 1900-01-01 through the 18+ cutoff; tests reject underage, future, and out-of-range dates. This remains a self-asserted eligibility gate, not age verification.
- [x] **Notification preferences:** `notifications: false` now retains the in-app inbox item but suppresses the realtime notification event; covered by a feature test. External push delivery is not implemented.
- [x] **Moderation workflow:** `actioned` now requires an explicit suspended/banned account status, revokes the target's Sanctum tokens, and writes both report-decision and account-status audit entries. Feature tests cover validation, suspension, and token revocation. The existing separate admin status endpoint remains available.
- [ ] **Password recovery channel:** reset-link delivery is email-only; phone identities receive the generic response but have no SMS recovery flow. Decide whether email-only recovery is acceptable and document it, or implement a verified phone reset channel.
- [x] **Presence/call expiry:** scheduled cleanup now marks stale online users offline, ends unanswered ringing calls after 2 minutes, and ends active calls after 4 hours; pruning behavior is feature-tested. These timeouts need product confirmation before production.
- [ ] **Redis lifecycle/recovery:** worker behavior when Redis is unavailable, queue reconciliation after Redis data loss, and retry/alerting policy remain unverified. Signaling payloads are transient and not persisted; confirm the client contract expects transient relay.
- [ ] **Concurrency and PostgreSQL behavior:** no current tests establish PostgreSQL unique/index/JSON behavior, concurrent friend/match transitions, race-safe pair reservation, or Redis-backed matchmaking under contention. SQLite tests do not prove these properties.
- [ ] **Behavioral/security test coverage:** 41 tests cover selected auth/social/block/matching/notification/admin/photo/call, channel authorization, pruning, favorites/blocks ownership, and three rate-limit scenarios, not the whole API surface. Add tests for ownership across every resource, live Reverb integration, real S3 signed-URL access/signature validation, rate limits on all sensitive endpoints, and broader report-state transitions.
- [x] **Static contract route parity:** OpenAPI YAML parsed and a static comparison matched all 40 route templates and all HTTP methods exposed by 47 Laravel API route entries. This confirms paths/methods only.
- [ ] **Contract/runtime integration:** request/response schema completeness and live Postman requests have not been validated against a running API; the Postman collection is only a subset of route coverage.
- [ ] **Deployment checks:** Docker is unavailable in this environment; full Compose startup, image build, PostgreSQL migration/test, Redis/Reverb/S3/Mailpit integration, scheduler/worker execution, and TURN connectivity remain unverified. Prior image pulls were reported blocked by registry authorization.
- [ ] **Operational hardening:** production CORS allowlist, TLS/proxy, secrets, backups/restore, data retention/deletion, PII/log redaction, object lifecycle, monitoring, load testing, and incident response still require environment-specific review.

## Checks re-run during this review
- [x] `composer install --no-interaction --prefer-dist` restored the excluded/incomplete local `vendor` tree from `composer.lock`.
- [x] `php vendor/phpunit/phpunit/phpunit` — **41 tests, 189 assertions passed** on SQLite.
- [x] `php vendor/bin/pint --test` — 80 files passed.
- [x] `composer validate --no-check-publish` — valid.
- [x] `composer audit --no-interaction` — no known advisories in the resolved lockfile.
- [x] `php artisan route:list --except-vendor --json` and admin CLI command registration succeeded.
- [x] OpenAPI YAML 3.1.0 parsed; Postman v2.1 collection JSON parsed. These checks do not establish completeness or runtime compatibility.
- [ ] Docker Compose validation/start/build was attempted but could not run: `docker: command not found`.

## Next steps
Wire the frontend adapter to listen on `users.{id}` for `conversation.channel_rotated`, refetch conversations, and resubscribe using the returned `channel_generation`; validate notification/read events in a live Reverb + queue setup. Confirm call timeout values and Redis recovery behavior, and decide whether email-only password recovery is acceptable. Expand ownership, throttling, signed-URL, and contract tests. Finally run PostgreSQL-backed migration/tests and live OpenAPI/Postman checks in a Docker-capable environment; validate Compose and all integrations. Do not describe this project as production-ready until the unchecked deployment gates are closed.
