"use strict";
(() => {
  const section = document.querySelector("#services");
  if (!section) return;
  const list = section.querySelector("#services-list");
  const message = section.querySelector("#services-status");
  const updated = section.querySelector("#services-updated");
  const states = new Map([
    ["running", "Running"],
    ["offline", "Offline"],
    ["starting", "Starting"],
    ["stopping", "Stopping"],
    ["restarting", "Restarting"],
    ["paused", "Paused"],
    ["unknown", "Unknown"],
  ]);
  const groups = new Map();
  const rows = new Map();
  const clock = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  let visible = false;
  let timer;
  let pending;
  let lastStarted = -Infinity;
  let snapshot;

  const eligible = () => visible && !document.hidden;
  const setMessage = (text) => {
    if (message.textContent !== text) message.textContent = text;
  };
  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }
  function reconcile(parent, children) {
    const keep = new Set(children);
    for (const child of [...parent.children])
      if (!keep.has(child)) child.remove();
    children.forEach((child, index) => {
      if (parent.children[index] !== child)
        parent.insertBefore(child, parent.children[index] || null);
    });
  }
  function normalize(data) {
    if (
      !data ||
      typeof data.stale !== "boolean" ||
      !Array.isArray(data.services) ||
      !Number.isFinite(Date.parse(data.generatedAt))
    )
      throw new Error("Invalid status response");
    const ids = new Set();
    const services = data.services.filter((service) => {
      if (
        !service ||
        typeof service.id !== "string" ||
        !service.id ||
        ids.has(service.id) ||
        typeof service.name !== "string" ||
        typeof service.category !== "string" ||
        typeof service.active !== "boolean" ||
        typeof service.state !== "string" ||
        typeof service.checkedAt !== "string"
      )
        return false;
      ids.add(service.id);
      return true;
    });
    if (data.services.length && !services.length)
      throw new Error("Invalid service inventory");
    return { services, stale: data.stale, generatedAt: data.generatedAt };
  }
  function render(outdated = false, failed = false) {
    if (!snapshot) {
      setMessage("Status unavailable. We’ll check again automatically.");
      section.dataset.stale = "true";
      return;
    }
    const stale = outdated || snapshot.stale;
    section.dataset.stale = String(stale);
    const services = [...snapshot.services].sort(
      (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    );
    const categories = [
      ...new Set(services.map((service) => service.category)),
    ].sort((a, b) => {
      const rank = (name) =>
        name === "web" ? 0 : name === "minecraft" ? 1 : 2;
      return rank(a) - rank(b) || a.localeCompare(b);
    });
    const currentIds = new Set(services.map((service) => service.id));
    for (const id of rows.keys()) if (!currentIds.has(id)) rows.delete(id);
    const groupElements = categories.map((category) => {
      if (!groups.has(category)) {
        const group = document.createElement("div");
        group.className = "service-group";
        const heading = document.createElement("h3");
        heading.textContent =
          category === "web"
            ? "Web"
            : category === "minecraft"
              ? "Minecraft"
              : category || "Other";
        const entries = document.createElement("ul");
        group.append(heading, entries);
        groups.set(category, { group, entries });
      }
      const { group, entries } = groups.get(category);
      const children = services
        .filter((service) => service.category === category)
        .map((service) => {
          if (!rows.has(service.id)) {
            const row = document.createElement("li");
            row.className = "service-row";
            row.dataset.serviceId = service.id;
            const state = document.createElement("span");
            state.className = "service-state";
            const time = document.createElement("time");
            row.append(document.createElement("span"), state, time);
            rows.set(service.id, { row, state, time });
          }
          const { row, state, time } = rows.get(service.id);
          const url = safeUrl(service.publicUrl);
          let name = row.firstElementChild;
          if ((name.tagName === "A") !== Boolean(url)) {
            const replacement = document.createElement(url ? "a" : "span");
            name.replaceWith(replacement);
            name = replacement;
          }
          name.className = "service-name";
          name.textContent = service.name;
          if (url) name.href = url;
          const known = states.has(service.state);
          const online = known && service.state === "running" && service.active;
          const label = !known
            ? "Unknown"
            : service.state === "running" && !service.active
              ? "Offline"
              : states.get(service.state);
          state.textContent = stale
            ? `Last known: ${label.toLowerCase()}`
            : label;
          state.dataset.tone = stale
            ? "neutral"
            : online
              ? "online"
              : ["starting", "stopping", "restarting"].includes(service.state)
                ? "transition"
                : "neutral";
          const date = new Date(service.checkedAt);
          if (Number.isFinite(date.getTime())) {
            time.dateTime = date.toISOString();
            time.textContent = `Checked ${clock.format(date)}`;
            time.title = date.toLocaleString();
          } else {
            time.removeAttribute("datetime");
            time.removeAttribute("title");
            time.textContent = "Check time unavailable";
          }
          return row;
        });
      reconcile(entries, children);
      return group;
    });
    reconcile(list, groupElements);
    for (const category of groups.keys())
      if (!categories.includes(category)) groups.delete(category);
    const online = services.filter(
      (service) => service.active && service.state === "running",
    ).length;
    setMessage(
      stale
        ? failed
          ? "Live status is unavailable. Showing last-known checks; they may be outdated."
          : "Status may be outdated. Showing last-known checks."
        : services.length
          ? `${online} of ${services.length} services online.`
          : "No services are currently listed.",
    );
    const generated = new Date(snapshot.generatedAt);
    updated.textContent = `${stale ? "Last snapshot" : "Updated"} ${clock.format(generated)}`;
    updated.title = generated.toLocaleString();
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
    list.setAttribute("aria-busy", "true");
    if (!snapshot) setMessage("Checking service availability…");
    const timeout = setTimeout(() => request.controller.abort(), 8000);
    try {
      const response = await fetch("https://api.ches.dev/v1/services", {
        signal: request.controller.signal,
        credentials: "omit",
      });
      if (!response.ok) throw new Error(`Status HTTP ${response.status}`);
      const result = normalize(await response.json());
      if (!request.interrupted) {
        snapshot = result;
        render();
      }
    } catch {
      if (!request.interrupted) render(true, true);
    } finally {
      clearTimeout(timeout);
      list.setAttribute("aria-busy", "false");
      pending = null;
      schedule(request.interrupted ? 0 : 30000);
    }
  }
  function updateActivity() {
    clearTimeout(timer);
    if (!eligible()) {
      if (pending) {
        pending.interrupted = true;
        pending.controller.abort();
      }
      return;
    }
    if (snapshot && Date.now() - Date.parse(snapshot.generatedAt) > 60000)
      render(true);
    schedule();
  }
  setMessage("Availability updates when this section is in view.");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateActivity();
    }).observe(section);
  } else {
    visible = true;
    updateActivity();
  }
  document.addEventListener("visibilitychange", updateActivity);
  addEventListener("pagehide", () => {
    visible = false;
    updateActivity();
  });
  addEventListener("pageshow", () => {
    const box = section.getBoundingClientRect();
    visible = box.bottom > 0 && box.top < innerHeight;
    updateActivity();
  });
})();
