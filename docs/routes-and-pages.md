# Routes and pages

All routes below render meaningful interfaces. No route requires a real login in the prototype.

| Route                | Screen and interactions                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/`                  | Full landing, CTA links, country/language/interest deep links, profile previews/dialogs/favorites, FAQs    |
| `/login`             | Email/phone and password validation, visibility, simulated loading/error/success                           |
| `/register`          | Email/phone, password, age and terms/privacy validation; enters onboarding                                 |
| `/forgot-password`   | Identity validation and honest simulated recovery receipt; no email/SMS                                    |
| `/terms`             | Structured placeholder terms and development limitations                                                   |
| `/privacy`           | Actual prototype storage behavior, data boundaries, legal review requirements                              |
| `/safety`            | Public safety center with guidelines, report form and local blocking controls                              |
| `/onboarding`        | Username → adult DOB → country → languages → interests → photo/bio → review                                |
| `/app`               | Personalized overview, status toggle, matching CTA, filters, recommended/recent profiles, social previews  |
| `/app/discover`      | Search, combined filters, online-only, favorites, profile dialog, friend request                           |
| `/app/match`         | Idle/search/found/call/empty/error states, cancel/accept/skip/next, static photo call and chat             |
| `/app/messages`      | Searchable conversations, unread status, list/detail layout, immediately appended local messages           |
| `/app/friends`       | Friends, incoming and outgoing requests, accept/decline/cancel/remove, dialogs, chat links                 |
| `/app/notifications` | Six categories, individual read, mark all, unread view and empty state                                     |
| `/app/profile`       | Personal profile summary, edit form, local photo validation/preview, languages/interests                   |
| `/app/settings`      | Account, discovery, privacy, notifications, sound/video/data saver, accessibility, leave-demo confirmation |
| `/app/safety`        | Guidelines, report validation, category selection, block/unblock and confirmations                         |
| `/admin`             | Public development-only metrics, tables, search/status filtering, report review, suspend/ban/restore       |
| `/offline`           | Designed fallback; automatic offline navigation is not implemented                                         |
| Unknown path         | Designed 404 with a working return link                                                                    |

## Deep links

- `/app/discover?country=Uganda`
- `/app/discover?language=Swahili`
- `/app/discover?interest=Art%20%26%20design`
- `/app/messages?user=u2` opens/creates Kwame's demo conversation.
- `/app/safety?report=u1` opens the report form for Amina.

Only fictional fixture IDs are recognized as message recipients. Filter parameters are initial discovery values; users can clear them from the UI. Blocked users are excluded from discovery, recommendations, and matching, and cannot receive locally simulated outgoing messages or friend requests.

## Navigation

Public pages use a shared header, mobile menu and footer. Application pages use a desktop sidebar and topbar, with five primary mobile bottom actions. Profile and notifications are in the mobile topbar; profile links lead to privacy settings, and the footer links to safety. Admin has its own conspicuous development header and return link.
