"use strict";
// All explanatory state stays in this page; no demo writes to a service.
const $ = (selector) => document.querySelector(selector);
const screen = $("#app-screen");
if (screen) {
  const controls = [...document.querySelectorAll("[data-screen]")];
  controls.forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", () => {
      const n = button.dataset.screen;
      screen.src = `/static/assets/badavo-screen-${n}.jpg`;
      screen.alt = `Published BadAvo App Store screenshot ${n} of 3`;
      controls.forEach((control) =>
        control.setAttribute("aria-pressed", String(control === button)),
      );
      $("#screen-status").textContent = `Screen ${n} of 3`;
    });
  });
}
if ($("#order-state")) {
  function updateOrder(state) {
    const pending = state === "pending",
      active = state === "active";
    $("#order-state").textContent = {
      pending: "Pending submission",
      active: "Active print record",
      denied: "Submission denied",
      hidden: "Record hidden",
    }[state];
    $("#order-description").textContent = {
      pending:
        "Approve to create an active print record, or deny the sample request.",
      active:
        "The model, size, budget, and payment details are copied into the print record. Printed, paid, and delivered begin unset.",
      denied:
        "The sample leaves the pending queue. No print record is created.",
      hidden: "The sample record is removed from the active list.",
    }[state];
    $("#approve").hidden = !pending;
    $("#deny").hidden = !pending;
    $("#hide-order").hidden = !active;
    $("#pending-phase").classList.toggle("current", pending);
    $("#active-phase").classList.toggle("current", active);
    $("#order-status").textContent = pending
      ? "No order has been submitted to a server."
      : "Sample updated in this browser only.";
  }
  for (const [id, state] of [
    ["approve", "active"],
    ["deny", "denied"],
    ["hide-order", "hidden"],
    ["reset-order", "pending"],
  ]) {
    const button = $("#" + id);
    button.disabled = false;
    button.addEventListener("click", () => {
      updateOrder(state);
      if (id !== "reset-order") $("#reset-order").focus();
    });
  }
}
if ($("#command-form")) {
  const aliases = ["value", "v", "val", "item", "it", "itm"];
  function executeCommand() {
    const value = $("#command").value.trim().toLowerCase();
    const parts = value.split(/\s+/);
    let output;
    if (["help", "?", "h"].includes(parts[0]) && parts.length === 1)
      output =
        "Command demonstration\n\nhelp value     Show command-specific help\nhelp val       Resolve an alias\nvalue carbonara  Explain the external API boundary\n\nThis browser demonstration covers the value registry only.";
    else if (
      ["help", "?", "h"].includes(parts[0]) &&
      aliases.includes(parts[1]) &&
      parts.length === 2
    )
      output =
        "Help for command 'value':\nDescription: Shows the value of item(s)\nUsage: value <name...>\nAliases: v, val, item, it, itm";
    else if (aliases.includes(parts[0]))
      output = `Resolved: ${parts[0]} → value\nUsage: value <name...>\n\nThe full Python CLI queries a third-party item API.\nThis local demonstration makes no API requests\nand does not display current market values.`;
    else
      output =
        "Command not included in this browser demonstration.\nTry help or help value. The complete CLI is linked below.";
    $("#command-output").textContent = output;
  }
  $("#command-form button").disabled = false;
  $("#command-form").addEventListener("submit", (event) => {
    event.preventDefault();
    executeCommand();
  });
  document.querySelectorAll("[data-command]").forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", () => {
      $("#command").value = button.dataset.command;
      executeCommand();
    });
  });
}
if ($("#cpu-run")) {
  let completed = 0,
    timer = null;
  const values = [165, 60, 225];
  const messages = [
    "Three instructions. Registers are unknown until written.",
    "LDI writes 165 to R1.",
    "LDI writes 60 to R2.",
    "ADD writes 225 to R3. Explanation complete; the physical CPU has no verified HALT.",
  ];
  function pause() {
    clearTimeout(timer);
    timer = null;
  }
  function render() {
    for (let i = 0; i < 3; i++) {
      $("#r" + (i + 1)).textContent = completed > i ? values[i] : "?";
      $("#bits" + (i + 1)).textContent =
        completed > i ? values[i].toString(2).padStart(8, "0") : "????????";
    }
    [...$("#cpu-program").rows].forEach((row, i) => {
      if (i === completed - 1) row.setAttribute("aria-current", "step");
      else row.removeAttribute("aria-current");
    });
    $("#cpu-answer").textContent = completed === 3 ? "= 225" : "= ?";
    $("#cpu-run").textContent =
      timer !== null ? "Pause" : completed === 3 ? "Replay" : "Run program";
    $("#cpu-run").setAttribute("aria-pressed", String(timer !== null));
    $("#cpu-step").disabled = completed === 3;
    $("#cpu-reset").disabled = completed === 0 && timer === null;
    $("#cpu-status").textContent = messages[completed];
  }
  function advance() {
    completed = Math.min(3, completed + 1);
  }
  function schedule() {
    timer = setTimeout(() => {
      advance();
      if (completed < 3) schedule();
      else pause();
      render();
    }, 1000);
  }
  $("#cpu-run").disabled = false;
  $("#cpu-run").addEventListener("click", () => {
    if (timer !== null) pause();
    else {
      if (completed === 3) completed = 0;
      schedule();
    }
    render();
  });
  $("#cpu-step").addEventListener("click", () => {
    pause();
    advance();
    render();
  });
  $("#cpu-reset").addEventListener("click", () => {
    pause();
    completed = 0;
    render();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      render();
    }
  });
  window.addEventListener("pagehide", pause);
  if ("IntersectionObserver" in window)
    new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        pause();
        render();
      }
    }).observe($("#project-cpu"));
  render();
}
if ($("#copy-email")) {
  $("#copy-email").disabled = false;
  $("#copy-email").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("colin@ches.dev");
      $("#copy-status").textContent = "Email copied.";
    } catch {
      $("#copy-status").textContent =
        "Select the email address above to copy it, or open your email app.";
    }
  });
}
