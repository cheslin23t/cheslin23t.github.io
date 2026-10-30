import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = async (name) =>
  JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url)));
const [run, physical, build] = await Promise.all(
  ["line-recording.json", "line-signals.json", "build.json"].map(read),
);
assert.equal(run.frames.length, 4470);
assert.equal(run.instructions.length, 28);
assert.equal(physical.changes.length, run.frames.length);
const index = new Map(physical.positions.map((p, i) => [p.join(","), i]));
assert.equal(index.size, physical.positions.length);
const state = [...physical.initial];
const bit = (p) => {
  const v = state[index.get(p.join(","))];
  assert.ok(Number.isInteger(v) && v >= 0 && v <= 15);
  return v > 0;
};
const word = (ps, invert = false) =>
  ps.reduce((v, p, i) => v + ((invert ? !bit(p) : bit(p)) ? 1 << i : 0), 0);
const register = (r, z) =>
  word(
    Array.from({ length: 8 }, (_, i) => [
      60 + 2 * r,
      22 + 2 * i + (r % 2 === 0 ? 1 : 0),
      z,
    ]),
    true,
  );
const expected = Array(8).fill(0),
  checkpoints = new Map();
const reverse4 = (n) =>
  Number.parseInt(
    n.toString(2).padStart(4, "0").split("").reverse().join(""),
    2,
  );
for (const i of run.instructions) {
  assert.ok(
    i.pcTick <= i.wordTick &&
      i.wordTick <= i.settledTick &&
      i.settledTick < i.endTick,
  );
  let opCode, result;
  if (i.op === "LDI") {
    opCode = 11;
    result = i.immediate;
  } else {
    assert.notEqual(i.dest, i.b, "Do not overwrite a live read operand");
    assert.notEqual(i.dest, i.a, "Do not overwrite a live read operand");
    assert.deepEqual(i.operands, [expected[i.a], expected[i.b]]);
    opCode = { INC: 9, ADD: 1, AND: 3 }[i.op];
    result =
      {
        INC: expected[i.b] + 1,
        ADD: expected[i.a] + expected[i.b],
        AND: expected[i.a] & expected[i.b],
      }[i.op] & 255;
  }
  const encoded =
    opCode |
    (reverse4(i.dest) << 4) |
    (i.op === "LDI"
      ? i.immediate << 8
      : (reverse4(i.b) << 8) | (reverse4(i.a) << 12));
  assert.equal(i.word, encoded);
  assert.equal(i.expected, result);
  expected[i.dest] = result;
  checkpoints.set(i.endTick - 1, [...expected]);
  assert.equal(run.frames[i.wordTick].word, encoded);
  assert.equal(run.frames[i.settledTick].registers[i.dest - 1], result);
}
for (let t = 0; t < run.frames.length; t++) {
  const changes = physical.changes[t];
  assert.equal(changes.length % 2, 0);
  for (let j = 0; j < changes.length; j += 2) {
    assert.ok(changes[j] >= 0 && changes[j] < state.length);
    assert.ok(changes[j + 1] >= 0 && changes[j + 1] <= 15);
    state[changes[j]] = changes[j + 1];
  }
  const f = run.frames[t];
  assert.equal(f.tick, t);
  assert.equal(
    word(Array.from({ length: 6 }, (_, i) => [41, 7 + 2 * i, 15])),
    f.pc,
  );
  assert.equal(
    word(Array.from({ length: 16 }, (_, i) => [36, 14, 34 + 2 * i])),
    f.word,
  );
  assert.equal(
    word(Array.from({ length: 8 }, (_, i) => [52, 22 + 2 * i, 18])),
    f.alu,
  );
  for (let r = 1; r <= 7; r++)
    for (const z of [39, 47]) {
      assert.equal(
        register(r, z),
        f.registers[r - 1],
        `R${r} bank ${z} tick ${t}`,
      );
      if (checkpoints.has(t))
        assert.equal(register(r, z), checkpoints.get(t)[r]);
    }
}
assert.deepEqual(
  run.points.map((p) => [p.x, p.y]),
  [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 1],
    [4, 2],
    [5, 2],
    [6, 2],
    [7, 3],
    [8, 3],
  ],
);
for (const p of run.points) {
  const f = run.frames[p.tick];
  assert.equal(f.registers[p.xRegister - 1], p.x);
  assert.equal(f.registers[3], p.rawY);
  assert.equal(p.rawY / 16, p.y);
  assert.equal(p.y, Math.floor((8 + 6 * p.x) / 16));
}
for (const [x, y, z, p] of build.blocks)
  if (
    /^minecraft:(redstone_wire|repeater|comparator|redstone_torch|redstone_wall_torch)\[/.test(
      build.palette[p],
    )
  )
    assert.ok(index.has([x, y, z].join(",")));
console.log(
  "Verified 28 encoded instructions, 4,470 full physical frames, both register banks, and all nine line coordinates.",
);
