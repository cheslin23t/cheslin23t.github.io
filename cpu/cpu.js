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
function showController(f) {
  const reverse4 = (n) =>
    ((n & 1) << 3) | ((n & 2) << 1) | ((n & 4) >> 1) | ((n & 8) >> 3);
  const op = f.word & 15,
    dest = reverse4((f.word >> 4) & 15),
    a = reverse4((f.word >> 12) & 15),
    b = reverse4((f.word >> 8) & 15);
  const names = [
    "NOP",
    "ADD",
    "SUB",
    "AND",
    "NAND",
    "OR",
    "XOR",
    "NOR",
    "XNOR",
    "INC",
    "DEC",
    "LDI",
    "Branch",
  ];
  const registerValue = (r) =>
    r === 0
      ? "0"
      : r >= 1 && r <= 3
        ? String(f.registers[r - 1])
        : "not sampled";
  $("#controller-word").textContent =
    `${hex(f.word)} · ${f.word.toString(2).padStart(16, "0").match(/.{4}/g).join(" ")}`;
  $("#controller-op").textContent =
    `${names[op] || "Unspecified"} · opcode ${op.toString(16).toUpperCase()}`;
  if (op === 0) {
    $("#controller-source").textContent = "No operand required";
    $("#controller-destination").textContent = "No register write";
    $("#controller-alu").textContent =
      `No result selected for writing · output ${f.alu}`;
    $("#controller-route").textContent = `PC ${f.pc} → ROM → 0000 → NOP`;
    $("#controller-detail").textContent =
      "NOP leaves the registers unchanged. It does not stop the clock or clear the ALU; signals from the previous instruction may still be settling.";
  } else if (op === 11) {
    const immediate = f.word >> 8;
    $("#controller-source").textContent =
      `Immediate ${immediate} · ${immediate.toString(2).padStart(8, "0")}`;
    $("#controller-destination").textContent =
      `R${dest} · currently ${registerValue(dest)}`;
    $("#controller-alu").textContent =
      "Immediate write path · no arithmetic required";
    $("#controller-route").textContent =
      `ROM word → immediate ${immediate} → R${dest}`;
    $("#controller-detail").textContent =
      `The low four bits select LDI. The next four bits select R${dest}; this field is bit-reversed in the wiring. The upper eight bits supply the byte to write. The destination selects which register cells accept it; the other registers retain their values.`;
  } else {
    $("#controller-source").textContent =
      `A: R${a} = ${registerValue(a)} · B: R${b} = ${registerValue(b)}`;
    $("#controller-destination").textContent =
      `R${dest} · currently ${registerValue(dest)}`;
    $("#controller-alu").textContent =
      `${names[op] || "Unspecified operation"} · measured output ${f.alu}`;
    $("#controller-route").textContent =
      op === 9
        ? `R${b} + 1 → ALU → R${dest}`
        : `R${a} ${op === 2 ? "−" : "+"} R${b} → ALU → R${dest}`;
    $("#controller-detail").textContent =
      op !== 1
        ? "This is a transient instruction-bus value between program words. The fields shown are its current decode; it is not an extra instruction in the program. Different wires settle at different times before the next complete word arrives."
        : "The controller uses separate fields for the two register reads, the ALU operation, and the destination write. For this ADD, the register banks supply 60 and 165. The ALU performs the addition, and the destination write path transfers the result into R3. Selecting an operation does not make its output settle instantly.";
  }
}
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
  showController(f);
  const stage = replayStage(tick);
  const key = `${stage.view}:${stage.register || 0}`;
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
  $("#replay-result").textContent = f.registers[2];
  $("#replay-binary").textContent = f.registers[2].toString(2).padStart(8, "0");
  $("#replay-result-state").textContent =
    tick >= 509
      ? "Stored result"
      : tick >= 443
        ? "Write in progress"
        : "Waiting for ADD";
  $(".replay-output").classList.toggle("is-complete", tick >= 509);
  let explanation, values;
  if (tick < 131) {
    explanation =
      "The program counter is at address 0. The clock is running; its next advance will select the first load instruction in ROM.";
    values = `PC = ${f.pc} · instruction word = ${hex(f.word)}`;
  } else if (stage.view === "rom") {
    explanation = `The PC now selects ROM address ${f.pc}. The torch pattern at that address encodes a 16-bit instruction. The instruction bus is still catching up with the new address.`;
    const expected = recording.program.find((p) => p[0] === f.pc);
    values = `Address ${f.pc} → ${expected?.[1] || "0000"} · bus currently ${hex(f.word)}`;
  } else if (tick < 423) {
    const r = tick < 277 ? 1 : 2,
      immediate = r === 1 ? 165 : 60;
    explanation =
      stage.view === "encoding"
        ? `The word has reached the instruction bus. Opcode B selects LDI; its immediate field supplies ${immediate}, and its destination field selects R${r}. This instruction writes the byte directly into the register.`
        : `The write path delivers ${immediate} to R${r}'s eight storage cells. Their signals take time to settle. When the write finishes, the cells retain the byte for the later ADD.`;
    values = `LDI R${r}, ${immediate} · R${r} now = ${f.registers[r - 1]} (${f.registers[r - 1].toString(2).padStart(8, "0")})`;
  } else if (tick < 509) {
    explanation =
      stage.view === "encoding"
        ? "Opcode 1 selects ADD. The register fields select R2 as operand A, R1 as operand B, and R3 as the destination. The CPU reads the two stored bytes; the instruction contains their register numbers."
        : "The ALU adds the bytes from R2 and R1. The output changes as signals propagate through the circuit. The current ALU value below is measured; R3 can show intermediate values until the write settles.";
    values = `R2 (${f.registers[1]}) + R1 (${f.registers[0]}) → ALU now ${f.alu} · expected 225`;
  } else if (tick < 569) {
    explanation =
      "The sum has reached R3. Its eight cells now hold 11100001: 128 + 64 + 32 + 1 = 225. R1 and R2 keep the original operands.";
    values = `${f.registers[1]} + ${f.registers[0]} = ${f.registers[2]} · ALU = ${f.alu}`;
  } else if (tick < 631) {
    explanation =
      "The clock advances the PC past the program. The next ROM word is zero (NOP), so no new register write is selected once it reaches the decoder. The ALU can change while R3 keeps the result.";
    values = `PC = ${f.pc} · bus = ${hex(f.word)} · ALU = ${f.alu} · R3 = ${f.registers[2]}`;
  } else {
    explanation =
      "The ALU has returned to zero, but R3 still holds 225. The result lives in the register's storage cells, ready to be used as an operand by another instruction. The clock continues advancing the PC.";
    values = `R1 = ${f.registers[0]} · R2 = ${f.registers[1]} · ALU = ${f.alu} · R3 = ${f.registers[2]}`;
  }
  $("#trace-explanation").textContent = explanation;
  $("#trace-values").textContent = values;
  $("#trace-seek").value = tick;
  $("#trace-tick").textContent = `${tick} / ${recording.frames.length - 1}`;
  $("#signal-caption").textContent =
    `Game tick ${tick} · orange = on · gray = off`;
  const selected = recording.program.find((p) => p[0] === f.pc);
  const settled = f.word === (selected ? parseInt(selected[1], 16) : 0);
  $("#trace-status").textContent = !settled
    ? "The instruction bus is changing after the PC advance."
    : f.registers[2] === 225
      ? `R3 = 225. ${f.alu === 0 ? "The ALU is now 0; R3 retains the result." : "The result is stored."}`
      : selected
        ? `${selected[2]} · measured register and bus values`
        : "Clock running · no register write selected";
}
$("#follow-replay").addEventListener("change", () => {
  if ($("#follow-replay").checked) replayFocus = "";
  showTick(tick);
});
function stop() {
  playing = false;
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
