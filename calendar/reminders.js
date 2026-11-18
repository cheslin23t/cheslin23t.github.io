(() => {
  const api = "https://api.ches.dev/calendar/v1/reminder-lists";
  const $ = (id) => document.getElementById(id);
  const editor = $("reminder-editor");
  const browser = $("reminder-browser");
  const form = $("reminder-form");
  const fields = $("reminder-fields");
  const listPicker = $("reminder-list");
  const filter = $("reminders-filter");
  const save = $("save-reminder");
  const listStatus = $("reminders-browser-status");
  const errorText = $("reminder-error");
  const feedback = $("reminder-status");
  const items = $("reminders-items");
  const confirm = $("reminder-delete-confirm");
  const frequencies = ["", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
  const errors = {
    authentication_required: "Sign in again to continue.",
    calendar_permission_required: "Your account needs Calendar access.",
    reminder_list_read_only: "This list is read-only.",
    reminder_changed_refresh_required: "This reminder has changed. Close the editor and refresh the list before retrying.",
    event_changed_refresh_required: "This reminder has changed. Close the editor and refresh the list before retrying.",
    invalid_reminder_date: "Check the reminder date and time.",
    invalid_time_zone: "Enter a time zone such as America/New_York.",
    idempotency_key_reused: "The earlier save may have completed. Refresh the list before making another reminder.",
    repeat_requires_date: "Choose a date for a repeating reminder.",
    custom_alarm_requires_reminders_client: "This reminder has an alert that must be edited in Apple Reminders.",
    alert_requires_time: "Choose a date and time for a due-time alert.",
    calendar_unavailable: "iCloud Reminders is unavailable. Try again shortly.",
  };
  let lists = [];
  let zone = "America/New_York";
  let lastList = "";
  let editing;
  let requestKey;
  let busy = false;
  let refreshVersion = 0;
  let listRequest;
  let pendingDelete;

  function message(error) {
    return errors[error.code] || (error.status === 401
      ? "Sign in again to continue."
      : error.status === 409 || error.status === 412
        ? "This reminder has changed. Refresh the list before retrying."
        : "Could not complete the iCloud Reminders request. Try again shortly.");
  }

  async function request(path = "", options = {}) {
    const { headers, ...rest } = options;
    const response = await fetch(api + path, {
      credentials: "include", cache: "no-store", signal: AbortSignal.timeout(26000), ...rest,
      headers: { ...(rest.body && { "Content-Type": "application/json" }), ...headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error("Reminder request failed"), { status: response.status, code: data.error });
    return data;
  }

  function pathFor(id, item) {
    return "/" + encodeURIComponent(id) + "/reminders" + (item ? "/" + encodeURIComponent(item.id) : "");
  }

  function setOptions(select, choices, selected) {
    select.replaceChildren(...choices.map((list) => new Option(list.name, list.id)));
    if (choices.some((list) => list.id === selected)) select.value = selected;
  }

  function refreshLists() {
    if (!listRequest) listRequest = request().then((data) => {
      lists = data.lists;
      zone = data.timeZone || zone;
      return lists;
    }).finally(() => { listRequest = undefined; });
    return listRequest;
  }

  function synchronizeFields() {
    const hasDate = Boolean($("reminder-date").value);
    const hasTime = Boolean($("reminder-time").value);
    $("reminder-repeat").disabled = !hasDate;
    $("reminder-alert").disabled = !hasDate || !hasTime;
    if ($("reminder-alert").disabled) $("reminder-alert").checked = false;
    $("reminder-zone").disabled = !hasTime;
  }

  function fill(item) {
    for (const key of ["title", "notes", "date", "time"]) $(`reminder-${key}`).value = item?.[key] || "";
    $("reminder-zone").value = item?.timeZone || zone;
    $("reminder-priority").value = String(item?.priority ?? 0);
    if (!$("reminder-priority").value) $("reminder-priority").value = "0";
    const repeat = $("reminder-repeat");
    repeat.querySelector('[value="CUSTOM"]')?.remove();
    if (item?.repeat === "CUSTOM") repeat.add(new Option("Keep custom repeat", "CUSTOM"));
    repeat.value = item?.repeat || "";
    $("reminder-alert").checked = item?.alert === true;
    synchronizeFields();
  }

  async function openEditor(item, listId) {
    if (editor.open || busy) return;
    editing = item ? { item, listId } : null;
    requestKey = crypto.randomUUID();
    $("reminder-editor-title").textContent = item ? "Edit reminder" : "New reminder";
    save.textContent = item ? "Save changes" : "Add reminder";
    errorText.textContent = "";
    $("reminder-editor-status").textContent = "Loading lists…";
    $("reminder-list-field").hidden = true;
    fields.disabled = save.disabled = true;
    fill(item);
    editor.showModal();
    try {
      await refreshLists();
      if (!editor.open) return;
      const choices = lists.filter((list) => list.writable);
      setOptions(listPicker, choices, listId || lastList);
      $("reminder-list-field").hidden = false;
      if (!choices.length || (item && listPicker.value !== listId)) {
        $("reminder-editor-status").textContent = "No writable reminder list is available.";
        return;
      }
      listPicker.disabled = Boolean(item);
      if (!item) $("reminder-zone").value = zone;
      $("reminder-editor-status").textContent = "";
      fields.disabled = save.disabled = false;
      $("reminder-title").focus();
    } catch (error) {
      $("reminder-editor-status").textContent = "";
      errorText.textContent = message(error);
    }
  }

  function reminderDetails(item) {
    const parts = [];
    if (item.date) {
      parts.push(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" })
        .format(new Date(item.date + "T00:00:00Z")));
      if (item.time) {
        const clock = new Intl.DateTimeFormat(undefined, { timeStyle: "short", timeZone: "UTC" });
        parts.push(clock.format(new Date(item.date + "T" + item.time + "Z")) + (item.timeZone ? " " + item.timeZone : ""));
      }
    }
    if (item.completed) parts.push("Completed");
    if (item.repeat) parts.push(item.repeat === "CUSTOM" ? "Custom repeat" : item.repeat.toLowerCase());
    return parts.join(" · ");
  }

  function button(label, action, title) {
    const node = document.createElement("button");
    node.type = "button";
    node.textContent = label;
    node.setAttribute("aria-label", label + " " + title);
    node.addEventListener("click", action);
    return node;
  }

  function render(reminders, list) {
    const sorted = [...reminders].sort((a, b) => Number(a.completed) - Number(b.completed)
      || (a.date || "9999").localeCompare(b.date || "9999")
      || (a.time || "").localeCompare(b.time || "") || a.title.localeCompare(b.title));
    items.replaceChildren(...sorted.map((item) => {
      const row = document.createElement("li");
      const body = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = item.title;
      body.append(title);
      const details = reminderDetails(item);
      if (details) {
        const detail = document.createElement("p");
        detail.className = "calendar-note";
        detail.textContent = details;
        body.append(detail);
      }
      if (item.notes) {
        const notes = document.createElement("p");
        notes.className = "calendar-note reminder-item-notes";
        notes.textContent = item.notes;
        body.append(notes);
      }
      row.append(body);
      if (list.writable) {
        const actions = document.createElement("div");
        actions.className = "reminder-item-actions";
        if (item.etag) {
          actions.append(button("Edit", () => void openEditor(item, list.id), item.title));
          actions.append(
            button(item.completed ? "Reopen" : "Complete", () => void mutate(list.id, item, false), item.title),
            button("Delete", () => {
              if (busy) return;
              pendingDelete = { listId: list.id, item };
              $("reminder-delete-description").textContent = 'Delete “' + item.title + '” from iCloud Reminders?';
              confirm.showModal();
            }, item.title),
          );
        }
        row.append(actions);
      }
      return row;
    }));
    listStatus.textContent = sorted.length ? "" : "This list has no reminders.";
  }

  async function showList(reload = false) {
    const version = ++refreshVersion;
    listStatus.textContent = "Loading reminders…";
    items.replaceChildren();
    try {
      if (reload || !lists.length) {
        await refreshLists();
        if (version !== refreshVersion || !browser.open) return;
        setOptions(filter, lists, filter.value || lastList);
        filter.disabled = lists.length === 0;
      }
      const list = lists.find((entry) => entry.id === filter.value);
      if (!list) {
        listStatus.textContent = "iCloud hasn’t exposed a reminder list to this Calendar connection.";
        return;
      }
      lastList = list.id;
      $("new-reminder-from-list").disabled = !lists.some((entry) => entry.writable);
      const data = await request(pathFor(list.id));
      if (version === refreshVersion && browser.open) render(data.reminders, list);
    } catch (error) {
      if (version === refreshVersion) listStatus.textContent = message(error);
    }
  }

  async function mutate(listId, item, deleting) {
    if (busy || !item.etag) return;
    busy = true;
    listStatus.textContent = deleting ? "Deleting reminder…" : "Saving reminder…";
    try {
      await request(pathFor(listId, item), {
        method: deleting ? "DELETE" : "PATCH", headers: { "If-Match": item.etag },
        ...(deleting ? {} : { body: JSON.stringify({ completed: !item.completed }) }),
      });
      feedback.textContent = deleting ? "Reminder deleted." : "Reminder updated.";
      await showList();
    } catch (error) {
      listStatus.textContent = message(error);
    } finally {
      busy = false;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || fields.disabled) return;
    const date = $("reminder-date").value;
    const time = $("reminder-time").value;
    const title = $("reminder-title").value.trim();
    const timeZone = $("reminder-zone").value.trim() || zone;
    const repeat = $("reminder-repeat").value;
    const listId = editing?.listId || listPicker.value;
    if (!title || (time && !date) || !listId) {
      errorText.textContent = !title ? "Enter a title." : time && !date ? "Choose a date for this time." : "Choose a list.";
      $(!title ? "reminder-title" : time && !date ? "reminder-date" : "reminder-list").focus();
      return;
    }
    try {
      new Intl.DateTimeFormat(undefined, { timeZone });
    } catch {
      errorText.textContent = errors.invalid_time_zone;
      $("reminder-zone").focus();
      return;
    }
    if (editing && !editing.item.etag) {
      errorText.textContent = "This item has no writable version. Refresh and try again.";
      return;
    }
    const body = JSON.stringify({
      title, date, time, timeZone, notes: $("reminder-notes").value,
      priority: Number($("reminder-priority").value), alert: $("reminder-alert").checked,
      ...(frequencies.includes(repeat) && { repeat: date ? repeat : "" }),
    });
    busy = fields.disabled = save.disabled = true;
    errorText.textContent = "";
    $("reminder-editor-status").textContent = "Saving to iCloud…";
    try {
      await request(pathFor(listId, editing?.item), {
        method: editing ? "PATCH" : "POST", body,
        headers: editing ? { "If-Match": editing.item.etag } : { "Idempotency-Key": requestKey },
      });
      lastList = listId;
      feedback.textContent = editing ? "Reminder saved." : "Reminder added.";
      editor.close();
      if (browser.open) await showList();
    } catch (error) {
      errorText.textContent = message(error);
    } finally {
      busy = fields.disabled = save.disabled = false;
      $("reminder-editor-status").textContent = "";
    }
  });

  $("reminder-date").addEventListener("input", synchronizeFields);
  $("reminder-time").addEventListener("input", synchronizeFields);
  $("close-reminder").addEventListener("click", () => { if (!busy) editor.close(); });
  editor.addEventListener("cancel", (event) => { if (busy) event.preventDefault(); });
  $("new-reminder").addEventListener("click", () => void openEditor());
  $("show-reminders").addEventListener("click", () => {
    if (browser.open) return;
    browser.showModal();
    void showList(true);
  });
  $("close-reminders-browser").addEventListener("click", () => browser.close());
  $("new-reminder-from-list").addEventListener("click", () => void openEditor(undefined, filter.value));
  $("refresh-reminders").addEventListener("click", () => void showList(true));
  filter.addEventListener("change", () => void showList());
  $("reminder-delete-cancel").addEventListener("click", () => confirm.close());
  $("reminder-delete-accept").addEventListener("click", () => {
    const entry = pendingDelete;
    confirm.close();
    if (entry) void mutate(entry.listId, entry.item, true);
  });
  for (const id of ["close-reminder", "close-reminders-browser", "refresh-reminders", "reminder-delete-cancel", "reminder-delete-accept"]) {
    $(id).disabled = false;
  }
  window.addEventListener("ches-calendar-authorized", (event) => {
    for (const id of ["new-reminder", "show-reminders"]) {
      $(id).hidden = !event.detail;
      $(id).disabled = !event.detail;
    }
  });
})();
