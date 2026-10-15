# Mock data and service contracts

## Fixtures

`src/lib/data.ts` contains eight fictional adult profiles across Uganda, Ghana, Kenya, Nigeria, South Africa, Rwanda, the UK and Canada; ten country definitions covering all five African regions and international discovery; eight languages; ten interests; an Alex demo profile; three friends; two incoming and one outgoing requests; three conversations; six notification types; three sample reports; preferences and mock admin statistics.

Portraits are stock images representing fictional profiles, not real platform members. Ages, names, countries, online statuses and bios are invented. No precise locations, contact details, or identity documents are in the profile model.

## Adapter contracts

`src/services/interfaces.ts` defines:

| Service             | Methods                                  | Current behavior                                                                            |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| AuthService         | login, register, recover, logout         | Artificial delay, `{mode:'demo'}`; no persistence or session                                |
| ProfileService      | get, update                              | Cloned seed / returned validated profile                                                    |
| DiscoveryService    | list(filters)                            | Combined case-insensitive search and exact country/region/language/interest/online filters  |
| MatchmakingService  | find(filters, outcome?, excludeIds?)     | Delayed random eligible profile, no match, or simulated error; excludes skipped/blocked IDs |
| MessagingService    | list, send                               | Cloned fixtures or generated local message, ID and current display timestamp                |
| FriendsService      | list, requests, request, respond, remove | Typed local values / delayed acknowledgement                                                |
| NotificationService | list, markRead                           | Cloned seed / local acknowledgement                                                         |
| SafetyService       | report, block, unblock                   | New typed report / local acknowledgement, no real moderator                                 |
| AdminService        | reports, setStatus, resolve              | Cloned fixture reports / local acknowledgement                                              |

`src/services/index.ts` exports the selected adapters. `src/services/mock.ts` contains the implementations. UI components import the composition root. The provider owns local mutations, so service acknowledgement and state changes are separate. Listing a mock service returns seed data, not a remote shared state store.

## Simulations and state scope

| Feature             | Simulation                                                              | Storage                                                        |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| Authentication      | Format validation and delay only                                        | Form memory, never storage                                     |
| Onboarding          | Adult gate, editable preview, review                                    | Component/provider memory; DOB is discarded after deriving age |
| Profile photo       | Type/size-validated Data URL preview                                    | Memory, not uploaded                                           |
| Friends / favorites | Provider arrays with duplicate prevention                               | Memory                                                         |
| Messages            | Append outgoing bubbles; existing incoming messages are static fixtures | Memory; no delivery, typing or read receipt is claimed         |
| Matching            | 2.2-second search and selected scenario                                 | Component memory                                               |
| Call                | Static remote/local photos, UI toggles and elapsed timer                | No media device access or network connection                   |
| Reports / blocks    | Local report objects and exclusions                                     | Memory, never persisted                                        |
| Admin               | Status flags and report resolution                                      | Memory, no authorization or account enforcement                |
| Preferences         | Whitelisted harmless values                                             | `localStorage['africonnect-ui']`                               |

## Reproducible failure and empty cases

- `error@demo.test` creates a simulated login error after validation.
- Matching's developer control selects normal, empty or error behavior; normal matching can also be empty for incompatible filters.
- Discovery search for an unknown name or combine Uganda + Arabic for no matches.
- Favorites before saving has an empty view; unread notifications become empty after mark-all.
- Accept/decline all incoming requests to see the caught-up state.
- New-recipient conversations start empty. Inbox list component supports an empty fixture array and unmatched search.
- Blocking list starts empty. Reports show a local success state without implying delivery.

A route-level error boundary handles unexpected rendering failures, and reusable `EmptyState`, `SkeletonCards`, `FormError`, `Modal` and toast components cover common interaction feedback.
