(() => {
  const api = "https://api.ches.dev",
    $ = (id) => document.getElementById(id),
    editor = $("event-editor"),
    form = $("event-form"),
    confirm = $("confirm-action");
  let calendars = [],
    events = [],
    timeZone = "America/New_York",
    online = false,
    loading = false,
    selected = null,
    busy = false,
    dirty = false,
    pendingConfirm = null,
    requestId = null,
    loadVersion = 0;
  const errors = {
    calendar_permission_required:
      "Your account does not have calendar access. Ask the owner to enable calendar access for you.",
    event_changed_refresh_required:
      "This event changed in iCloud. Close the editor and refresh before saving.",
    calendar_read_only: "This calendar is read-only.",
    invalid_event_dates:
      "Check the start and end dates. The end must be after the start.",
    invalid_time_zone: "Enter a valid time zone, such as America/New_York.",
    invalid_recurrence: "Check the custom recurrence rule.",
    invalid_reminders:
      "Use up to five whole-minute reminder values between 0 and 525600.",
    idempotency_key_reused:
      "That save may already have completed. Close the editor and refresh before changing it.",
    scheduled_event_requires_calendar_client:
      "Invitation changes need a scheduling-aware calendar app.",
    recurrence_too_large: "This recurring event is too large to expand safely.",
    unsupported_event_data:
      "A calendar event could not be read safely. Try another calendar.",
  };
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(api + path, {
        ...options,
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(26000),
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });
    } catch {
      throw Object.assign(
        new Error(
          "Calendar offline. This server must be on to load or save events.",
        ),
        { offline: true },
      );
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw Object.assign(
        new Error("Calendar service unavailable. Try again later."),
        { offline: true },
      );
    }
    if (!response.ok) {
      if (response.status === 401) {
        events = [];
        location.replace(api + "/site-auth/login?returnTo=calendar");
      }
      throw Object.assign(
        new Error(
          errors[data.error] ??
            (response.status >= 500
              ? "Calendar offline. Your events remain in iCloud; refresh when the server is back."
              : "Unable to complete this request. Refresh and try again."),
        ),
        { status: response.status, offline: response.status >= 500 },
      );
    }
    return data;
  }
  function message(title, description, retry = true) {
    $("access-title").textContent = title;
    $("access-description").textContent = description;
    $("access-message").hidden = false;
    $("retry-access").hidden = !retry;
  }
  function unavailable(error) {
    online = false;
    $("new-event").disabled = true;
    $("delete-event").disabled = true;
    $("save-event").disabled = true;
    $("calendar-status").textContent = "Calendar offline";
    message("Calendar is unavailable", error.message);
  }
  function localToday() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  function nextDay(date, amount = 1) {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + amount);
    return d.toISOString().slice(0, 10);
  }
  function midnight(date) {
    const [y, m, d] = date.split("-").map(Number),
      wanted = Date.UTC(y, m - 1, d);
    let guess = wanted;
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    for (let n = 0; n < 4; n++) {
      const parts = Object.fromEntries(
        fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]),
      );
      const seen = Date.UTC(
        +parts.year,
        +parts.month - 1,
        +parts.day,
        +parts.hour,
        +parts.minute,
        +parts.second,
      );
      guess += wanted - seen;
    }
    return new Date(guess).toISOString();
  }
  function button(label, action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", action);
    return b;
  }
  const palette = [
    "#007aaf",
    "#9850a4",
    "#327c4a",
    "#b05c20",
    "#bd4054",
    "#5365b7",
  ];
  let activeDate = "",
    view = matchMedia("(max-width: 760px)").matches ? "day" : "week",
    visibleCalendars = new Set(),
    initialized = false,
    loadedRange = "",
    dayFormatter,
    eventSpans = new WeakMap();
  const dateKey = (value) =>
    (dayFormatter ??= new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })).format(new Date(value));
  const dateLabel = (day, options) =>
    new Intl.DateTimeFormat(undefined, { timeZone: "UTC", ...options }).format(
      new Date(day + "T12:00:00Z"),
    );
  function visibleDays() {
    if (view === "day") return [activeDate];
    const d = new Date(activeDate + "T12:00:00Z");
    if (view === "month") d.setUTCDate(1);
    const start = nextDay(
      d.toISOString().slice(0, 10),
      -((d.getUTCDay() + 6) % 7),
    );
    return Array.from({ length: view === "week" ? 7 : 42 }, (_, i) =>
      nextDay(start, i),
    );
  }
  function range() {
    const days = visibleDays();
    return { from: midnight(days[0]), to: midnight(nextDay(days.at(-1))) };
  }
  function color(event) {
    return palette[
      Math.max(
        0,
        calendars.findIndex((c) => c.id === event.calendarId),
      ) % palette.length
    ];
  }
  function eventDays(event) {
    if (eventSpans.has(event)) return eventSpans.get(event);
    const span = {
      start: event.allDay ? event.start.slice(0, 10) : dateKey(event.startsAt),
      end: event.allDay
        ? event.end.slice(0, 10)
        : dateKey(new Date(new Date(event.endsAt).getTime() - 1)),
    };
    eventSpans.set(event, span);
    return span;
  }
  function onDay(event, day) {
    const span = eventDays(event);
    return (
      span.start <= day && (event.allDay ? span.end > day : span.end >= day)
    );
  }
  function filtered() {
    return events.filter((e) => visibleCalendars.has(e.calendarId));
  }
  // Keep the editor and portfolio availability in sync through iCloud Notes.
  function availabilityTag(description = "") {
    if (/\(private\)/i.test(description)) return "private";
    return /\(public\)/i.test(description) ? "public" : "";
  }

  function eventButton(event, compact = false) {
    const b = button("", () => openEditor(event));
    b.className = "calendar-event" + (compact ? " compact" : "");
    b.style.setProperty("--event-color", color(event));
    const title = document.createElement("strong");
    title.textContent = event.title || "Untitled event";
    const meta = document.createElement("span");
    const timeFormat = new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    });
    meta.textContent = event.allDay
      ? "All day"
      : timeFormat.format(new Date(event.startsAt)) +
        " – " +
        timeFormat.format(new Date(event.endsAt));
    const tag = availabilityTag(event.description);
    const tagLabel = { private: "Private", public: "Public" }[tag];
    const titleRow = document.createElement("div");
    titleRow.className = "event-title-row";
    titleRow.append(title);
    if (tagLabel) {
      const badge = document.createElement("small");
      badge.className = "event-tag";
      badge.textContent = tagLabel;
      titleRow.append(badge);
    }
    b.append(titleRow, meta);
    b.title = [
      event.title,
      meta.textContent,
      calendars.find((c) => c.id === event.calendarId)?.name,
      event.location,
      tagLabel,
      event.writable ? "" : "Read-only",
    ]
      .filter(Boolean)
      .join(" · ");
    b.setAttribute("aria-label", b.title);
    return b;
  }
  function renderToggles() {
    $("calendar-toggles").replaceChildren();
    calendars.forEach((c, i) => {
      const label = document.createElement("label");
      label.className = "calendar-toggle";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = visibleCalendars.has(c.id);
      input.style.setProperty("--calendar-color", palette[i % palette.length]);
      input.addEventListener("change", () => {
        input.checked
          ? visibleCalendars.add(c.id)
          : visibleCalendars.delete(c.id);
        render();
        $("toggle-calendars").textContent = visibleCalendars.size
          ? "Hide all"
          : "Show all";
      });
      const text = document.createElement("span");
      text.textContent = c.name;
      label.append(input, text);
      if (!c.writable) {
        const small = document.createElement("small");
        small.textContent = "Read-only";
        label.append(small);
      }
      $("calendar-toggles").append(label);
    });
    $("toggle-calendars").textContent = visibleCalendars.size
      ? "Hide all"
      : "Show all";
  }
  function render() {
    if (!activeDate) return;
    const target = $("event-list"),
      days = visibleDays(),
      shown = filtered();
    const oldScroller = target.querySelector(".time-scroll"),
      scroll = oldScroller?.scrollTop,
      scrollLeft = oldScroller?.scrollLeft ?? 0;
    target.replaceChildren();
    target.dataset.view = view;
    $("range-title").textContent =
      view === "day"
        ? dateLabel(activeDate, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : view === "month"
          ? dateLabel(activeDate, { month: "long", year: "numeric" })
          : dateLabel(days[0], { month: "short", day: "numeric" }) +
            " – " +
            dateLabel(days.at(-1), {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
    $("calendar-zone").textContent = timeZone.replaceAll("_", " ");
    $("view-message").textContent = !visibleCalendars.size
      ? "Select a calendar to show its events."
      : shown.length
        ? ""
        : "No events in this view. Your time is clear.";
    for (const b of document.querySelectorAll(".view-switch [data-view]"))
      b.setAttribute("aria-pressed", String(b.dataset.view === view));
    for (const [id, word] of [
      ["previous-month", "Previous"],
      ["next-month", "Next"],
    ])
      $(id).setAttribute("aria-label", word + " " + view);
    const today = localToday();
    if (view === "month") {
      const grid = document.createElement("div");
      grid.className = "month-grid";
      days.slice(0, 7).forEach((day) => {
        const h = document.createElement("div");
        h.className = "month-weekday";
        h.textContent = dateLabel(day, { weekday: "short" });
        grid.append(h);
      });
      days.forEach((day) => {
        const cell = document.createElement("section");
        cell.className =
          "month-cell" +
          (day.slice(0, 7) !== activeDate.slice(0, 7) ? " outside-month" : "");
        cell.setAttribute("aria-label", dateLabel(day, { dateStyle: "full" }));
        const date = button(day.slice(-2).replace(/^0/, ""), () =>
          changeView("day", day),
        );
        date.className = "month-date" + (day === today ? " is-today" : "");
        date.setAttribute(
          "aria-label",
          "View " + dateLabel(day, { dateStyle: "full" }),
        );
        if (day === today) date.setAttribute("aria-current", "date");
        cell.append(date);
        const dayEvents = shown.filter((e) => onDay(e, day));
        dayEvents.slice(0, 3).forEach((e) => cell.append(eventButton(e, true)));
        if (dayEvents.length > 3) {
          const more = button(`+${dayEvents.length - 3} more`, () =>
            changeView("day", day),
          );
          more.className = "more-events";
          more.setAttribute(
            "aria-label",
            `View all ${dayEvents.length} events on ${dateLabel(day, { dateStyle: "full" })}`,
          );
          cell.append(more);
        }
        grid.append(cell);
      });
      target.append(grid);
      return;
    }
    const header = document.createElement("div");
    header.className = "time-header";
    header.style.setProperty("--days", days.length);
    const corner = document.createElement("span");
    corner.className = "time-corner";
    corner.textContent = "All day";
    header.append(corner);
    days.forEach((day) => {
      const col = document.createElement("div");
      col.className = "time-day-heading";
      const date = button("", () => changeView("day", day));
      date.className = "day-heading" + (day === today ? " is-today" : "");
      const name = document.createElement("span");
      name.textContent = dateLabel(day, { weekday: "short" });
      const num = document.createElement("strong");
      num.textContent = String(Number(day.slice(-2)));
      date.append(name, num);
      date.setAttribute(
        "aria-label",
        "View " + dateLabel(day, { dateStyle: "full" }),
      );
      col.append(date);
      shown
        .filter((e) => e.allDay && onDay(e, day))
        .forEach((e) => col.append(eventButton(e, true)));
      header.append(col);
    });
    const scroller = document.createElement("div");
    scroller.className = "time-scroll";
    scroller.tabIndex = 0;
    scroller.setAttribute("role", "region");
    scroller.setAttribute("aria-label", "24-hour " + view + " timeline");
    const grid = document.createElement("div");
    grid.className = "time-grid";
    grid.style.setProperty("--days", days.length);
    const axis = document.createElement("div");
    axis.className = "time-axis";
    for (let h = 0; h < 24; h++) {
      const tick = document.createElement("span");
      tick.style.top = h * 64 + "px";
      tick.textContent = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2026, 0, 1, h)));
      axis.append(tick);
    }
    grid.append(axis);
    days.forEach((day) => {
      const col = document.createElement("div");
      col.className = "time-column" + (day === today ? " current-day" : "");
      const minute = (value) => {
        const parts = Object.fromEntries(
          new Intl.DateTimeFormat("en-GB", {
            timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          })
            .formatToParts(new Date(value))
            .map((p) => [p.type, p.value]),
        );
        return Number(parts.hour) * 60 + Number(parts.minute);
      };
      const items = shown
        .filter((e) => !e.allDay && onDay(e, day))
        .map((event) => ({
          event,
          start: dateKey(event.startsAt) < day ? 0 : minute(event.startsAt),
          end: dateKey(event.endsAt) > day ? 1440 : minute(event.endsAt),
        }))
        .sort((a, b) => a.start - b.start || b.end - a.end);
      let group = [],
        groupEnd = -1;
      const groups = [];
      for (const item of items) {
        item.end = Math.max(item.start + 15, item.end);
        if (group.length && item.start >= groupEnd) {
          groups.push(group);
          group = [];
          groupEnd = -1;
        }
        group.push(item);
        groupEnd = Math.max(groupEnd, item.end);
      }
      if (group.length) groups.push(group);
      for (const cluster of groups) {
        const lanes = [];
        for (const item of cluster) {
          let lane = lanes.findIndex((end) => end <= item.start);
          if (lane < 0) lane = lanes.length;
          lanes[lane] = item.end;
          item.lane = lane;
        }
        for (const item of cluster) {
          const b = eventButton(item.event);
          b.style.top = (item.start / 60) * 64 + "px";
          b.style.height =
            Math.max(22, ((item.end - item.start) / 60) * 64 - 2) + "px";
          b.style.left = `calc(${(item.lane / lanes.length) * 100}% + 3px)`;
          b.style.width = `calc(${100 / lanes.length}% - 6px)`;
          col.append(b);
        }
      }
      if (day === today) {
        const now = document.createElement("div");
        now.className = "now-line";
        now.style.top = (minute(new Date()) / 60) * 64 + "px";
        now.setAttribute("role", "img");
        now.setAttribute("aria-label", "Current time");
        col.append(now);
      }
      grid.append(col);
    });
    scroller.append(header, grid);
    target.append(scroller);
    scroller.scrollTop = scroll ?? 7 * 64 - 12;
    scroller.scrollLeft = scrollLeft;
  }
  function setNavigationLoading(value) {
    for (const b of document.querySelectorAll(
      ".date-navigation button,.view-switch button,#refresh-calendar,#month",
    ))
      b.disabled = value;
  }
  async function load() {
    const generation = ++loadVersion;
    loading = true;
    const requestedRange = range();
    const key = JSON.stringify(requestedRange);
    if (key !== loadedRange) {
      events = [];
      render();
    }
    $("event-list").setAttribute("aria-busy", "true");
    $("calendar-status").textContent = "Syncing calendars…";
    $("view-message").textContent = "Loading your events…";
    setNavigationLoading(true);
    try {
      const results = await Promise.all(
        calendars.map(async (c) => {
          const data = await request(
            "/calendar/v1/calendars/" +
              encodeURIComponent(c.id) +
              "/events?" +
              new URLSearchParams(requestedRange),
          );
          return data.events.map((e) => ({
            ...e,
            calendarId: c.id,
            writable: e.writable && c.writable,
          }));
        }),
      );
      if (generation !== loadVersion) return;
      events = results
        .flat()
        .sort((a, b) =>
          (a.startsAt ?? a.start).localeCompare(b.startsAt ?? b.start),
        );
      loadedRange = key;
      online = true;
      if (editor.open && !busy) {
        $("save-event").disabled = false;
        $("delete-event").disabled = false;
      }
      $("access-message").hidden = true;
      $("calendar-status").textContent =
        "Updated " +
        new Date().toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        });
      $("new-event").disabled = !calendars.some((c) => c.writable);
      render();
    } catch (e) {
      if (generation !== loadVersion) return;
      events = [];
      render();
      $("view-message").textContent =
        "Events could not be loaded. Try refreshing.";
      if (e.offline) unavailable(e);
      else {
        online = false;
        $("new-event").disabled = true;
        $("save-event").disabled = true;
        $("delete-event").disabled = true;
        $("calendar-status").textContent = "Could not sync calendars";
        message("Could not load events", e.message);
      }
    } finally {
      if (generation === loadVersion) {
        loading = false;
        $("event-list").setAttribute("aria-busy", "false");
        setNavigationLoading(false);
      }
    }
  }
  async function start() {
    if (loading || busy) return;
    try {
      const state = await request("/site-auth/session");
      if (!state.authenticated) {
        online = false;
        events = [];
        $("calendar-app").hidden = true;
        $("new-event").disabled = true;
        location.replace(api + "/site-auth/login?returnTo=calendar");
        return;
      }
      if (state.calendarUrl !== "https://ches.dev/calendar/") {
        online = false;
        events = [];
        $("event-list").replaceChildren();
        $("calendar-app").hidden = true;
        $("new-event").disabled = true;
        message(
          "Calendar access required",
          errors.calendar_permission_required,
          false,
        );
        $("calendar-status").textContent = "No calendar permission";
        return;
      }
      const data = await request("/calendar/v1/calendars");
      calendars = data.calendars;
      timeZone = data.timeZone;
      dayFormatter = undefined;
      eventSpans = new WeakMap();
      visibleCalendars = new Set(
        calendars
          .filter((c) => !initialized || visibleCalendars.has(c.id))
          .map((c) => c.id),
      );
      initialized = true;
      $("event-calendar").replaceChildren();
      for (const c of calendars) {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = c.name + (c.writable ? "" : " (read-only)");
        o.disabled = !c.writable;
        $("event-calendar").append(o);
      }
      if (!calendars.length) {
        events = [];
        $("event-list").replaceChildren();
        $("new-event").disabled = true;
        message("No calendars found", "Check your iCloud calendar connection.");
        return;
      }
      if (!activeDate) activeDate = localToday();
      $("month").value = activeDate.slice(0, 7);
      $("calendar-app").hidden = false;
      $("toggle-calendars").disabled = false;
      renderToggles();
      render();
      await load();
    } catch (e) {
      unavailable(e);
    }
  }
  function changeView(next, date = activeDate) {
    view = next;
    activeDate = date;
    $("month").value = activeDate.slice(0, 7);
    render();
    load();
  }
  function repeatChanged() {
    const value = $("repeat-frequency").value;
    $("custom-rule-label").hidden = value !== "custom";
    if (value !== "custom")
      $("event-recurrence").value = value ? "FREQ=" + value : "";
  }
  function fill(e) {
    $("event-title").value = e.title ?? "";
    const description = e.description ?? "";
    $("event-availability").value = availabilityTag(description);
    $("event-description").value = description.replace(
      /(?:\r?\n\r?\n)?\((?:public|private)\)$|\((?:public|private)\)/gi,
      "",
    );
    $("event-location").value = e.location ?? "";
    $("event-all-day").checked = e.allDay === true;
    $("event-start").type = e.allDay ? "date" : "datetime-local";
    $("event-end").type = e.allDay ? "date" : "datetime-local";
    $("event-start").value = e.start ?? "";
    $("event-end").value = e.allDay ? nextDay(e.end, -1) : (e.end ?? "");
    $("event-timezone").value = e.timeZone ?? timeZone;
    $("event-reminders").value = (e.reminders ?? []).join(", ");
    const simple = /^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)$/.exec(
      e.recurrence ?? "",
    );
    $("repeat-frequency").value = !e.recurrence
      ? ""
      : simple
        ? simple[1]
        : "custom";
    $("event-recurrence").value = e.recurrence ?? "";
    repeatChanged();
    $("repeat-fields").hidden =
      selected?.recurring && $("edit-scope").value === "occurrence";
    $("editor-note").textContent = e.scheduled
      ? "This event has invitations. It can be viewed here; use your calendar app to change attendees or scheduling."
      : e.hasOtherReminders
        ? "This event has additional alarm types. They will be preserved unless you change the reminder field."
        : "";
    dirty = false;
  }
  function openEditor(event = null) {
    delete $("event-reminders").dataset.changed;
    selected = event;
    requestId = crypto.randomUUID();
    busy = false;
    $("editor-error").textContent = "";
    $("editor-title").textContent = event
      ? event.writable
        ? "Edit event"
        : "View event"
      : "New event";
    $("scope-label").hidden = !event?.recurring;
    $("edit-scope").value = "occurrence";
    $("event-calendar").value =
      event?.calendarId ??
      (
        calendars.find((c) => visibleCalendars.has(c.id) && c.writable) ??
        calendars.find((c) => c.writable)
      )?.id;
    $("event-calendar").disabled = !!event;
    $("event-fields").disabled = !!event && !event.writable;
    $("save-event").hidden = !!event && !event.writable;
    $("save-event").disabled = !online;
    fill(
      event ?? {
        title: "",
        description: "",
        location: "",
        start: (activeDate || localToday()) + "T09:00",
        end: (activeDate || localToday()) + "T10:00",
        timeZone,
        allDay: false,
        recurrence: "",
        reminders: [],
      },
    );
    $("delete-event").hidden = !event?.writable;
    $("delete-event").disabled = !online;
    editor.showModal();
    editor.querySelector(".editor-body").scrollTop = 0;
    $("event-title").focus();
  }
  function confirmAction(title, description, label, action) {
    $("confirm-title").textContent = title;
    $("confirm-description").textContent = description;
    $("confirm-accept").textContent = label;
    $("confirm-cancel").textContent = "Cancel";
    pendingConfirm = action;
    confirm.showModal();
    $("confirm-cancel").focus();
  }
  function closeEditor() {
    if (busy) return;
    if (dirty)
      confirmAction(
        "Discard unsaved changes?",
        "Your changes have not been saved.",
        "Discard changes",
        () => {
          dirty = false;
          editor.close();
        },
      );
    else editor.close();
  }
  function values() {
    const allDay = $("event-all-day").checked;
    const title = $("event-title").value.trim(),
      start = $("event-start").value,
      end = $("event-end").value;
    if (!title) {
      $("event-title").focus();
      throw new Error("Enter an event title.");
    }
    if (!start || !end) {
      $("event-start").focus();
      throw new Error("Choose start and end dates.");
    }
    const notes = $("event-description").value;
    if (availabilityTag(notes)) {
      $("event-description").focus();
      throw new Error("Remove the marker from Notes and choose Public or Private under Availability tag.");
    }
    const tag = $("event-availability").value;
    const description = tag ? [notes, "(" + tag + ")"].filter(Boolean).join("\n\n") : notes;
    if (description.length > 20000) {
      $("event-description").focus();
      throw new Error("Shorten the notes so they fit with the availability tag.");
    }
    return {
      title,
      description,
      location: $("event-location").value,
      allDay,
      start,
      end: allDay ? nextDay(end) : end,
      timeZone: $("event-timezone").value,
      recurrence: $("event-recurrence").value,
      reminders: $("event-reminders").value.trim()
        ? $("event-reminders")
            .value.split(",")
            .map((x) => Number(x.trim()))
        : [],
      preserveReminders:
        !!selected?.hasOtherReminders && !$("event-reminders").dataset.changed,
    };
  }
  form.addEventListener("input", (e) => {
    if (e.target !== $("edit-scope")) dirty = true;
    if (e.target === $("event-reminders"))
      $("event-reminders").dataset.changed = "true";
  });
  $("edit-scope").addEventListener("change", () => {
    const wanted = $("edit-scope").value;
    const apply = () => {
      fill(wanted === "series" ? selected.series : selected);
      $("edit-scope").value = wanted;
      $("repeat-fields").hidden = wanted === "occurrence";
    };
    if (dirty) {
      $("edit-scope").value = wanted === "series" ? "occurrence" : "series";
      confirmAction(
        "Change editing scope?",
        "This replaces unsaved field changes with the selected occurrence or series.",
        "Change scope",
        apply,
      );
    } else apply();
  });
  $("event-all-day").addEventListener("change", () => {
    const allDay = $("event-all-day").checked;
    for (const id of ["event-start", "event-end"]) {
      const value = $(id).value;
      $(id).type = allDay ? "date" : "datetime-local";
      $(id).value = allDay ? value.slice(0, 10) : value + "T09:00";
    }
  });
  $("repeat-frequency").addEventListener("change", repeatChanged);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy || !online) return;
    let event;
    try {
      event = values();
    } catch (error) {
      $("editor-error").textContent = error.message;
      return;
    }
    busy = true;
    $("event-fields").disabled = true;
    $("save-event").disabled = true;
    $("save-event").textContent = "Saving…";
    $("editor-error").textContent = "";
    try {
      const calendar = selected?.calendarId ?? $("event-calendar").value;
      const url =
        "/calendar/v1/calendars/" +
        encodeURIComponent(calendar) +
        "/events" +
        (selected ? "/" + encodeURIComponent(selected.id) : "");
      await request(url, {
        method: selected ? "PATCH" : "POST",
        headers: selected
          ? { "If-Match": selected.etag }
          : { "Idempotency-Key": requestId },
        body: JSON.stringify(
          selected
            ? {
                event,
                scope: selected.recurring ? $("edit-scope").value : "series",
                recurrenceId: selected.recurrenceId,
              }
            : event,
        ),
      });
      dirty = false;
      editor.close();
      await load();
    } catch (error) {
      $("editor-error").textContent =
        error.message +
        (error.offline
          ? " Retry uses the same request key to avoid creating a duplicate."
          : "");
      if (error.offline) unavailable(error);
    } finally {
      busy = false;
      $("event-fields").disabled = !!selected && !selected.writable;
      $("event-calendar").disabled = !!selected;
      $("save-event").disabled = !online;
      $("save-event").textContent = "Save event";
    }
  });
  function deleteEvent(event) {
    if (!online) return;
    const recurring = event.recurring;
    const choose = () =>
      confirmAction(
        "Delete " + event.title + "?",
        recurring
          ? "Delete this occurrence only? To delete the entire series, use the series option below."
          : "This permanently removes the event from iCloud.",
        "Delete " + (recurring ? "occurrence" : "event"),
        () => remove("occurrence"),
      );
    const remove = async (scope) => {
      try {
        await request(
          "/calendar/v1/calendars/" +
            encodeURIComponent(event.calendarId) +
            "/events/" +
            encodeURIComponent(event.id) +
            "?" +
            new URLSearchParams({
              scope: recurring ? scope : "series",
              ...(recurring ? { recurrenceId: event.recurrenceId } : {}),
            }),
          { method: "DELETE", headers: { "If-Match": event.etag } },
        );
        await load();
      } catch (error) {
        if (error.offline) unavailable(error);
        else message("Could not delete event", error.message);
      }
    };
    if (recurring) {
      confirmAction(
        "Delete repeating event?",
        "Choose whether to remove this occurrence or the entire series.",
        "Only this occurrence",
        () => remove("occurrence"),
      );
      const series = button("Entire series", () => {
        confirm.close();
        confirmAction(
          "Delete the entire series?",
          "All occurrences of " + event.title + " will be removed from iCloud.",
          "Delete series",
          () => remove("series"),
        );
      });
      series.dataset.seriesDelete = "true";
      $("confirm-accept").before(series);
    } else choose();
  }
  $("confirm-cancel").addEventListener("click", () => {
    confirm.close();
    pendingConfirm = null;
  });
  confirm.addEventListener("close", () => {
    for (const b of confirm.querySelectorAll("[data-series-delete]"))
      b.remove();
  });
  $("confirm-accept").addEventListener("click", () => {
    const action = pendingConfirm;
    pendingConfirm = null;
    confirm.close();
    action?.();
  });
  editor.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeEditor();
  });
  $("close-editor").addEventListener("click", closeEditor);
  $("cancel-editor").addEventListener("click", closeEditor);
  $("new-event").addEventListener("click", () => {
    delete $("event-reminders").dataset.changed;
    openEditor();
  });
  $("retry-access").addEventListener("click", start);
  $("refresh-calendar").addEventListener("click", load);
  $("month").addEventListener("change", () => {
    if (/^\d{4}-\d{2}$/.test($("month").value))
      changeView(view, $("month").value + "-01");
  });
  for (const [id, amount] of [
    ["previous-month", -1],
    ["next-month", 1],
  ])
    $(id).addEventListener("click", () => {
      const d = new Date(activeDate + "T12:00:00Z");
      if (view === "month") {
        d.setUTCDate(1);
        d.setUTCMonth(d.getUTCMonth() + amount);
      } else d.setUTCDate(d.getUTCDate() + amount * (view === "week" ? 7 : 1));
      changeView(view, d.toISOString().slice(0, 10));
    });
  $("today").addEventListener("click", () => changeView(view, localToday()));
  for (const b of document.querySelectorAll(".view-switch [data-view]"))
    b.addEventListener("click", () => changeView(b.dataset.view));
  $("toggle-calendars").addEventListener("click", () => {
    visibleCalendars = visibleCalendars.size
      ? new Set()
      : new Set(calendars.map((c) => c.id));
    renderToggles();
    render();
  });
  $("delete-event").addEventListener("click", () => {
    if (selected && !busy && online) {
      const e = selected;
      const remove = () => {
        dirty = false;
        editor.close();
        deleteEvent(e);
      };
      if (dirty)
        confirmAction(
          "Discard unsaved changes?",
          "Your changes have not been saved.",
          "Discard changes",
          remove,
        );
      else remove();
    }
  });
  addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  setInterval(() => {
    if (!document.hidden && !editor.open) start();
  }, 60000);
  if (Intl.supportedValuesOf)
    for (const zone of Intl.supportedValuesOf("timeZone")) {
      const o = document.createElement("option");
      o.value = zone;
      $("time-zones").append(o);
    }
  addEventListener("offline", () => {
    loadVersion++;
    loading = false;
    $("event-list").setAttribute("aria-busy", "false");
    setNavigationLoading(false);
    $("view-message").textContent =
      "Calendar offline. Refresh to check your schedule.";
    unavailable(
      new Error(
        "Your connection is offline. Unsaved editor changes remain here until you close this page.",
      ),
    );
  });
  addEventListener("online", () => {
    if (!editor.open) start();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !editor.open) start();
  });
  for (const id of [
    "retry-access",
    "previous-month",
    "next-month",
    "refresh-calendar",
    "close-editor",
    "cancel-editor",
    "confirm-cancel",
    "confirm-accept",
  ])
    $(id).disabled = false;
  start();
})();
