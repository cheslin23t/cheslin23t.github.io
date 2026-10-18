"use strict";
// Behavioral checkpoints from CPUV2-Compiler ecc6892. No physical microsteps implied.
const chapters = [...document.querySelectorAll(".chapter")];
const dots = [...document.querySelectorAll(".chapter-dots a")];
const modules = [...document.querySelectorAll("[data-module]")];
let pending = false;
function updateTour() {
  const target =
    innerWidth <= 800 ? Math.min(innerHeight * 0.65, 560) : innerHeight * 0.5;
  let active = chapters[0];
  for (const chapter of chapters)
    if (chapter.getBoundingClientRect().top <= target) active = chapter;
  const selected = active.dataset.active.split(" ");
  modules.forEach((module) =>
    module.classList.toggle(
      "active",
      selected.includes("all") || selected.includes(module.dataset.module),
    ),
  );
  document.querySelector("#chapter").textContent = active.dataset.name;
  if (window.focusCpuBuild && window.cpuChapter !== active.id) {
    window.cpuChapter = active.id;
    window.focusCpuBuild(active.id);
  }
  dots.forEach((dot, index) =>
    index === chapters.indexOf(active)
      ? dot.setAttribute("aria-current", "step")
      : dot.removeAttribute("aria-current"),
  );
  const max = document.documentElement.scrollHeight - innerHeight;
  document.querySelector("#progress").style.width =
    `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  pending = false;
}
function queueUpdate() {
  if (!pending) {
    pending = true;
    requestAnimationFrame(updateTour);
  }
}
addEventListener("scroll", queueUpdate, { passive: true });
addEventListener("resize", queueUpdate);
updateTour();
const words = Array(64).fill("0000");
words[1] = "A58B";
words[3] = "3C4B";
words[5] = "48C1";
const grid = document.querySelector("#rom-grid");
for (let address = 0; address < 64; address++) {
  const cell = document.createElement("span");
  cell.textContent = String(address).padStart(2, "0");
  cell.title = `Address ${address}: ${words[address]}${address >= 56 ? " · reserved NOP" : ""}`;
  cell.className = `${words[address] !== "0000" ? "program" : ""} ${address >= 56 ? "reserved" : ""}`;
  grid.append(cell);
}
let visitedAddresses = 0;
let pc = 0,
  registers = [null, null, null],
  timer = null;
const play = document.querySelector("#play");
function render() {
  const fetchAddress = pc === 60 ? 56 : pc === 61 ? 57 : pc;
  document.querySelector("#pc-label").textContent =
    `PC ${String(pc).padStart(2, "0")}`;
  document.querySelector("#word").textContent = words[fetchAddress];
  document.querySelector("#assembly").textContent =
    pc === 1
      ? "LDI R1, 165"
      : pc === 3
        ? "LDI R2, 60"
        : pc === 5
          ? "ADD R3, R2, R1"
          : "NOP";
  document.querySelector("#effect").textContent =
    pc === 1
      ? "R1 receives 165 (0xA5)."
      : pc === 3
        ? "R2 receives 60 (0x3C)."
        : pc === 5
          ? "Physical A: R2 = 60. Physical B: R1 = 165. R3 receives 225 (0xE1)."
          : pc === 60 || pc === 61
            ? `Fetch alias: PC ${pc} reads address ${fetchAddress}. The word is safely NOP.`
            : pc === 0 && registers.every((value) => value === null)
              ? "Illustrative starting address. Register values are unknown."
              : pc === 0
                ? "PC wrapped from 63 to 0. Registers retain their values; the program repeats."
                : "NOP padding. Register values are retained; the clock can continue.";
  registers.forEach((value, i) => {
    document.querySelector(`#r${i + 1}`).textContent = value ?? "?";
  });
  [...grid.children].forEach((cell, i) => {
    cell.classList.toggle("current", i === pc);
    if (i === pc) cell.setAttribute("aria-current", "step");
    else cell.removeAttribute("aria-current");
  });
  document.querySelector("#previous").disabled = visitedAddresses === 0;
}
function pause() {
  clearInterval(timer);
  timer = null;
  play.textContent = "Play at 7.3 s / address";
  play.setAttribute("aria-pressed", "false");
}
function execute() {
  if (pc === 1) registers[0] = 165;
  if (pc === 3) registers[1] = 60;
  if (pc === 5) registers[2] = (registers[1] + registers[0]) & 255;
}
function next() {
  visitedAddresses++;
  pc = visitedAddresses % 64;
  execute();
  render();
}
document.querySelector("#next").addEventListener("click", () => {
  pause();
  next();
});
document.querySelector("#previous").addEventListener("click", () => {
  pause();
  visitedAddresses = Math.max(0, visitedAddresses - 1);
  pc = visitedAddresses % 64;
  registers = [visitedAddresses >= 1 ? 165 : null, visitedAddresses >= 3 ? 60 : null, visitedAddresses >= 5 ? 225 : null];
  render();
});
document.querySelector("#reset").addEventListener("click", () => {
  pause();
  pc = 0;
  visitedAddresses = 0;
  registers = [null, null, null];
  render();
});
play.setAttribute("aria-pressed", "false");
play.addEventListener("click", () => {
  if (timer) pause();
  else {
    play.textContent = "Pause tour playback";
    play.setAttribute("aria-pressed", "true");
    timer = setInterval(next, 7300);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
render();

// Keep actions disabled until their event handlers are installed.
for (const id of ["play", "next", "reset"])
  document.getElementById(id).disabled = false;
