export function replayStage(run, t) {
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
      caption: `PC ${i.address} selects ROM word ${i.word.toString(16).toUpperCase().padStart(4, "0")}. The instruction bits travel to the controller.`,
    };
  if (t < Math.min(i.wordTick + 20, i.settledTick))
    return {
      ...base,
      view: "encoding",
      caption: `Opcode ${i.op} targets R${i.dest}. ${i.op === "LDI" ? `The immediate byte is ${i.immediate}.` : `The source ${i.op === "INC" ? `is R${i.b}` : `registers are R${i.a} and R${i.b}`}.`}`,
    };
  if (t < i.settledTick) {
    const current = run.frames[t].registers[i.dest - 1];
    return {
      ...base,
      view: i.op === "LDI" ? "registers" : "operation",
      register: i.op === "LDI" ? i.dest : 0,
      caption: `${i.op} is propagating toward R${i.dest}. Its recorded value is ${current}; the completed result will be ${i.expected}.`,
    };
  }
  let caption;
  if (i.op === "LDI")
    caption = {
      1: "R1 starts X at zero.",
      2: "R2 starts at 8/16: the half-pixel offset rounds the height to the nearest row.",
      3: "R3 stores 6/16, the vertical increment for a slope of 3/8.",
      5: "R5 stores 240 (11110000), the mask that keeps the whole-pixel part of the height.",
    }[i.dest];
  else if (i.op === "INC")
    caption = `R${i.dest} now stores X = ${i.expected}, incremented from R${i.b} = ${i.operands[1]}.`;
  else if (i.op === "ADD")
    caption = `ADD advances the fractional height: ${i.operands[0]}/16 + 6/16 = ${i.expected}/16, written to R${i.dest}.`;
  else
    caption = `AND keeps the upper four bits: ${i.operands[0]} & 240 = ${i.expected}. R4's upper nibble is pixel row ${i.expected / 16}.`;
  return { ...base, view: "registers", register: i.dest, caption };
}

export function roleRegisters(run, tick) {
  let x = 1,
    height = 2;
  for (const i of run.instructions) {
    if (i.settledTick > tick) continue;
    if (i.op === "INC") x = i.dest;
    if (i.op === "ADD") height = i.dest;
  }
  return { x, height };
}
export function advancePosition(position, elapsedMs, speed) {
  return position + (Math.max(0, elapsedMs) * 20 * speed) / 1000;
}
