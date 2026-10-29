"use strict";
const $ = (selector) => document.querySelector(selector);
const hex = (n) => n.toString(16).toUpperCase().padStart(4, "0");
const scenes = [
  { view: "whole", tick: 0 },
  { view: "rom", tick: 151 },
  { view: "romword", tick: 151 },
  { view: "encoding", tick: 191 },
  { view: "registers", tick: 319 },
  { view: "inverter", gate: 0 },
  { view: "inverter", gate: 1 },
  { view: "memory", tick: 350 },
  { view: "cell", tick: 650, inspector: true },
  { view: "encoding", tick: 443 },
  { view: "alucontrols", tick: 443 },
  { view: "operation", tick: 463 },
  { view: "operation", tick: 497 },
  { view: "flags", tick: 497 },
  { view: "result", tick: 650 },
  { view: "clock", tick: 569 },
  { view: "clock", tick: 0, replay: true },
];
const steps = [...document.querySelectorAll(".step")];
let recording = null,
  active = -1,
  playing = false,
  playFrame = 0;
let tick = 0,
  position = 0,
  lastTime = 0,
  scrollFrame = 0;
window.cpuRecording = fetch("./data/recording.json").then((r) => {
  if (!r.ok) throw Error("Recording unavailable");
  return r.json();
});
function probe(position, on) {
  return { position, on: Boolean(on) };
}
function state(frame) {
  $("#state-pc").textContent = String(frame.pc).padStart(2, "0");
  $("#state-word").textContent = hex(frame.word);
  $("#state-alu").textContent = frame.alu;
  frame.registers.forEach((v, i) => ($(`#state-r${i + 1}`).textContent = v));
}
function probes(frame, view) {
  if (view === "memory")
    return [
      probe([62, 22, 39], frame.inverter[3] & 1),
      probe([62, 22, 40], frame.inverter[4] & 1),
    ];
  if (view === "result") return [probe([66, 22, 39], frame.r3bit0 & 1)];
  if (
    view === "alucontrols" ||
    view === "flags" ||
    view === "encoding" ||
    view === "rom" ||
    view === "romword"
  )
    return [];
  if (view === "registers")
    return Array.from({ length: 8 }, (_, i) =>
      probe([62, 22 + 2 * i, 39], !((frame.registers[0] >> i) & 1)),
    );
  return [
    ...Array.from({ length: 8 }, (_, i) =>
      probe([52, 22 + 2 * i, 18], (frame.alu >> i) & 1),
    ),
    ...Array.from({ length: 6 }, (_, i) =>
      probe([41, 7 + 2 * i, 15], (frame.pc >> i) & 1),
    ),
  ];
}
function showCell() {
  const r = Number($("#cell-register").value),
    bit = Number($("#cell-bit").value),
    bank = Number($("#cell-bank").value);
  const x = 60 + 2 * r,
    y = 22 + 2 * bit + (r % 2 === 0 ? 1 : 0),
    z = bank === 0 ? 39 : 47;
  window.inspectCpuCell?.(r, bit, bank);
  if (!recording) return;
  const raw = recording.registerSnapshot.banks[bank][r - 1][bit];
  const logical = raw & 1 ? 0 : 1;
  $("#cell-reading").textContent = `R${r} · bit ${bit} = ${logical}`;
  $("#cell-coordinate").textContent =
    `Local (${x}, ${y}, ${z}) · bank ${bank + 1}`;
  $("#cell-electrical").textContent =
    `Repeater ${raw & 1 ? "on" : "off"} · ${raw & 2 ? "locked" : "unlocked"} · game tick 650`;
  window.setCpuProbes?.([probe([x, y, z], raw & 1)]);
  window.setCpuPinLabels?.([`R${r} bit ${bit} · ${logical}`]);
}
function applyScene(index, force = false) {
  if (active === index && !force) return;
  stop();
  active = index;
  const scene = scenes[index],
    step = steps[index];
  document
    .querySelectorAll(".step")
    .forEach((s, i) => s.classList.toggle("is-active", i === index));
  $("#scene-location").textContent =
    step.querySelector(".location").textContent;
  $("#scene-count").textContent = `${index + 1} / ${scenes.length}`;
  document.querySelectorAll("header nav a").forEach((a) => {
    a.removeAttribute("aria-current");
    const group =
      index <= 3 ? "rom" : index <= 8 ? "registers" : index <= 14 ? "alu" : "";
    if (a.hash === `#${group}`) a.setAttribute("aria-current", "location");
  });
  $(".physical-stage").classList.toggle("is-replaying", Boolean(scene.replay));
  window.focusCpuBuild?.(scene.view);
  if (!recording) return;
  if (scene.gate !== undefined) {
    const capture = recording.inverterCaptures[scene.gate],
      p = capture.probes;
    state({
      pc: capture.cpu.pc,
      word: scene.gate ? 0x018b : 0x008b,
      alu: capture.cpu.alu,
      registers: [1, 2, 3].map((r) => capture.cpu.registers_a[r]),
    });
    window.setCpuProbes?.([
      probe([60, 22, 43], Number(p.input[1].power)),
      probe([62, 22, 43], p.torch[1].lit === "true"),
    ]);
    window.setCpuPinLabels?.([
      `Input · ${scene.gate}`,
      `Torch · ${1 - scene.gate}`,
    ]);
    $("#signal-caption").textContent =
      "Orange = on · gray = off · captured at this circuit";
  } else {
    const f = recording.frames[scene.tick];
    state(f);
    window.setCpuProbes?.(probes(f, scene.view));
    $("#signal-caption").textContent =
      scene.view === "flags"
        ? "Zero and overflow landmarks · physical wiring"
        : `Game tick ${scene.tick} · bright overlays show measured electrical levels`;
    if (scene.view === "memory")
      window.setCpuPinLabels?.(["Storage · off · locked", "Input · on"]);
    if (scene.view === "result")
      window.setCpuPinLabels?.(["R3 bit 0 · logical 1"]);
    if (scene.inspector) showCell();
    if (scene.replay) {
      window.enableCpuXray?.();
      replayFocus = "";
      showTick(0);
    }
  }
}
function updateScroll() {
  scrollFrame = 0;
  const mobile = matchMedia("(max-width: 800px)").matches;
  const stage = $(".physical-stage").getBoundingClientRect();
  const threshold = mobile
    ? Math.min(
        innerHeight - 90,
        Math.max(stage.bottom + 80, innerHeight * 0.62),
      )
    : innerHeight * 0.5;
  let selected = 0;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].getBoundingClientRect().top <= threshold) selected = i;
  }
  applyScene(selected);
}
function queueScroll() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}
addEventListener("scroll", queueScroll, { passive: true });
addEventListener("resize", queueScroll);
let replayFocus = "";
function replayStage(t) {
  if (t < 131)
    return { view: "clock", label: "PC 0 · waiting for the next clock edge" };
  if (t < 151) return { view: "rom", label: "PC 1 · ROM address changes" };
  if (t < 175) return { view: "encoding", label: "A58B · decode LDI R1, 165" };
  if (t < 277)
    return {
      view: "registers",
      register: 1,
      label: "R1 write · immediate byte 165",
    };
  if (t < 297) return { view: "rom", label: "PC 2 · ROM address changes" };
  if (t < 313) return { view: "encoding", label: "3C4B · decode LDI R2, 60" };
  if (t < 423)
    return {
      view: "registers",
      register: 2,
      label: "R2 write · immediate byte 60",
    };
  if (t < 443) return { view: "rom", label: "PC 3 · fetch the ADD word" };
  if (t < 463)
    return { view: "encoding", label: "48C1 · decode ADD R3, R2, R1" };
  if (t < 509)
    return {
      view: "operation",
      label: "ALU · 60 + 165 propagates to the output",
    };
  if (t < 569)
    return { view: "registers", register: 3, label: "R3 write · result 225" };
  if (t < 631)
    return { view: "clock", label: "PC advances · the next ROM word is zero" };
  return {
    view: "registers",
    register: 3,
    label: "R3 holds 225 after the ALU returns to zero",
  };
}
function showTick(value) {
  if (!recording) return;
  tick = Math.max(0, Math.min(recording.frames.length - 1, Math.round(value)));
  const f = recording.frames[tick];
  state(f);
  const stage = replayStage(tick);
  const key = `${stage.view}:${stage.register || 0}:${stage.view === "encoding" ? f.word & 15 : ""}`;
  if ($("#follow-replay").checked && replayFocus !== key) {
    if (stage.register) window.focusCpuRegister?.(stage.register);
    else if (stage.view === "encoding")
      window.focusCpuController?.(f.word & 15);
    else window.focusCpuBuild?.(stage.view, true);
    replayFocus = key;
  }
  const held = replayFocus.split(":");
  const visibleStage = $("#follow-replay").checked
    ? stage
    : { view: held[0] || stage.view, register: Number(held[1]) };
  const signals = visibleStage.register
    ? Array.from({ length: 8 }, (_, bit) =>
        probe(
          [
            60 + 2 * visibleStage.register,
            22 + 2 * bit + (visibleStage.register % 2 === 0 ? 1 : 0),
            39,
          ],
          !((f.registers[visibleStage.register - 1] >> bit) & 1),
        ),
      )
    : probes(f, visibleStage.view);
  window.setCpuProbes?.(signals);
  $("#trace-phase").textContent = stage.label;
  let caption;
  if (tick < 131)
    caption =
      "The clock is running. The PC will select the first instruction at address 1.";
  else if (stage.view === "rom")
    caption = `PC ${f.pc} selects the next 16-bit ROM word. Its bits are reaching the controller.`;
  else if (tick < 423) {
    const r = tick < 277 ? 1 : 2,
      value = r === 1 ? 165 : 60;
    caption =
      stage.view === "encoding"
        ? `Opcode B selects LDI: route the immediate ${value} to register R${r}.`
        : `The selected cells accept ${value}. R${r} currently holds ${f.registers[r - 1]}; other registers keep their values.`;
  } else if (tick < 509)
    caption =
      stage.view === "encoding"
        ? "Opcode 1 selects ADD: read R2 = 60 and R1 = 165, then write the ALU result to R3."
        : `60 + 165 is propagating through the ALU. Output now: ${f.alu}; destination R3: ${f.registers[2]}.`;
  else if (tick < 569)
    caption = `60 + 165 = 225. R3 now stores ${f.registers[2]} (${f.registers[2].toString(2).padStart(8, "0")}).`;
  else if (tick < 631)
    caption = `The PC advances to a NOP. The ALU is ${f.alu}; R3 keeps the result ${f.registers[2]}.`;
  else
    caption =
      "R3 retains 225 (11100001), even with the ALU back at zero. The result is ready for another instruction.";
  $("#trace-explanation").textContent = caption;
  const flow = stage.register === 3 ? "result" : stage.view;
  document
    .querySelectorAll("[data-flow]")
    .forEach((el) =>
      el.classList.toggle("is-active", el.dataset.flow === flow),
    );
  $("#trace-seek").value = tick;
  $("#trace-tick").textContent = `${tick} / ${recording.frames.length - 1}`;
  $("#signal-caption").textContent =
    `Game tick ${tick} · orange = on · gray = off`;
}
$("#follow-replay").addEventListener("change", () => {
  if ($("#follow-replay").checked) replayFocus = "";
  showTick(tick);
});
function stop() {
  playing = false;
  $(".physical-stage").classList.remove("is-playing");
  cancelAnimationFrame(playFrame);
  $("#run-play").textContent = "Play recording";
  $("#run-play").setAttribute("aria-pressed", "false");
}
function advance(now) {
  if (!playing) return;
  position +=
    (Math.min(100, now - lastTime) / 1000) * 20 * Number($("#run-speed").value);
  lastTime = now;
  if (Math.floor(position) !== tick) showTick(position);
  if (tick >= recording.frames.length - 1) {
    stop();
    return;
  }
  playFrame = requestAnimationFrame(advance);
}
$("#run-play").addEventListener("click", () => {
  if (playing) {
    stop();
    return;
  }
  if (tick === recording.frames.length - 1) showTick(0);
  playing = true;
  $(".physical-stage").classList.add("is-playing");
  position = tick;
  lastTime = performance.now();
  $("#run-play").textContent = "Pause recording";
  $("#run-play").setAttribute("aria-pressed", "true");
  playFrame = requestAnimationFrame(advance);
});
$("#trace-seek").addEventListener("input", (e) => {
  stop();
  showTick(Number(e.target.value));
});
for (const id of ["cell-register", "cell-bit", "cell-bank"])
  $(`#${id}`).addEventListener("change", showCell);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
window.addEventListener("cpu-model-ready", () =>
  applyScene(Math.max(0, active), true),
);
window.cpuRecording
  .then((data) => {
    recording = data;
    $("#run-play").disabled = false;
    $("#trace-seek").disabled = false;
    applyScene(Math.max(0, active), true);
  })
  .catch(() => {
    $("#trace-status").textContent =
      "The recording could not load. Reload to try again; the written walkthrough remains available.";
    $("#signal-caption").textContent =
      "Recording unavailable · no signal overlays";
  });
updateScroll();
