"use strict";

// A short behavioral preview of cpu/data/cpu.json's exact addition program.
// This pauses the presentation at address 6; the physical CPU has no HALT.
(() => {
  const preview = document.querySelector(".cpu-preview");
  if (!preview) return;

  const play = preview.querySelector("#cpu-preview-play");
  const step = preview.querySelector("#cpu-preview-step");
  const restart = preview.querySelector("#cpu-preview-restart");
  const status = preview.querySelector("#cpu-preview-status");
  const rows = [...preview.querySelectorAll("[data-preview-address]")];
  const messages = [
    "Start at PC 00. Registers are unknown until written.",
    "Load 165 into R1. Its 8-bit value is 10100101.",
    "NOP padding. R1 keeps its value.",
    "Load 60 into R2. Its 8-bit value is 00111100.",
    "NOP padding. Both register values are retained.",
    "R2 + R1 → R3. 60 + 165 = 225 (11100001).",
    "Preview complete. Hardware keeps clocking through NOPs, then wraps to PC 00.",
  ];
  let pc = 0;
  let registers = [null, null, null];
  let timer = null;

  function render() {
    preview.querySelector("#cpu-preview-pc").textContent = `PC ${String(pc).padStart(2, "0")}`;
    preview.querySelector("#cpu-preview-title span").textContent = `= ${registers[2] ?? "?"}`;
    rows.forEach((row, index) => {
      if (index === pc) row.setAttribute("aria-current", "step");
      else row.removeAttribute("aria-current");
    });
    registers.forEach((value, index) => {
      preview.querySelector(`#cpu-preview-r${index + 1}`).textContent = value ?? "?";
      preview.querySelector(`#cpu-preview-bits${index + 1}`).textContent =
        value === null ? "????????" : value.toString(2).padStart(8, "0");
    });
    play.textContent = timer !== null ? "Pause demo" : pc === 6 ? "Replay demo" : "Run demo";
    play.setAttribute("aria-pressed", String(timer !== null));
    step.disabled = pc === 6;
    restart.disabled = pc === 0 && timer === null;
    status.textContent = messages[pc];
  }

  function pause() {
    clearInterval(timer);
    timer = null;
  }

  function reset() {
    pause();
    pc = 0;
    registers = [null, null, null];
  }

  function advance() {
    if (pc < 6) pc++;
    if (pc === 1) registers[0] = 165;
    if (pc === 3) registers[1] = 60;
    if (pc === 5) registers[2] = (registers[1] + registers[0]) & 255;
    if (pc === 6) pause();
    render();
  }

  play.addEventListener("click", () => {
    if (timer !== null) pause();
    else {
      if (pc === 6) reset();
      timer = setInterval(advance, 900);
    }
    render();
  });

  step.addEventListener("click", () => {
    pause();
    advance();
  });

  restart.addEventListener("click", () => {
    reset();
    render();
  });

  // Playback is opt-in and never runs while this page is in the background.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      render();
    }
  });
  window.addEventListener("pagehide", pause);

  play.disabled = false;
  render();
})();
