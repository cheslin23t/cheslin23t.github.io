// Small cuboids in a block's local coordinates. Directions come from the
// schematic's wire state; no adjacency or powered state is invented here.
export function wireBoxes(state) {
  const boxes = [[0.4, 0.025, 0.4, 0.2, 0.045, 0.2]];
  const arms = {
    north: [0.42, 0.025, 0, 0.16, 0.045, 0.5],
    south: [0.42, 0.025, 0.5, 0.16, 0.045, 0.5],
    west: [0, 0.025, 0.42, 0.5, 0.045, 0.16],
    east: [0.5, 0.025, 0.42, 0.5, 0.045, 0.16],
  };
  const climbs = {
    north: [0.42, 0.045, 0.005, 0.16, 0.955, 0.025],
    south: [0.42, 0.045, 0.97, 0.16, 0.955, 0.025],
    west: [0.005, 0.045, 0.42, 0.025, 0.955, 0.16],
    east: [0.97, 0.045, 0.42, 0.025, 0.955, 0.16],
  };
  for (const direction of Object.keys(arms)) {
    const value = state.match(new RegExp(`${direction}=(none|side|up)`))?.[1];
    if (value === "side" || value === "up") boxes.push(arms[direction]);
    if (value === "up") boxes.push(climbs[direction]);
  }
  return boxes;
}

// Wall torches point away from their support. Rotate the complete stem and cap
// 22.5 degrees, retaining one owning block for crop and recorded probe lookup.
export function torchPoint([x, y, z], state) {
  if (!state.includes("wall_torch")) return [x, y, z];
  const facing = state.match(/facing=(north|south|east|west)/)?.[1];
  const [dx, dz] = {
    east: [1, 0],
    west: [-1, 0],
    south: [0, 1],
    north: [0, -1],
  }[facing];
  const c = Math.cos(Math.PI / 8),
    s = Math.sin(Math.PI / 8);
  const lateral = (x - 0.5) * dx + (z - 0.5) * dz;
  const shift = lateral * (c - 1) + y * s;
  return [
    x - dx * 0.4 + dx * shift,
    0.2 + y * c - lateral * s,
    z - dz * 0.4 + dz * shift,
  ];
}
