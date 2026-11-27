# Portfolio and calendar behavior

The public portfolio and its existing project walkthroughs remain public. The private calendar is a static shell backed by api.ches.dev. The current user instruction and the server authorization contract are authoritative: calendar:manage grants access to the owner's connected iCloud calendars, independently of dashboard permission. Initially only the owner has this group. Client visibility never grants API access.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Date | Native date/month/datetime controls | Calendar form and server iCalendar validation | Date-only inclusive UI, timed local value plus IANA zone | Browser all-day/DST and API tests |
| Select/Listbox | Native select/datalist | Existing CPU and calendar field markup | OS-owned dropdown geometry is accepted | Browser mobile/keyboard checks |
| Form | event-form, shared request helper | calendar/calendar.js and protected API | Create, series edit, occurrence edit, read-only view | Browser save/conflict/cancel tests |
| CRUD | Protected calendar API, ETags, idempotency key | Session permission and iCloud conditional writes | No background queue or automatic destructive retry | Live temporary-event CRUD test and mocked UI tests |

## Session and permissions

Missing session redirects once to central login with fixed calendar returnTo. A signed-in account without calendar access sees permission guidance. Network/service failure shows an offline state, never a login loop or a claim that a write succeeded. Dashboard, Admin, and Calendar links use separate server capabilities. Account failures leave public content usable.

## Events and editing

Event titles, locations and notes use textContent or form values. Dialogs are native semantic dialog elements, styled with shared tokens. Custom validation owns errors; no native validation bubbles. Fields remain intact on errors. Dirty cancel and destructive delete use app-owned confirmation dialogs with Cancel focused first. Read-only calendars and scheduled invitations cannot be modified. Preserve unrelated iCalendar properties and recurrence exceptions. Event notifications are saved as iCalendar alarms and delivered by calendar clients.

## Offline and privacy

Never persist private events to localStorage, IndexedDB, caches or service workers. Drafts remain only in current page memory. Offline state disables writes, retains unsaved editor content and permits explicit retry. A lost response may follow a successful iCloud write; reuse the request key for a create retry and refresh to resolve edits. Controls start disabled until JavaScript attaches their handlers. No-JavaScript visitors retain the public portfolio and explanatory calendar text.

## Calendar views and overlays

`calendar/calendar.js` owns the day/week/month renderer and range navigation. The existing native month input remains the date-entry owner; calendar-grid date buttons navigate rather than edit date fields. Week begins Monday. Day/week show all 24 local wall-clock hours in the API-provided IANA timezone, with all-day events above the timeline. On daylight-saving transition days, positioning follows wall-clock time; the editor's explicit date/time/timezone values remain authoritative. Timed overlaps use separate columns; calendar checkboxes hide/show already-fetched calendars without changing the write destination. New events default to a visible writable calendar and the selected date. Events from all authorized calendars are requested together, and a failure marks the entire refresh unsuccessful rather than implying missing calendars are empty. View/date/visibility are transient in-memory workspace state; private event data is never persisted. Writes retain the existing authenticated API contract. Calendar workspace changes do not modify the public availability API or its disclosure rules.

## Event availability tags

The editor reads the existing case-insensitive `(public)` and `(private)` tags from iCloud Notes, with Private winning when both occur. The Availability tag field owns these markers and the Notes control shows the remaining text. An explicit choice writes the corresponding marker through the existing authenticated event save. No tag removes the marker. The portfolio continues to use its existing disclosure rules, including any calendar-wide overrides.

## Service status controls

The shared account header groups Calendar, Service status, and Ches Booking under Tools. Ches Booking launches its Authentik app on api.ches.dev. Each link requires its own session capability. The Service status workspace reads and updates the monitored inventory through the portfolio session API. Every change requires the Authentik `services:manage` permission. The backend stores the override by service ID. Disabled takes precedence over live health for the public status label, and Use live checks removes the override. A failed save requires an explicit refresh before another edit, so a lost response cannot be mistaken for a failed change.

## Quick search and keyboard shortcuts

`static/keyboard.js` and `static/keyboard.css` own the shared toolbar and Quick Search. The toolbar keeps the site name, Quick Search, and Menu on one row. Menu holds the existing navigation and account controls. Escape closes either surface and restores focus to its trigger. Arrow Up and Arrow Down navigate the results. Enter runs the selected command. Page shortcuts use Option+Shift on macOS or Alt+Shift elsewhere and yield to editable fields and open app dialogs. The CPU, Printed, and Scout demos use their own controls and have no shared Quick Search or shortcuts.

All starts with favorites, suggested work, and up to three other recent commands. It then lists the full catalog available to the current account. A single filter switches between the full catalog, current page, available apps, or a named section. Search gives direct command names priority over aliases and section names. Settings manages favorites, recent commands, and the open shortcut. The browser stores known command IDs and the shortcut choice per site. Search text, file names, invitation links, and private records stay out of history.

Ches Drop searches the signed-in user’s own library through the existing file API and opens the protected preview. A new query cancels the previous one. Saving, deletion, and service-state changes follow their original controls and confirmation paths. Reduced-motion preferences disable palette, menu, and result transitions. Commands run immediately after selection, including actions that open the browser’s file picker or write to the clipboard.

Calendar can check for a 30-minute gap in the selected calendars over the next 14 days. The search considers weekday hours from 9 AM to 5 PM in the calendar’s time zone. A failed calendar read or a changed calendar selection prevents a result.
