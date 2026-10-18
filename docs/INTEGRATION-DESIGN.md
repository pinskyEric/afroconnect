# Integration and safety design

## Frontend contract inspected

The Next.js frontend exposes nine async service contracts in `src/services/interfaces.ts`: `AuthService`, `ProfileService`, `DiscoveryService`, `MatchmakingService`, `MessagingService`, `FriendsService`, `NotificationService`, `SafetyService`, and `AdminService`. UI state is coordinated by `src/components/provider.tsx`; the currently selected `src/services/mock.ts` adapter and fixture data are session-only. Local storage is limited to harmless display/accessibility preferences. The current typed entities are `Profile`, `DiscoveryFilters`, `Conversation`, `Message`, `FriendRequest`, `Notification`, `Report`, `Preferences`, and `AdminUser`.

Current app routes are `/app`, `/app/discover`, `/app/match`, `/app/messages`, `/app/friends`, `/app/notifications`, `/app/profile`, `/app/settings`, `/app/safety`; auth/onboarding and public information routes are `/login`, `/register`, `/forgot-password`, `/onboarding`, `/safety`, `/terms`, `/privacy`; `/admin` is a mock-only route and must not be treated as secure authorization. Onboarding collects a birth date, but the current UI derives an age and discards the raw date. The real adapter will submit the user's entered date once to the backend; it will not infer a date from an age. A submitted birth date is only a self-declared eligibility input, not age or identity verification.

## Storage and service design

Keep the existing PostgreSQL schema and use incremental migrations. Add an appeals table owned by a UUID user, with pending/review decision state, reviewer, timestamps and notes. Keep reports and admin audit records separate so that account anonymization does not erase safety decisions. Account deletion will revoke tokens, remove profile/media and social state, erase conversations for both participants, anonymize the account shell referenced by reports/audit, and set it soft-deleted. A configurable retention period (default 365 days) will retain resolved reports, appeals, and admin audit records; pending cases remain until a decision. Pruning removes resolved records after that retention window. These defaults need privacy/legal review before a public launch.

Account export will be an authenticated JSON download containing the account holder's own account/profile/preferences, relationships, notifications, report/appeal records, and messages in their conversations; it will not include other users' login credentials or private account contact data. Export and deletion must never expose a bearer token to browser persistent storage.

Appeals can be created by a suspended/banned account using its authenticated session, are owner-scoped, rate-limited, and limited to one pending appeal per account. Only authorized admins may decide them. Reinstatement changes status and records an audit event. Moderation reports and appeals remain subject to retention and review.

No identity-document collection or verification badge is added. Email password recovery remains available; SMS recovery requires a real selected/configured delivery provider. Calls remain signaling-only; Laravel/Reverb handles session and SDP/ICE payload relay, while audio/video are browser peer-to-peer and TURN is separate infrastructure.

## Frontend API boundary

Use the documented `/api/v1` JSON API. A typed adapter maps API snake_case/UUID/timestamps into existing UI types. Keep fixture adapters available only for explicit local demo mode; normal configured mode uses the Laravel adapter, loading/error states, and a non-persistent in-memory auth credential. Do not write tokens, passwords, DOB, messages, photos, or reports to `localStorage`. The API adds account export/deletion and appeal service methods, plus optional deterministic icebreakers based on mutual interests/languages after core integration. Admin UI routes remain hidden/disabled for ordinary users; backend authorization is authoritative.
