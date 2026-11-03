# Portfolio and calendar behavior

The public portfolio and its existing project walkthroughs remain public. The private calendar is a static shell backed by api.ches.dev. The current user instruction and the server authorization contract are authoritative: calendar:manage grants access to the owner's connected iCloud calendars, independently of dashboard permission. Initially only the owner has this group. Client visibility never grants API access.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Date | Native date/month/datetime controls | Calendar form and server iCalendar validation | Date-only inclusive UI, timed local value plus IANA zone | Browser all-day/DST and API tests |
| Select/Listbox | Native select/datalist | Existing CPU and calendar field markup | OS-owned dropdown geometry is accepted | Browser mobile/keyboard checks |
| Form | event-form, shared request helper | calendar/calendar.js and protected API | Create, series edit, occurrence edit, read-only view | Browser save/conflict/cancel tests |
| CRUD | Protected calendar API, ETags, idempotency key | Session permission and iCloud conditional writes | No background queue or automatic destructive retry | Live temporary-event CRUD test and mocked UI tests |

## Session and permissions

Missing session redirects once to central login with fixed calendar returnTo. A signed-in account without calendar access sees permission guidance. Network/service failure shows an offline state, never a login loop or a claim that a write succeeded. Dashboard and Calendar links use separate server capabilities. Account failures leave public content usable.

## Events and editing

Event titles, locations and notes use textContent or form values. Dialogs are native semantic dialog elements, styled with shared tokens. Custom validation owns errors; no native validation bubbles. Fields remain intact on errors. Dirty cancel and destructive delete use app-owned confirmation dialogs with Cancel focused first. Read-only calendars and scheduled invitations cannot be modified. Preserve unrelated iCalendar properties and recurrence exceptions. Event notifications are saved as iCalendar alarms and delivered by calendar clients.

## Offline and privacy

Never persist private events to localStorage, IndexedDB, caches or service workers. Drafts remain only in current page memory. Offline state disables writes, retains unsaved editor content and permits explicit retry. A lost response may follow a successful iCloud write; reuse the request key for a create retry and refresh to resolve edits. Controls start disabled until JavaScript attaches their handlers. No-JavaScript visitors retain the public portfolio and explanatory calendar text.
