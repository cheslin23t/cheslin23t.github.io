"use strict";
(() => {
  const panel = document.querySelector("#availability");
  const link = document.querySelector(".availability-link");
  if (!panel || !link) return;
  const labels = document.querySelectorAll("[data-availability-label]");
  const detail = panel.querySelector("#availability-detail");
  const checked = panel.querySelector("#availability-checked");
  const note =
    "Only events I’ve marked public appear here. Email me to arrange a time.";
  const format = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const visible = new Set();
  let snapshot;
  let receivedAt = -Infinity;
  let lastStarted = -Infinity;
  let pending;
  let timer;
  let expiry;
  let paused = false;
  let failed = false;
  const eligible = () => visible.size > 0 && !document.hidden && !paused;
  const date = (value) =>
    typeof value === "string" && Number.isFinite(Date.parse(value))
      ? Date.parse(value)
      : null;
  const setText = (element, text) => {
    if (element.textContent !== text) element.textContent = text;
  };
  function normalize(data) {
    if (
      !data ||
      typeof data.stale !== "boolean" ||
      date(data.generatedAt) === null ||
      !["free", "busy", "unknown"].includes(data.availability) ||
      !(
        data.calendarCheckedAt === null || date(data.calendarCheckedAt) !== null
      ) ||
      !(data.nextChangeAt === null || date(data.nextChangeAt) !== null)
    )
      throw new Error("Invalid availability response");
    const event = data.event;
    return {
      availability: data.availability,
      stale: data.stale,
      generatedAt: date(data.generatedAt),
      checkedAt: date(data.calendarCheckedAt),
      nextChange: date(data.nextChangeAt),
      event:
        event &&
        typeof event.title === "string" &&
        event.title.trim() &&
        typeof event.allDay === "boolean" &&
        date(event.startsAt) !== null &&
        date(event.endsAt) > date(event.startsAt)
          ? {
              title: event.title,
              start: date(event.startsAt),
              end: date(event.endsAt),
              allDay: event.allDay,
            }
          : null,
    };
  }
  function boundary() {
    if (!snapshot) return Infinity;
    return Math.min(
      snapshot.nextChange ?? Infinity,
      snapshot.availability === "busy" && snapshot.event
        ? snapshot.event.end
        : Infinity,
    );
  }
  function render() {
    clearTimeout(expiry);
    const outdated =
      snapshot &&
      (snapshot.stale ||
        Date.now() >= boundary() ||
        Date.now() - snapshot.generatedAt > 90000 ||
        performance.now() - receivedAt > 65000);
    const state =
      !snapshot || snapshot.checkedAt === null || failed || outdated
        ? "unknown"
        : snapshot.availability;
    const label =
      state === "free"
        ? "Calendar free"
        : state === "busy"
          ? "Calendar busy"
          : outdated
            ? "Calendar may be outdated"
            : "Calendar unavailable";
    labels.forEach((element) => setText(element, label));
    [panel, link].forEach((element) => {
      element.dataset.availability = state;
    });
    let text = note;
    if (state === "busy") {
      const event = snapshot.event;
      const activeEvent =
        event && event.start <= Date.now() && event.end > Date.now();
      text = activeEvent
        ? `${event.title}${event.allDay ? " · All day" : ""}. Ends ${format.format(event.end)}.`
        : "A public calendar event is in progress.";
      if (!activeEvent && snapshot.nextChange)
        text += ` Next change ${format.format(snapshot.nextChange)}.`;
      text += ` ${note}`;
    } else if (state === "free" && snapshot.nextChange) {
      text = `No public events until ${format.format(snapshot.nextChange)}. ${note}`;
    } else if (state === "unknown") {
      text = `Live availability ${outdated ? "may be outdated" : "is unavailable"}. Email me to arrange a time.`;
    }
    setText(detail, text);
    setText(
      checked,
      snapshot?.checkedAt
        ? `Calendar synced ${format.format(snapshot.checkedAt)}`
        : "",
    );
    if (eligible() && snapshot && !failed && !outdated) {
      const delay = Math.min(
        boundary() - Date.now(),
        65000 - (performance.now() - receivedAt),
        snapshot.generatedAt + 90000 - Date.now(),
      );
      expiry = setTimeout(
        () => {
          render();
          schedule();
        },
        Math.max(1, delay),
      );
    }
  }
  function schedule(delay = 0) {
    clearTimeout(timer);
    if (!eligible() || pending) return;
    timer = setTimeout(
      refresh,
      Math.max(delay, 10000 - (performance.now() - lastStarted)),
    );
  }
  async function refresh() {
    if (!eligible() || pending) return;
    lastStarted = performance.now();
    const request = { controller: new AbortController(), interrupted: false };
    pending = request;
    const timeout = setTimeout(() => request.controller.abort(), 8000);
    try {
      const response = await fetch("https://api.ches.dev/v1/availability", {
        signal: request.controller.signal,
        credentials: "omit",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Availability HTTP ${response.status}`);
      const result = normalize(await response.json());
      if (!request.interrupted) {
        snapshot = result;
        receivedAt = performance.now();
        failed = false;
        render();
      }
    } catch {
      if (!request.interrupted) {
        failed = true;
        render();
      }
    } finally {
      clearTimeout(timeout);
      pending = null;
      schedule(request.interrupted ? 0 : 30000);
    }
  }
  function updateActivity() {
    clearTimeout(timer);
    clearTimeout(expiry);
    if (!eligible()) {
      if (pending) {
        pending.interrupted = true;
        pending.controller.abort();
      }
      return;
    }
    // Revalidate before reusing a snapshot after scrolling or returning to the tab.
    if (snapshot) render();
    schedule();
  }
  labels.forEach((element) => setText(element, "Checking calendar…"));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) =>
        entry.isIntersecting
          ? visible.add(entry.target)
          : visible.delete(entry.target),
      );
      updateActivity();
    });
    observer.observe(link);
    observer.observe(panel);
  } else {
    visible.add(panel);
    updateActivity();
  }
  document.addEventListener("visibilitychange", updateActivity);
  addEventListener("pagehide", () => {
    paused = true;
    updateActivity();
  });
  addEventListener("pageshow", () => {
    paused = false;
    updateActivity();
  });
})();
