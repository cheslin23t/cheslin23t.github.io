import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { wireBoxes, torchPoint } from "../block-geometry.mjs";
const read = (name) => readFile(new URL(`../${name}`, import.meta.url));
const build = JSON.parse(await read("data/build.json"));
const recording = JSON.parse(await read("data/recording.json"));
const blockMap = new Map(
  build.blocks.map(([x, y, z, p]) => [`${x},${y},${z}`, build.palette[p]]),
);
assert.equal(
  createHash("sha256")
    .update(await read("data/8bCPU-repaired-v1.schem"))
    .digest("hex"),
  "7485daa252e126b7ca49d26235e1d47318c78b09fdf3d986da77560b7daac5c9",
);
assert.equal(build.blocks.length, 32543);
let wireStates = 0;
for (const state of build.palette.filter((x) =>
  x.startsWith("minecraft:redstone_wire["),
)) {
  const boxes = wireBoxes(state);
  const sides = [...state.matchAll(/(?:north|south|east|west)=(side|up)/g)];
  assert.equal(
    boxes.length,
    1 + sides.length + sides.filter((m) => m[1] === "up").length,
  );
  for (const b of boxes)
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(b[axis] >= 0 && b[axis] < 1);
      assert.ok(b[axis + 3] > 0 && b[axis] + b[axis + 3] <= 1.00001);
    }
  wireStates++;
}
assert.equal(
  wireBoxes(
    "minecraft:redstone_wire[north=none,east=none,south=none,west=none]",
  ).length,
  1,
);
assert.equal(
  wireBoxes("minecraft:redstone_wire[north=up,east=side,south=none,west=none]")
    .length,
  4,
);
let cells = 0;
for (let r = 1; r <= 15; r++)
  for (let bit = 0; bit < 8; bit++)
    for (const z of [39, 47]) {
      const x = 60 + 2 * r,
        y = 22 + 2 * bit + (r % 2 === 0 ? 1 : 0);
      assert.match(blockMap.get(`${x},${y},${z}`), /^minecraft:repeater\[/);
      cells++;
    }
assert.equal(recording.frames.length, 870);
recording.frames.forEach((f, i) => assert.equal(f.tick, i));
assert.equal(recording.frames[443].word, 0x48c1);
assert.equal(recording.frames[497].alu, 225);
assert.equal(recording.frames[509].registers[2], 225);
assert.equal(recording.frames[650].alu, 0);
assert.equal(recording.frames[650].registers[2], 225);
assert.deepEqual(
  recording.program.map((p) => p[0]),
  [1, 2, 3],
);
for (const bank of recording.registerSnapshot.banks) {
  const decoded = bank.map((bits) =>
    bits.reduce((v, b, i) => v + (b & 1 ? 0 : 1 << i), 0),
  );
  assert.deepEqual(decoded.slice(0, 3), [165, 60, 225]);
}
assert.equal(recording.inverterCaptures[0].probes.input[1].power, "0");
assert.equal(recording.inverterCaptures[1].probes.input[1].power, "15");
assert.equal(recording.inverterCaptures[0].probes.torch[1].lit, "true");
assert.equal(recording.inverterCaptures[1].probes.torch[1].lit, "false");
console.log(
  `Verified ${wireStates} wire states, ${cells} storage locations, 870 trace frames, both register banks, inverter states, and source checksum.`,
);

for (const facing of ["north", "south", "east", "west"]) {
  const state = `minecraft:redstone_wall_torch[facing=${facing},lit=true]`;
  const base = torchPoint([0.5, 0, 0.5], state),
    tip = torchPoint([0.5, 0.625, 0.5], state);
  const [dx, dz] = {
    east: [1, 0],
    west: [-1, 0],
    north: [0, -1],
    south: [0, 1],
  }[facing];
  assert.ok(
    (tip[0] - base[0]) * dx + (tip[2] - base[2]) * dz > 0,
    "Torch leans away from its support",
  );
  assert.ok(
    Math.abs(Math.hypot(...tip.map((v, i) => v - base[i])) - 0.625) < 1e-9,
    "Rotation preserves stem length",
  );
  for (const point of [base, tip])
    assert.ok(point.every((v) => v >= 0 && v <= 1));
}
assert.deepEqual(
  torchPoint([0.5, 0.625, 0.5], "minecraft:redstone_torch[lit=true]"),
  [0.5, 0.625, 0.5],
);
console.log("Verified standing torches and all four wall-torch orientations.");
