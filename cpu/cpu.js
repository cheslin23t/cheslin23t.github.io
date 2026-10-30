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
window.cpuRecording = Promise.all(
  [
    "recording.json",
    "physical-signals.json",
    "line-recording.json",
    "line-signals.json",
  ].map(async (name) => {
    const r = await fetch(`./data/${name}`);
    if (!r.ok) throw Error("Recording unavailable");
    return r.json();
  }),
).then(([record, physical, line, linePhysical]) => ({
  ...record,
  physical,
  line,
  linePhysical,
}));
function probe(position, on) {
  return { position, on: Boolean(on) };
}
function state(frame) {
  $("#state-pc").textContent = String(frame.pc).padStart(2, "0");
  $("#state-word").textContent = hex(frame.word);
  $("#state-alu").textContent = frame.alu;
  frame.registers
    .slice(0, 3)
    .forEach((v, i) => ($(`#state-r${i + 1}`).textContent = v));
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
  window.setCpuProgram?.(Boolean(scene.replay));
  $("#state-register-one").textContent = "R1";
  $("#state-register-two").textContent = "R2";
  $("#state-register-result").textContent = scene.replay ? "R4" : "R3";
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
    window.setCpuProbes?.([]);
    window.setCpuPhysicalTick?.(scene.tick);
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
  const run = recording.line;
  const instruction = run.instructions.find(
    (i) => t >= i.pcTick && t < i.endTick,
  );
  if (!instruction)
    return {
      view: t < run.instructions[0].pcTick ? "clock" : "registers",
      register: t < run.instructions[0].pcTick ? 0 : 4,
      label:
        t < run.instructions[0].pcTick
          ? "Line program · waiting for the clock"
          : "Line complete · nine calculated pixels",
      caption:
        t < run.instructions[0].pcTick
          ? "The ROM holds 28 instructions. The CPU will set up the fixed-point values, then calculate eight steps."
          : "The CPU reached (8, 3). The plot preserves each completed coordinate read from its registers.",
    };
  const i = instruction;
  const prefix = i.iteration ? `Pixel ${i.iteration}/8` : "Setup";
  const base = { instruction: i, label: `${prefix} · ${i.asm}` };
  if (t < i.wordTick)
    return {
      ...base,
      view: "rom",
      caption: `PC ${i.address} selects ROM word ${hex(i.word)}. The instruction bits travel to the controller.`,
    };
  if (t < i.wordTick + 20)
    return {
      ...base,
      view: "encoding",
      caption: `The controller selects ${i.op} and enables the path to R${i.dest}. ${i.op === "LDI" ? `The immediate byte is ${i.immediate}.` : `The source ${i.op === "INC" ? `is R${i.b}` : `registers are R${i.a} and R${i.b}`}.`}`,
    };
  let caption;
  if (i.op === "LDI")
    caption = {
      1: "R1 starts X at zero.",
      2: "R2 starts at 8/16: the half-pixel offset rounds the height to the nearest row.",
      3: "R3 stores 6/16, the vertical increment for a slope of 3/8.",
      5: "R5 stores 240 (11110000), the mask that keeps the whole-pixel part of the height.",
    }[i.dest];
  else if (i.op === "INC")
    caption = `INC reads R${i.b} = ${i.operands[1]} and writes X = ${i.expected} to R${i.dest}.`;
  else if (i.op === "ADD")
    caption = `ADD advances the fractional height: ${i.operands[0]}/16 + 6/16 = ${i.expected}/16, written to R${i.dest}.`;
  else
    caption = `AND keeps the upper four bits: ${i.operands[0]} & 240 = ${i.expected}. R4's upper nibble is pixel row ${i.expected / 16}.`;
  if (i.op === "LDI" || t >= Math.max(i.settledTick, i.wordTick + 44))
    return { ...base, view: "registers", register: i.dest, caption };
  return { ...base, view: "operation", caption };
}
function showTick(value) {
  if (!recording) return;
  const run = recording.line;
  tick = Math.max(0, Math.min(run.frames.length - 1, Math.round(value)));
  const f = run.frames[tick];
  state(f);
  const stage = replayStage(tick);
  const i = stage.instruction;
  const xRegister = i?.xRegister || 1,
    accRegister = i?.accRegister || 2;
  $("#state-register-one").textContent = `R${xRegister} · X`;
  $("#state-register-two").textContent = `R${accRegister} · Q4`;
  $("#state-register-result").textContent = "R4 · Y×16";
  $("#state-r1").textContent = f.registers[xRegister - 1];
  $("#state-r2").textContent = f.registers[accRegister - 1];
  $("#state-r3").textContent = f.registers[3];
  const key = `${stage.view}:${stage.register || 0}:${stage.view === "encoding" ? i.word & 15 : ""}`;
  if ($("#follow-replay").checked && replayFocus !== key) {
    if (stage.register) window.focusCpuRegister?.(stage.register);
    else if (stage.view === "encoding")
      window.focusCpuController?.(i.word & 15);
    else window.focusCpuBuild?.(stage.view, true);
    replayFocus = key;
  }
  window.setCpuProbes?.([]);
  window.setCpuPhysicalTick?.(tick, "line");
  $("#trace-phase").textContent = stage.label;
  $("#trace-explanation").textContent = stage.caption;
  const flow = stage.register === 4 ? "result" : stage.view;
  document
    .querySelectorAll("[data-flow]")
    .forEach((el) =>
      el.classList.toggle("is-active", el.dataset.flow === flow),
    );
  const points = run.points.filter((p) => p.tick <= tick);
  const latest = points.at(-1);
  $("#line-output-value").textContent = latest
    ? `(${latest.x}, ${latest.y}) · ${points.length}/9 pixels`
    : "Waiting for coordinates";
  $("#line-output-pixels").replaceChildren(
    ...points.map((p) => {
      const cell = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      cell.setAttribute("x", String(7 + p.x * 15));
      cell.setAttribute("y", String(7 + (3 - p.y) * 15));
      cell.setAttribute("width", "11");
      cell.setAttribute("height", "11");
      cell.setAttribute("class", p === latest ? "latest" : "");
      return cell;
    }),
  );
  $("#line-output-plot").setAttribute(
    "aria-label",
    points.length
      ? `Recorded CPU coordinates: ${points.map((p) => `(${p.x}, ${p.y})`).join(", ")}`
      : "No completed CPU coordinates yet",
  );
  $("#trace-seek").value = tick;
  $("#trace-tick").textContent = `${tick} / ${run.frames.length - 1}`;
  $("#signal-caption").textContent =
    `Game tick ${tick} · orange = on · dark red = off`;
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
  if (tick >= recording.line.frames.length - 1) {
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
  if (tick === recording.line.frames.length - 1) showTick(0);
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
    $("#trace-seek").max = data.line.frames.length - 1;
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
